
package com.trustvault;

import com.trustvault.user.User;
import com.trustvault.user.UserRepository;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

@Service
public class DocumentService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    private static final List<String> ALLOWED_EXTENSIONS =
            List.of(".pdf", ".doc", ".docx", ".txt");

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentPermissionRepository permissionRepository;
    private final S3StorageService s3StorageService;
    private final AuditLogService auditLogService;

    public DocumentService(
            DocumentRepository documentRepository,
            UserRepository userRepository,
            DocumentPermissionRepository permissionRepository,
            S3StorageService s3StorageService,
            AuditLogService auditLogService) {

        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
        this.s3StorageService = s3StorageService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<Document> getMyDocuments(String email) {
        User user = findUser(email);

        return documentRepository
                .findAllByOwner_IdOrderByUploadedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public List<DocumentPermission> getSharedDocuments(String email) {
        return permissionRepository
                .findAllByRecipient_EmailIgnoreCaseOrderByGrantedAtDesc(
                        normalizeEmail(email));
    }

    @Transactional(readOnly = true)
    public List<DocumentPermission> getOwnedDocumentPermissions(
            String email) {

        User owner = findUser(email);

        return permissionRepository
                .findAllByDocument_Owner_EmailIgnoreCaseOrderByGrantedAtDesc(
                        owner.getEmail());
    }

    @Transactional
    public Document getMyDocumentById(String email, Long documentId) {
        Document document = findDocumentOrNotFound(documentId);

        requirePermission(email, document, PermissionType.READ);

        recordAudit(
                normalizeEmail(email),
                documentId,
                "DOCUMENT_VIEW",
                "SUCCESS");

        return document;
    }

    @Transactional
    public DownloadedDocument downloadMyDocument(
            String email,
            Long documentId) {

        String normalizedEmail = normalizeEmail(email);

        Document document = documentRepository.findById(documentId)
                .orElse(null);

        if (document == null) {
            auditLogService.recordEvent(
                    normalizedEmail,
                    "DOCUMENT_DOWNLOAD",
                    documentId,
                    "DENIED",
                    "Document not found or access not permitted");

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found or access not permitted");
        }

        boolean isOwner = document.getOwner() != null
                && document.getOwner().getEmail() != null
                && document.getOwner().getEmail()
                        .equalsIgnoreCase(normalizedEmail);

        boolean hasReadPermission = isOwner
                || hasPermission(
                        normalizedEmail,
                        documentId,
                        PermissionType.READ);

        if (!hasReadPermission) {
            auditLogService.recordEvent(
                    normalizedEmail,
                    "DOCUMENT_DOWNLOAD",
                    documentId,
                    "DENIED",
                    "Document not found or access not permitted");

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found or access not permitted");
        }

        final ResponseInputStream<GetObjectResponse> inputStream;

        try {
            inputStream = s3StorageService.downloadFile(
                    document.getStorageKey());

            if (inputStream == null) {
                throw new IllegalStateException(
                        "Document download stream is unavailable");
            }

        } catch (RuntimeException exception) {
            auditLogService.recordEvent(
                    normalizedEmail,
                    "DOCUMENT_DOWNLOAD",
                    documentId,
                    "FAILED",
                    "Unable to open the document download stream");

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to download the document");
        }

        String contentType = inputStream.response().contentType();

        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        auditLogService.recordEvent(
                normalizedEmail,
                "DOCUMENT_DOWNLOAD",
                documentId,
                "SUCCESS",
                "Authorized download stream opened");

        return new DownloadedDocument(
                document.getFileName(),
                contentType,
                inputStream);
    }

    @Transactional
    public Document uploadDocument(
            String email,
            MultipartFile file) {

        User owner = findUser(email);

        validateUpload(file);

        String originalFileName = file.getOriginalFilename().trim();
        String storageKey;

        try (InputStream inputStream = file.getInputStream()) {

            storageKey = s3StorageService.uploadFile(
                    originalFileName,
                    file.getContentType(),
                    inputStream,
                    file.getSize());

        } catch (IOException | RuntimeException exception) {

            recordAudit(
                    normalizeEmail(email),
                    null,
                    "DOCUMENT_UPLOAD",
                    "FAILED");

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to upload the document");
        }

        try {
            Document document = new Document(
                    originalFileName,
                    storageKey,
                    owner);

            Document saved = documentRepository.save(document);

            recordAudit(
                    normalizeEmail(email),
                    saved.getId(),
                    "DOCUMENT_UPLOAD",
                    "SUCCESS");

            return saved;

        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "File was stored, but document metadata could not be saved. Contact the administrator.");
        }
    }

    @Transactional
    public void deleteDocument(String email, Long documentId) {
        Document document = findDocumentOrNotFound(documentId);

        requirePermission(email, document, PermissionType.DELETE);

        try {
            s3StorageService.deleteFile(document.getStorageKey());

        } catch (RuntimeException exception) {
            recordAudit(
                    normalizeEmail(email),
                    documentId,
                    "DOCUMENT_DELETE",
                    "FAILED");

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to delete the stored document");
        }

        documentRepository.delete(document);

        recordAudit(
                normalizeEmail(email),
                documentId,
                "DOCUMENT_DELETE",
                "SUCCESS");
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(
            String email,
            Long documentId,
            PermissionType requiredPermission) {

        Document document = findDocumentOrNotFound(documentId);
        String normalizedEmail = normalizeEmail(email);

        if (isOwner(normalizedEmail, document)) {
            return true;
        }

        return permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        documentId,
                        normalizedEmail)
                .map(permission -> grants(
                        permission.getPermissionType(),
                        requiredPermission))
                .orElse(false);
    }

    @Transactional
    public void requirePermission(
            String email,
            Document document,
            PermissionType requiredPermission) {

        String normalizedEmail = normalizeEmail(email);

        if (isOwner(normalizedEmail, document)) {
            return;
        }

        boolean allowed = permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        document.getId(),
                        normalizedEmail)
                .map(permission -> grants(
                        permission.getPermissionType(),
                        requiredPermission))
                .orElse(false);

        if (!allowed) {
            recordAudit(
                    normalizedEmail,
                    document.getId(),
                    "ACCESS_" + requiredPermission.name(),
                    "DENIED");

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have permission to perform this action");
        }
    }

    private boolean isOwner(String email, Document document) {
        return document.getOwner() != null
                && document.getOwner().getEmail() != null
                && normalizeEmail(document.getOwner().getEmail())
                        .equals(normalizeEmail(email));
    }

    /**
     * Permission rules:
     * READ       -> READ only
     * WRITE      -> WRITE only
     * READ_WRITE -> READ and WRITE
     * DELETE     -> DELETE only
     *
     * The document owner is handled separately and has full access.
     */
    private boolean grants(
            PermissionType granted,
            PermissionType required) {

        if (granted == null || required == null) {
            return false;
        }

        if (granted == required) {
            return true;
        }

        if (granted == PermissionType.READ_WRITE) {
            return required == PermissionType.READ
                    || required == PermissionType.WRITE;
        }

        return false;
    }

    private Document findDocumentOrNotFound(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"));
    }

    private User findUser(String email) {
        String normalizedEmail = normalizeEmail(email);

        return userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user was not found"));
    }

    private void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a file to upload");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.CONTENT_TOO_LARGE,
                    "File size must not exceed 10 MB");
        }

        String fileName = file.getOriginalFilename();

        if (fileName == null || fileName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file name");
        }

        String normalizedName =
                fileName.trim().toLowerCase(Locale.ROOT);

        if (normalizedName.contains("/")
                || normalizedName.contains("\\")
                || normalizedName.contains("\r")
                || normalizedName.contains("\n")
                || normalizedName.equals(".")
                || normalizedName.equals("..")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file name");
        }

        boolean allowed = ALLOWED_EXTENSIONS.stream()
                .anyMatch(normalizedName::endsWith);

        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PDF, DOC, DOCX and TXT files are allowed");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user email is missing");
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void recordAudit(
            String email,
            Long documentId,
            String action,
            String result) {

        auditLogService.log(
                email,
                documentId,
                action,
                result);
    }

    public record DownloadedDocument(
            String fileName,
            String contentType,
            ResponseInputStream<GetObjectResponse> inputStream) {
    }
}

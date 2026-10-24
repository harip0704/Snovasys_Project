
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

    public record DownloadedDocument(
            String fileName,
            String contentType,
            ResponseInputStream<GetObjectResponse> inputStream) {
    }

    @Transactional(readOnly = true)
    public List<Document> getMyDocuments(String email) {
        String actorEmail = normalizeEmail(email);

        User user = userRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authentication required"));

        return documentRepository
                .findAllByOwner_IdOrderByUploadedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public Document getMyDocumentById(
            String email,
            Long documentId) {

        String actorEmail = normalizeEmail(email);
        Document document = findDocumentOrNotFound(
                actorEmail,
                documentId,
                "DOCUMENT_VIEW");

        requireAccess(document, actorEmail, "DOCUMENT_VIEW");

        auditLogService.recordEvent(
                actorEmail,
                "DOCUMENT_VIEW",
                documentId,
                "SUCCESS",
                "Document metadata accessed by an authorized user");

        return document;
    }

    @Transactional(readOnly = true)
    public DownloadedDocument downloadMyDocument(
            String email,
            Long documentId) {

        String actorEmail = normalizeEmail(email);
        Document document = findDocumentOrNotFound(
                actorEmail,
                documentId,
                "DOCUMENT_DOWNLOAD");

        // Always authorize before contacting S3.
        requireAccess(document, actorEmail, "DOCUMENT_DOWNLOAD");

        try {
            ResponseInputStream<GetObjectResponse> inputStream =
                    s3StorageService.downloadFile(document.getStorageKey());

            if (inputStream == null) {
                throw new IllegalStateException(
                        "Storage returned no download stream");
            }

            String contentType = inputStream.response().contentType();

            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }

            auditLogService.recordEvent(
                    actorEmail,
                    "DOCUMENT_DOWNLOAD",
                    documentId,
                    "SUCCESS",
                    "Authorized download stream opened");

            return new DownloadedDocument(
                    document.getFileName(),
                    contentType,
                    inputStream);

        } catch (RuntimeException exception) {
            auditLogService.recordEvent(
                    actorEmail,
                    "DOCUMENT_DOWNLOAD",
                    documentId,
                    "FAILURE",
                    "Storage could not open the requested download");

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Download failed. Please try again.");
        }
    }

    @Transactional
    public Document uploadDocument(
            String email,
            MultipartFile file) {

        String actorEmail = normalizeEmail(email);

        User user = userRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authentication required"));

        validateUpload(actorEmail, file);

        String originalName = file.getOriginalFilename().trim();

        String contentType = file.getContentType();

        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        try (InputStream inputStream = file.getInputStream()) {

            String storageKey = s3StorageService.uploadFile(
                    originalName,
                    contentType,
                    inputStream,
                    file.getSize());

            if (storageKey == null || storageKey.isBlank()) {
                throw new IllegalStateException(
                        "Storage did not return a storage key");
            }

            Document document = new Document(
                    originalName,
                    storageKey,
                    user);

            Document savedDocument = documentRepository.save(document);

            auditLogService.recordEvent(
                    actorEmail,
                    "DOCUMENT_UPLOAD",
                    savedDocument.getId(),
                    "SUCCESS",
                    "Document uploaded and metadata saved");

            return savedDocument;

        } catch (IOException | RuntimeException exception) {
            auditLogService.recordEvent(
                    actorEmail,
                    "DOCUMENT_UPLOAD",
                    null,
                    "FAILURE",
                    "Upload failed during storage or metadata processing");

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Upload failed. Please try again.");
        }
    }

    private Document findDocumentOrNotFound(
            String actorEmail,
            Long documentId,
            String action) {

        if (documentId == null || documentId <= 0) {
            recordDenied(actorEmail, action, documentId);
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found");
        }

        return documentRepository.findById(documentId)
                .orElseThrow(() -> {
                    recordDenied(actorEmail, action, documentId);

                    return new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Document not found");
                });
    }

    private void requireAccess(
            Document document,
            String actorEmail,
            String action) {

        if (canAccessDocument(document, actorEmail)) {
            return;
        }

        recordDenied(actorEmail, action, document.getId());

        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Document not found");
    }

    private boolean canAccessDocument(
            Document document,
            String actorEmail) {

        if (document.getOwner().getEmail()
                .equalsIgnoreCase(actorEmail)) {
            return true;
        }

        return permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        document.getId(),
                        actorEmail)
                .map(permission ->
                        permission.getPermissionType() == PermissionType.READ
                        || permission.getPermissionType() == PermissionType.EDIT)
                .orElse(false);
    }

    private void validateUpload(
            String actorEmail,
            MultipartFile file) {

        if (file == null || file.isEmpty()) {
            recordUploadDenial(
                    actorEmail,
                    "Upload rejected: no file or empty file");

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a non-empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            recordUploadDenial(
                    actorEmail,
                    "Upload rejected: file exceeds size limit");

            throw new ResponseStatusException(
                    HttpStatus.CONTENT_TOO_LARGE,
                    "Maximum file size is 10 MB");
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            rejectFileName(actorEmail);
        }

        String fileName = originalName.trim();

        if (fileName.length() > 255
                || fileName.equals(".")
                || fileName.equals("..")
                || fileName.contains("/")
                || fileName.contains("\\")
                || fileName.chars().anyMatch(Character::isISOControl)) {
            rejectFileName(actorEmail);
        }

        String lowerName = fileName.toLowerCase(Locale.ROOT);

        boolean allowed = ALLOWED_EXTENSIONS.stream()
                .anyMatch(lowerName::endsWith);

        if (!allowed) {
            recordUploadDenial(
                    actorEmail,
                    "Upload rejected: unsupported file extension");

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PDF, DOC, DOCX and TXT files are allowed");
        }
    }

    private void rejectFileName(String actorEmail) {
        recordUploadDenial(
                actorEmail,
                "Upload rejected: invalid file name");

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid file name");
    }

    private void recordUploadDenial(
            String actorEmail,
            String details) {

        auditLogService.recordEvent(
                actorEmail,
                "DOCUMENT_UPLOAD",
                null,
                "DENIED",
                details);
    }

    private void recordDenied(
            String actorEmail,
            String action,
            Long documentId) {

        auditLogService.recordEvent(
                actorEmail,
                action,
                documentId,
                "DENIED",
                "Document not found or access not permitted");
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        return email.trim();
    }
}

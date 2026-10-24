
package com.trustvault;

import com.trustvault.user.User;
import com.trustvault.user.UserRepository;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DocumentService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    private static final List<String> ALLOWED_EXTENSIONS =
            List.of(".pdf", ".doc", ".docx", ".txt");

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;
    private final AuditLogService auditLogService;

    public DocumentService(
            DocumentRepository documentRepository,
            UserRepository userRepository,
            S3StorageService s3StorageService,
            AuditLogService auditLogService) {

        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<Document> getMyDocuments(String email) {

        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"));

        return documentRepository
                .findAllByOwner_IdOrderByUploadedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public Document getMyDocumentById(String email, Long documentId) {

        String actorEmail = email.trim();

        var documentOptional = documentRepository.findById(documentId);

        if (documentOptional.isEmpty()) {

            auditLogService.recordEvent(
                    actorEmail,
                    "DOCUMENT_VIEW",
                    documentId,
                    "DENIED",
                    "Document not found or access not permitted");

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found");
        }

        Document document = documentOptional.get();

        if (!document.getOwner().getEmail()
                .equalsIgnoreCase(actorEmail)) {

            auditLogService.recordEvent(
                    actorEmail,
                    "DOCUMENT_VIEW",
                    documentId,
                    "DENIED",
                    "Document not found or access not permitted");

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found");
        }

        auditLogService.recordEvent(
                actorEmail,
                "DOCUMENT_VIEW",
                documentId,
                "SUCCESS",
                "Document metadata viewed by owner");

        return document;
    }

    @Transactional
    public Document uploadDocument(String email, MultipartFile file) {

        String actorEmail = email.trim();

        User user = userRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"));

        if (file == null || file.isEmpty()) {

            recordUploadDenial(
                    actorEmail,
                    "Upload rejected: no file selected");

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {

            recordUploadDenial(
                    actorEmail,
                    "Upload rejected: file exceeds 10 MB limit");

            throw new ResponseStatusException(
                    HttpStatus.CONTENT_TOO_LARGE,
                    "Maximum file size is 10 MB");
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null
                || originalName.isBlank()
                || originalName.contains("/")
                || originalName.contains("\\")) {

            recordUploadDenial(
                    actorEmail,
                    "Upload rejected: invalid file name");

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file name");
        }

        String lowerName = originalName.toLowerCase(Locale.ROOT);

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

        String contentType = file.getContentType();

        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        try (var inputStream = file.getInputStream()) {

            String storageKey = s3StorageService.uploadFile(
                    originalName,
                    contentType,
                    inputStream,
                    file.getSize());

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
                    "Document uploaded successfully");

            return savedDocument;

        } catch (IOException | RuntimeException exception) {

            auditLogService.recordEvent(
                    actorEmail,
                    "DOCUMENT_UPLOAD",
                    null,
                    "FAILURE",
                    "Upload failed during file storage or metadata processing");

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Upload failed. Please try again.");
        }
    }

    private void recordUploadDenial(String actorEmail, String details) {

        auditLogService.recordEvent(
                actorEmail,
                "DOCUMENT_UPLOAD",
                null,
                "DENIED",
                details);
    }
}

package com.trustvault;

import com.trustvault.user.User;
import com.trustvault.user.UserRepository;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DocumentPermissionService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentPermissionRepository permissionRepository;
    private final AuditLogService auditLogService;

    public DocumentPermissionService(
            DocumentRepository documentRepository,
            UserRepository userRepository,
            DocumentPermissionRepository permissionRepository,
            AuditLogService auditLogService) {

        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Grants or updates document access.
     * Only the actual document owner can manage permissions.
     */
    @Transactional
    public void grantPermission(
            String ownerEmail,
            Long documentId,
            String recipientEmail,
            PermissionType permissionType) {

        String normalizedOwner = normalizeEmail(ownerEmail);
        String normalizedRecipient = normalizeEmail(recipientEmail);

        if (documentId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document ID is required");
        }

        if (permissionType == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Permission type is required");
        }

        // Find the document by its database ID.
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"));

        // Never allow a non-owner to share this document.
        if (document.getOwner() == null
                || document.getOwner().getEmail() == null
                || !normalizeEmail(document.getOwner().getEmail())
                        .equals(normalizedOwner)) {

            recordAudit(
                    normalizedOwner,
                    documentId,
                    "PERMISSION_GRANT",
                    "DENIED");

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found");
        }

        // Recipient must already have a registered account.
        User recipient = userRepository
                .findByEmailIgnoreCase(normalizedRecipient)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recipient account not found"));

        // Prevent sharing a document with its own owner.
        if (normalizeEmail(recipient.getEmail()).equals(normalizedOwner)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You already own this document");
        }

        // Update an existing permission instead of creating duplicates.
        var existingPermission =
                permissionRepository
                        .findByDocument_IdAndRecipient_EmailIgnoreCase(
                                documentId,
                                normalizedRecipient);

        if (existingPermission.isPresent()) {
            DocumentPermission permission = existingPermission.get();

            permission.setPermissionType(permissionType);
            permissionRepository.save(permission);

            recordAudit(
                    normalizedOwner,
                    documentId,
                    "PERMISSION_UPDATE_" + permissionType.name(),
                    "SUCCESS");

            return;
        }

        // Create a new permission.
        DocumentPermission permission = new DocumentPermission(
                document,
                recipient,
                permissionType);

        permissionRepository.save(permission);

        recordAudit(
                normalizedOwner,
                documentId,
                "PERMISSION_GRANT_" + permissionType.name(),
                "SUCCESS");
    }

    /**
     * Revokes a recipient's permission.
     * Only the document owner may revoke access.
     */
    @Transactional
    public void revokePermission(
            String ownerEmail,
            Long documentId,
            Long recipientId) {

        String normalizedOwner = normalizeEmail(ownerEmail);

        if (documentId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document ID is required");
        }

        if (recipientId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Recipient ID is required");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"));

        // Only the document owner may revoke permission.
        if (document.getOwner() == null
                || document.getOwner().getEmail() == null
                || !normalizeEmail(document.getOwner().getEmail())
                        .equals(normalizedOwner)) {

            recordAudit(
                    normalizedOwner,
                    documentId,
                    "PERMISSION_REVOKE",
                    "DENIED");

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found");
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recipient account not found"));

        DocumentPermission permission = permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        documentId,
                        normalizeEmail(recipient.getEmail()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Permission not found"));

        permissionRepository.delete(permission);

        recordAudit(
                normalizedOwner,
                documentId,
                "PERMISSION_REVOKE",
                "SUCCESS");
    }

    /**
     * Normalizes email addresses for comparisons.
     */
    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user email is missing");
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Records permission-related audit events.
     */
    private void recordAudit(
            String actorEmail,
            Long documentId,
            String action,
            String result) {

        auditLogService.log(
                actorEmail,
                documentId,
                action,
                result);
    }
}
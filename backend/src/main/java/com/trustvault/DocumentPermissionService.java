
package com.trustvault;

import com.trustvault.user.User;
import com.trustvault.user.UserRepository;
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

    @Transactional
    public void grantPermission(
            String ownerEmail,
            Long documentId,
            String recipientEmail,
            PermissionType permissionType) {

        Document document = documentRepository
                .findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"
                ));

        if (!document.getOwner().getEmail()
                .equalsIgnoreCase(ownerEmail)) {
            auditLogService.recordEvent(
                    ownerEmail,
                    "PERMISSION_GRANT",
                    documentId,
                    "DENIED",
                    "Only the document owner can grant access"
            );

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found"
            );
        }

        User recipient = userRepository
                .findByEmailIgnoreCase(recipientEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recipient not found"
                ));

        if (recipient.getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You already own this document"
            );
        }

        if (permissionRepository
                .existsByDocument_IdAndRecipient_EmailIgnoreCase(
                        documentId,
                        recipientEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Permission already exists"
            );
        }

        DocumentPermission permission = new DocumentPermission(
                document,
                recipient,
                permissionType
        );

        permissionRepository.save(permission);

        auditLogService.recordEvent(
                ownerEmail,
                "PERMISSION_GRANT",
                documentId,
                "SUCCESS",
                "Granted " + permissionType
                        + " access to " + recipient.getEmail()
        );
    }

    @Transactional
    public void revokePermission(
            String ownerEmail,
            Long documentId,
            Long recipientId) {

        Document document = documentRepository
                .findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"
                ));

        if (!document.getOwner().getEmail()
                .equalsIgnoreCase(ownerEmail)) {
            auditLogService.recordEvent(
                    ownerEmail,
                    "PERMISSION_REVOKE",
                    documentId,
                    "DENIED",
                    "Only the document owner can revoke access"
            );

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document not found"
            );
        }

        DocumentPermission permission = permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        documentId,
                        userRepository.findById(recipientId)
                                .map(User::getEmail)
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Recipient not found"
                                ))
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Permission not found"
                ));

        permissionRepository.delete(permission);

        auditLogService.recordEvent(
                ownerEmail,
                "PERMISSION_REVOKE",
                documentId,
                "SUCCESS",
                "Revoked access from "
                        + permission.getRecipient().getEmail()
        );
    }
}

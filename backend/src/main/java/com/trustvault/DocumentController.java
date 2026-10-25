
package com.trustvault;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentPermissionService documentPermissionService;
    private final DocumentRepository documentRepository;

    public DocumentController(
            DocumentService documentService,
            DocumentPermissionService documentPermissionService,
            DocumentRepository documentRepository) {
        this.documentService = documentService;
        this.documentPermissionService = documentPermissionService;
        this.documentRepository = documentRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> listDocuments(
            Authentication authentication) {

        List<Document> documents =
                documentService.getMyDocuments(authentication.getName());

        List<Map<String, Object>> items = documents.stream()
                .map(document -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", document.getId());
                    item.put("fileName", document.getFileName());
                    item.put("uploadedAt", document.getUploadedAt().toString());
                    item.put("status", document.getStatus());
                    return item;
                })
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("count", items.size());
        response.put("documents", items);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/shared")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> listSharedDocuments(
            Authentication authentication) {

        List<DocumentPermission> permissions =
                documentService.getSharedDocuments(authentication.getName());

        List<Map<String, Object>> items = permissions.stream()
                .map(permission -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", permission.getDocument().getId());
                    item.put("fileName", permission.getDocument().getFileName());
                    item.put(
                            "permissionType",
                            permission.getPermissionType().name());
                    item.put("grantedAt", permission.getGrantedAt().toString());
                    item.put(
                            "ownerEmail",
                            permission.getDocument().getOwner().getEmail());
                    return item;
                })
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("count", items.size());
        response.put("documents", items);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/permissions/owned")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getOwnedPermissions(
            Authentication authentication) {

        List<DocumentPermission> permissions =
                documentService.getOwnedDocumentPermissions(
                        authentication.getName());

        List<Map<String, Object>> items = permissions.stream()
                .map(permission -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("documentId", permission.getDocument().getId());
                    item.put("fileName", permission.getDocument().getFileName());
                    item.put("recipientId", permission.getRecipient().getId());
                    item.put(
                            "recipientEmail",
                            permission.getRecipient().getEmail());
                    item.put(
                            "permissionType",
                            permission.getPermissionType().name());
                    item.put("grantedAt", permission.getGrantedAt().toString());
                    return item;
                })
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("count", items.size());
        response.put("permissions", items);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getDocumentById(
            Authentication authentication,
            @PathVariable("id") Long documentId) {

        Document document = documentService.getMyDocumentById(
                authentication.getName(),
                documentId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", document.getId());
        response.put("fileName", document.getFileName());
        response.put("uploadedAt", document.getUploadedAt().toString());
        response.put("status", document.getStatus());

        return ResponseEntity.ok(response);
    }

    /**
     * Downloads a document only after the service verifies access permission.
     * The service must return the actual file stream from private storage.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadDocument(
            Authentication authentication,
            @PathVariable("id") Long documentId) {

        DocumentService.DownloadedDocument downloaded =
                documentService.downloadMyDocument(
                        authentication.getName(),
                        documentId);

        if (downloaded.inputStream() == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document file content is unavailable");
        }

        String safeFileName = downloaded.fileName()
                .replaceAll("[\\r\\n\"\\\\]", "_");

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(downloaded.contentType());
        } catch (IllegalArgumentException | NullPointerException exception) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        InputStreamResource resource =
                new InputStreamResource(downloaded.inputStream());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + safeFileName + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .body(resource);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocument(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {

        Document document = documentService.uploadDocument(
                authentication.getName(),
                file);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Document uploaded successfully");
        response.put("id", document.getId());
        response.put("fileName", document.getFileName());
        response.put("uploadedAt", document.getUploadedAt().toString());
        response.put("status", document.getStatus());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/permissions")
    public ResponseEntity<Map<String, String>> grantPermission(
            Authentication authentication,
            @PathVariable("id") Long documentId,
            @Valid @RequestBody GrantPermissionRequest request) {

        documentPermissionService.grantPermission(
                authentication.getName(),
                documentId,
                request.recipientEmail(),
                request.permissionType());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Permission granted successfully"));
    }

    @DeleteMapping("/{id}/permissions/{recipientId}")
    public ResponseEntity<Void> revokePermission(
            Authentication authentication,
            @PathVariable("id") Long documentId,
            @PathVariable("recipientId") Long recipientId) {

        documentPermissionService.revokePermission(
                authentication.getName(),
                documentId,
                recipientId);

        return ResponseEntity.noContent().build();
    }

    /**
     * WRITE and READ_WRITE users may update the document filename.
     */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateDocument(
            Authentication authentication,
            @PathVariable("id") Long documentId,
            @RequestBody UpdateDocumentRequest request) {

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"));

        documentService.requirePermission(
                authentication.getName(),
                document,
                PermissionType.WRITE);

        if (request.fileName() == null
                || request.fileName().isBlank()
                || request.fileName().contains("/")
                || request.fileName().contains("\\")
                || request.fileName().contains("\r")
                || request.fileName().contains("\n")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid file name is required");
        }

        document.renameTo(request.fileName());
        Document saved = documentRepository.save(document);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Document metadata updated successfully");
        response.put("id", saved.getId());
        response.put("fileName", saved.getFileName());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            Authentication authentication,
            @PathVariable("id") Long documentId) {

        documentService.deleteDocument(
                authentication.getName(),
                documentId);

        return ResponseEntity.noContent().build();
    }

    public record UpdateDocumentRequest(String fileName) {
    }
}


package com.trustvault;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentPermissionService documentPermissionService;

    public DocumentController(
            DocumentService documentService,
            DocumentPermissionService documentPermissionService) {
        this.documentService = documentService;
        this.documentPermissionService = documentPermissionService;
    }

    // List documents belonging to the logged-in user.
    @GetMapping
    public ResponseEntity<Map<String, Object>> listDocuments(
            Authentication authentication) {

        List<Document> documents =
                documentService.getMyDocuments(authentication.getName());

        List<Map<String, Object>> responseDocuments = documents.stream()
                .map(document -> Map.<String, Object>of(
                        "id", document.getId(),
                        "fileName", document.getFileName(),
                        "uploadedAt", document.getUploadedAt().toString(),
                        "status", document.getStatus()))
                .toList();

        return ResponseEntity.ok(Map.of(
                "count", responseDocuments.size(),
                "documents", responseDocuments));
    }

    // Return metadata only when the logged-in user owns the document.
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDocumentById(
            Authentication authentication,
            @PathVariable("id") Long documentId) {

        Document document = documentService.getMyDocumentById(
                authentication.getName(),
                documentId);

        Map<String, Object> response = Map.of(
                "id", document.getId(),
                "fileName", document.getFileName(),
                "uploadedAt", document.getUploadedAt().toString(),
                "status", document.getStatus());

        return ResponseEntity.ok(response);
    }

    // Download a document after the service verifies access.
    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadDocument(
            Authentication authentication,
            @PathVariable("id") Long documentId) {

        DocumentService.DownloadedDocument downloadedDocument =
                documentService.downloadMyDocument(
                        authentication.getName(),
                        documentId);

        String safeFileName = downloadedDocument.fileName()
                .replaceAll("[\\r\\n\"\\\\]", "_");

        MediaType mediaType;

        try {
            mediaType = MediaType.parseMediaType(
                    downloadedDocument.contentType());
        } catch (IllegalArgumentException exception) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + safeFileName + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .body(new InputStreamResource(
                        downloadedDocument.inputStream()));
    }

    // Upload a document.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocument(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {

        Document document = documentService.uploadDocument(
                authentication.getName(),
                file);

        Map<String, Object> response = Map.of(
                "message", "Document uploaded successfully",
                "id", document.getId(),
                "fileName", document.getFileName(),
                "uploadedAt", document.getUploadedAt().toString(),
                "status", document.getStatus());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Grant READ or EDIT permission to a registered user.
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

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("message", "Permission granted successfully"));
    }

    // Revoke a recipient's permission from an owned document.
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
}

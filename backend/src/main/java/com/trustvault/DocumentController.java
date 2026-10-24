
package com.trustvault;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
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

    // Fetch metadata for one document, only if the user owns it.
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
}

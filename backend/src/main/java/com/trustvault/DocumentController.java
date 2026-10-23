
package com.trustvault;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listDocuments(
            Authentication authentication) {

        List<Document> documents =
                documentService.getMyDocuments(authentication.getName());

        List<Map<String, Object>> responseDocuments =
                documents.stream()
                        .map(document -> Map.<String, Object>of(
                                "id", document.getId(),
                                "fileName", document.getFileName(),
                                "uploadedAt", document.getUploadedAt().toString(),
                                "status", document.getStatus()
                        ))
                        .toList();

        return ResponseEntity.ok(Map.of(
                "count", responseDocuments.size(),
                "documents", responseDocuments
        ));
    }
}

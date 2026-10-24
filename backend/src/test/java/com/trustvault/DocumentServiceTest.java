
package com.trustvault;

import com.trustvault.user.User;
import com.trustvault.user.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentPermissionRepository permissionRepository;

    @Mock
    private S3StorageService s3StorageService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private DocumentService documentService;

    private User owner;
    private Document document;

    @BeforeEach
    void setUp() {
        owner = mock(User.class);

        document = new Document(
                "contract.txt",
                "documents/test-id/contract.txt",
                owner
        );

        // Simulate the ID normally assigned when the entity is persisted.
        ReflectionTestUtils.setField(document, "id", 1L);
    }

    @Test
    void ownerCanDownloadOwnDocument() {
        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(owner.getEmail())
                .thenReturn("owner.test@example.com");

        @SuppressWarnings("unchecked")
        ResponseInputStream<GetObjectResponse> inputStream =
                mock(ResponseInputStream.class);

        GetObjectResponse response = GetObjectResponse.builder()
                .contentType("text/plain")
                .build();

        when(inputStream.response()).thenReturn(response);

        when(s3StorageService.downloadFile(
                "documents/test-id/contract.txt"))
                .thenReturn(inputStream);

        DocumentService.DownloadedDocument result =
                documentService.downloadMyDocument(
                        "owner.test@example.com",
                        1L
                );

        assertEquals("contract.txt", result.fileName());
        assertEquals("text/plain", result.contentType());
        assertEquals(inputStream, result.inputStream());

        verify(s3StorageService).downloadFile(
                "documents/test-id/contract.txt"
        );

        verify(auditLogService).recordEvent(
                "owner.test@example.com",
                "DOCUMENT_DOWNLOAD",
                1L,
                "SUCCESS",
                "Authorized download stream opened"
        );
    }

    @Test
    void differentUserCannotDownloadOwnersDocument() {
        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(owner.getEmail())
                .thenReturn("owner.test@example.com");

        when(permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        1L,
                        "other.test@example.com"
                ))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> documentService.downloadMyDocument(
                        "other.test@example.com",
                        1L
                )
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                exception.getStatusCode()
        );

        verifyNoInteractions(s3StorageService);

        verify(auditLogService).recordEvent(
                "other.test@example.com",
                "DOCUMENT_DOWNLOAD",
                1L,
                "DENIED",
                "Document not found or access not permitted"
        );
    }

    @Test
    void missingDocumentReturnsNotFoundAndRecordsDenial() {
        when(documentRepository.findById(999L))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> documentService.downloadMyDocument(
                        "owner.test@example.com",
                        999L
                )
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                exception.getStatusCode()
        );

        verifyNoInteractions(s3StorageService);

        verify(auditLogService).recordEvent(
                "owner.test@example.com",
                "DOCUMENT_DOWNLOAD",
                999L,
                "DENIED",
                "Document not found or access not permitted"
        );
    }
}

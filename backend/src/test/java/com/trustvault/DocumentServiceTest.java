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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
    private User recipient;
    private Document document;

    private static final String OWNER_EMAIL = "owner.test@example.com";
    private static final String RECIPIENT_EMAIL = "recipient.test@example.com";

    @BeforeEach
    void setUp() {
        owner = mock(User.class);
        recipient = mock(User.class);

        document = new Document(
                "contract.txt",
                "documents/test-id/contract.txt",
                owner
        );

        ReflectionTestUtils.setField(document, "id", 1L);
    }

    @Test
    void ownerCanDownloadOwnDocument() {
        when(owner.getEmail()).thenReturn(OWNER_EMAIL);

        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

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
                documentService.downloadMyDocument(OWNER_EMAIL, 1L);

        assertEquals("contract.txt", result.fileName());
        assertEquals("text/plain", result.contentType());
        assertEquals(inputStream, result.inputStream());

        verify(s3StorageService).downloadFile(
                "documents/test-id/contract.txt");

        verify(auditLogService).recordEvent(
                OWNER_EMAIL,
                "DOCUMENT_DOWNLOAD",
                1L,
                "SUCCESS",
                "Authorized download stream opened");
    }

    @Test
    void differentUserCannotDownloadOwnersDocument() {
        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        1L, RECIPIENT_EMAIL))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> documentService.downloadMyDocument(
                        RECIPIENT_EMAIL, 1L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

        verifyNoInteractions(s3StorageService);

        verify(auditLogService).recordEvent(
                RECIPIENT_EMAIL,
                "DOCUMENT_DOWNLOAD",
                1L,
                "DENIED",
                "Document not found or access not permitted");
    }

    @Test
    void missingDocumentReturnsNotFoundAndRecordsDenial() {
        when(documentRepository.findById(999L))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> documentService.downloadMyDocument(
                        OWNER_EMAIL, 999L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

        verifyNoInteractions(s3StorageService);

        verify(auditLogService).recordEvent(
                OWNER_EMAIL,
                "DOCUMENT_DOWNLOAD",
                999L,
                "DENIED",
                "Document not found or access not permitted");
    }

    @Test
    void readPermissionAllowsViewButDeniesRenameAndDelete() {
        DocumentPermission permission = new DocumentPermission(
                document, recipient, PermissionType.READ);

        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        1L, RECIPIENT_EMAIL))
                .thenReturn(Optional.of(permission));

        assertTrue(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.READ));

        assertFalse(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.WRITE));

        assertFalse(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.DELETE));
    }

    @Test
    void writePermissionAllowsRenameButDeniesViewAndDownload() {
        DocumentPermission permission = new DocumentPermission(
                document, recipient, PermissionType.WRITE);

        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        1L, RECIPIENT_EMAIL))
                .thenReturn(Optional.of(permission));

        assertFalse(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.READ));

        assertTrue(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.WRITE));

        assertFalse(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.DELETE));
    }

    @Test
    void readWritePermissionAllowsReadAndWriteButNotDelete() {
        DocumentPermission permission = new DocumentPermission(
                document, recipient, PermissionType.READ_WRITE);

        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        1L, RECIPIENT_EMAIL))
                .thenReturn(Optional.of(permission));

        assertTrue(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.READ));

        assertTrue(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.WRITE));

        assertFalse(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.DELETE));
    }

    @Test
    void revokedPermissionDeniesSubsequentAccessCheck() {
        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        1L, RECIPIENT_EMAIL))
                .thenReturn(Optional.empty());

        assertFalse(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.READ));

        assertFalse(documentService.hasPermission(
                RECIPIENT_EMAIL, 1L, PermissionType.WRITE));
    }

    @Test
    void requirePermissionThrowsForbiddenWhenAccessIsDenied() {
        when(permissionRepository
                .findByDocument_IdAndRecipient_EmailIgnoreCase(
                        1L, RECIPIENT_EMAIL))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> documentService.requirePermission(
                        RECIPIENT_EMAIL,
                        document,
                        PermissionType.READ));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());

        verify(auditLogService).log(
                RECIPIENT_EMAIL,
                1L,
                "ACCESS_READ",
                "DENIED");
    }
}
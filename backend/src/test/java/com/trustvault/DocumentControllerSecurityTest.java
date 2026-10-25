package com.trustvault;

import com.trustvault.user.CustomUserDetailsService;
import com.trustvault.user.User;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DocumentController.class)
@Import(SecurityConfig.class)
class DocumentControllerSecurityTest {

    private static final String USER_EMAIL = "owner@example.com";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DocumentService documentService;

    @MockitoBean
    private DocumentPermissionService documentPermissionService;

    @MockitoBean
    private DocumentRepository documentRepository;

    @MockitoBean
    private AuditLogService auditLogService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private User owner;
    private Document document;

    @BeforeEach
    void setUp() {
        owner = org.mockito.Mockito.mock(User.class);
        when(owner.getEmail()).thenReturn(USER_EMAIL);

        document = new Document(
                "contract.txt",
                "documents/test-id/contract.txt",
                owner
        );

        ReflectionTestUtils.setField(document, "id", 1L);
    }

    @Test
    void unauthenticatedUserCannotListDocuments() throws Exception {
        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(documentService);
    }

    @Test
    void unauthenticatedUserCannotDownloadDocument() throws Exception {
        mockMvc.perform(get("/api/documents/1/download"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(documentService);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void authenticatedUserCanRequestDocumentList() throws Exception {
        when(documentService.getMyDocuments(USER_EMAIL))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk());

        verify(documentService).getMyDocuments(USER_EMAIL);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void inaccessibleDocumentReturnsNotFound() throws Exception {
        doThrow(new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Document not found"))
                .when(documentService)
                .getMyDocumentById(USER_EMAIL, 99L);

        mockMvc.perform(get("/api/documents/99"))
                .andExpect(status().isNotFound());

        verify(documentService).getMyDocumentById(USER_EMAIL, 99L);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void unauthorizedDownloadReturnsNotFound() throws Exception {
        doThrow(new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Document not found"))
                .when(documentService)
                .downloadMyDocument(USER_EMAIL, 99L);

        mockMvc.perform(get("/api/documents/99/download"))
                .andExpect(status().isNotFound());

        verify(documentService).downloadMyDocument(USER_EMAIL, 99L);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void authenticatedUserCanRequestSharedDocumentList() throws Exception {
        when(documentService.getSharedDocuments(USER_EMAIL))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/documents/shared"))
                .andExpect(status().isOk());

        verify(documentService).getSharedDocuments(USER_EMAIL);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void readOnlyUserCannotRenameDocument() throws Exception {
        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        doThrow(new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action"))
                .when(documentService)
                .requirePermission(
                        USER_EMAIL,
                        document,
                        PermissionType.WRITE);

        mockMvc.perform(put("/api/documents/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fileName": "renamed.txt"
                                }
                                """))
                .andExpect(status().isForbidden());

        verify(documentService).requirePermission(
                USER_EMAIL,
                document,
                PermissionType.WRITE);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void userWithWritePermissionCanRenameDocument() throws Exception {
        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        when(documentRepository.save(document))
                .thenReturn(document);

        mockMvc.perform(put("/api/documents/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fileName": "renamed.txt"
                                }
                                """))
                .andExpect(status().isOk());

        verify(documentService).requirePermission(
                USER_EMAIL,
                document,
                PermissionType.WRITE);

        verify(documentRepository).save(document);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void invalidFileNameIsRejected() throws Exception {
        when(documentRepository.findById(1L))
                .thenReturn(Optional.of(document));

        mockMvc.perform(put("/api/documents/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fileName": "../private.txt"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void deniedDeleteRequestReturnsForbidden() throws Exception {
        doThrow(new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action"))
                .when(documentService)
                .deleteDocument(USER_EMAIL, 1L);

        mockMvc.perform(delete("/api/documents/1"))
                .andExpect(status().isForbidden());

        verify(documentService).deleteDocument(USER_EMAIL, 1L);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void ownerCanDeleteDocumentWhenServiceAllowsIt() throws Exception {
        mockMvc.perform(delete("/api/documents/1"))
                .andExpect(status().isNoContent());

        verify(documentService).deleteDocument(USER_EMAIL, 1L);
    }

    @Test
    @WithMockUser(username = USER_EMAIL)
    void deniedPermissionRevokeReturnsForbidden() throws Exception {
        doThrow(new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action"))
                .when(documentPermissionService)
                .revokePermission(USER_EMAIL, 1L, 2L);

        mockMvc.perform(delete("/api/documents/1/permissions/2"))
                .andExpect(status().isForbidden());

        verify(documentPermissionService)
                .revokePermission(USER_EMAIL, 1L, 2L);
    }
}
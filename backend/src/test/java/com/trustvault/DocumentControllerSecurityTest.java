
package com.trustvault;

import com.trustvault.user.CustomUserDetailsService;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
    private AuditLogService auditLogService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

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
}

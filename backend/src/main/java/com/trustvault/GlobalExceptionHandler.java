
package com.trustvault;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import java.util.Map;


import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final AuditLogService auditLogService;

    public GlobalExceptionHandler(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException exception,
            HttpServletRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null
                && !"anonymousUser".equals(authentication.getName())) {

            auditLogService.recordEvent(
                    authentication.getName(),
                    "DOCUMENT_UPLOAD",
                    null,
                    "DENIED",
                    "Upload rejected: file or request exceeds configured size limit");
        }

        return ResponseEntity.status(413).body(Map.of(
                "error", "Upload rejected: file or request exceeds configured size limit",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(
            ResponseStatusException exception,
            HttpServletRequest request) {

        String message = exception.getReason();

        if (message == null || message.isBlank()) {
            message = "The request could not be completed.";
        }

        return ResponseEntity.status(exception.getStatusCode()).body(Map.of(
                "error", message,
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {

        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getDefaultMessage())
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse("Please check the request fields.");

        return ResponseEntity.badRequest().body(Map.of(
                "error", message,
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadableRequest(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {

        return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid request body. Check the email and permission type.",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(
            ConstraintViolationException exception,
            HttpServletRequest request) {

        String message = exception.getConstraintViolations()
                .stream()
                .map(violation -> violation.getMessage())
                .findFirst()
                .orElse("Request validation failed.");

        return ResponseEntity.badRequest().body(Map.of(
                "error", message,
                "path", request.getRequestURI()));
    }
}

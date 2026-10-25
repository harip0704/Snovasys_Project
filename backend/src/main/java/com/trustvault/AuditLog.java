
package com.trustvault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String actorEmail;

    @Column(nullable = false, length = 100)
    private String action;

    @Column
    private Long documentId;

    @Column(nullable = false, length = 30)
    private String result;

    @Column(length = 500)
    private String details;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected AuditLog() {
        // Required by JPA
    }

    public AuditLog(
            String actorEmail,
            String action,
            Long documentId,
            String result,
            String details) {

        if (actorEmail == null || actorEmail.isBlank()) {
            throw new IllegalArgumentException("Actor email is required");
        }

        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("Audit action is required");
        }

        if (result == null || result.isBlank()) {
            throw new IllegalArgumentException("Audit result is required");
        }

        this.actorEmail = actorEmail.trim();
        this.action = action;
        this.documentId = documentId;
        this.result = result;
        this.details = details;
        this.createdAt = LocalDateTime.now();
    }

     public Long getId() {
    return id;

    }

    public String getActorEmail() {
        return actorEmail;
    }

    public String getAction() {
        return action;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public String getResult() {
        return result;
    }

    public String getDetails() {
        return details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

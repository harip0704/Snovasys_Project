
package com.trustvault;

import jakarta.persistence.*;
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
    }

    public AuditLog(
            String actorEmail,
            String action,
            Long documentId,
            String result,
            String details) {

        this.actorEmail = actorEmail;
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

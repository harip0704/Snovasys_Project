
package com.trustvault;

import com.trustvault.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "document_permissions",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_document_permission_recipient",
            columnNames = {"document_id", "recipient_id"}
        )
    },
    indexes = {
        @Index(
            name = "idx_permission_recipient",
            columnList = "recipient_id"
        )
    }
)
public class DocumentPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PermissionType permissionType;

    @Column(nullable = false, updatable = false)
    private LocalDateTime grantedAt;

    protected DocumentPermission() {
    }

    public DocumentPermission(
            Document document,
            User recipient,
            PermissionType permissionType) {

        this.document = document;
        this.recipient = recipient;
        this.permissionType = permissionType;
        this.grantedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Document getDocument() {
        return document;
    }

    public User getRecipient() {
        return recipient;
    }

    public PermissionType getPermissionType() {
        return permissionType;
    }

    public LocalDateTime getGrantedAt() {
        return grantedAt;
    }
}

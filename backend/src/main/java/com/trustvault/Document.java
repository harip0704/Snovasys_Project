
package com.trustvault;

import com.trustvault.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(nullable = false, unique = true, length = 512)
    private String storageKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    protected Document() {
        // Required by JPA
    }

    public Document(String fileName, String storageKey, User owner) {
        renameTo(fileName);
        this.storageKey = storageKey;
        this.owner = owner;
        this.uploadedAt = LocalDateTime.now();
        this.status = "ACTIVE";
    }

    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    /**
     * Changes the displayed filename without changing the S3 storage key.
     */
    public void renameTo(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("File name is required");
        }

        String normalized = fileName.trim();

        if (normalized.length() > 255
                || normalized.contains("/")
                || normalized.contains("\\")
                || normalized.contains("\r")
                || normalized.contains("\n")) {
            throw new IllegalArgumentException("Invalid file name");
        }

        this.fileName = normalized;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public User getOwner() {
        return owner;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public String getStatus() {
        return status;
    }
}

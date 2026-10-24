
package com.trustvault;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final String bucketName;

    public S3StorageService(
            S3Client s3Client,
            @Value("${trustvault.aws.bucket}") String bucketName) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
    }

    public String uploadFile(
            String originalFileName,
            String contentType,
            InputStream inputStream,
            long fileSize) throws IOException {

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new IllegalArgumentException("File name is required");
        }

        if (fileSize <= 0 || fileSize > 10 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "File must be between 1 byte and 10 MB");
        }

        String safeFileName = originalFileName
                .replaceAll("[^a-zA-Z0-9._-]", "_");

        String storageKey = "documents/"
                + UUID.randomUUID()
                + "/"
                + safeFileName;

        String safeContentType =
                contentType == null || contentType.isBlank()
                        ? "application/octet-stream"
                        : contentType;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(storageKey)
                .contentType(safeContentType)
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromInputStream(inputStream, fileSize));

        return storageKey;
    }
}


package com.trustvault;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

@Service
public class S3StorageService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final String STORAGE_PREFIX = "documents/";

    private final S3Client s3Client;
    private final String bucketName;

    public S3StorageService(
            S3Client s3Client,
            @Value("${trustvault.aws.bucket}") String bucketName) {

        this.s3Client = s3Client;
        this.bucketName = bucketName;
    }

    /**
     * Uploads a file to the configured private S3 bucket.
     * Returns the generated storage key, not a public URL.
     */
    public String uploadFile(
            String originalFileName,
            String contentType,
            InputStream inputStream,
            long fileSize) throws IOException {

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new IllegalArgumentException("File name is required");
        }

        if (inputStream == null) {
            throw new IllegalArgumentException("File content is required");
        }

        if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File must be between 1 byte and 10 MB");
        }

        // Keep only a safe filename for the S3 object key.
        String safeFileName = originalFileName
                .replaceAll("[^a-zA-Z0-9._-]", "_");

        String storageKey = STORAGE_PREFIX
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

    /**
     * Downloads an S3 object using its stored key.
     * Authorization must be checked by the service/controller
     * before this method is called.
     */
    public ResponseInputStream<GetObjectResponse> downloadFile(
            String storageKey) {

        if (storageKey == null
                || storageKey.isBlank()
                || !storageKey.startsWith(STORAGE_PREFIX)
                || storageKey.contains("..")) {

            throw new IllegalArgumentException("Invalid storage key");
        }

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(storageKey)
                .build();

        return s3Client.getObject(request);
    }

    
    /**
     * Deletes an object from the private S3 bucket.
     * Call only after authorization has been verified.
     */
    public void deleteFile(String storageKey) {

        if (storageKey == null
                || storageKey.isBlank()
                || !storageKey.startsWith(STORAGE_PREFIX)
                || storageKey.contains("..")) {
            throw new IllegalArgumentException("Invalid storage key");
        }

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(storageKey)
                .build();

        s3Client.deleteObject(request);
    }

}

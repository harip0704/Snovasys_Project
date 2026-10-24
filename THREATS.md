# TrustVault Threat Model

## 1. Purpose

This document identifies the main security risks considered during the development of TrustVault and describes the controls planned to reduce them.

The main objective is to ensure that only authorized users can access sensitive documents and that important access events can be investigated.

## 2. Assets to Protect

- Uploaded documents and their contents.
- User accounts and authentication credentials.
- Document ownership and permission records.
- Client-specific information.
- Audit logs and access history.
- Database credentials and cloud storage credentials.

## 3. Potential Threats and Mitigations

### Threat 1: Unauthorized Document Access

**Risk:** A user accesses a document without having permission.

**Planned mitigation:** The backend will authenticate the user and verify document-level permissions before allowing access.

### Threat 2: Cross-Client Data Exposure

**Risk:** A user from one client accesses another client's documents by changing a document ID or API request.

**Planned mitigation:** Every document request will be checked against the authenticated user's permissions and the relevant ownership or client boundary.

### Threat 3: Excessive Permissions

**Risk:** A user receives more access than required.

**Planned mitigation:** Apply the principle of least privilege and grant only the permissions needed for the user's role and assigned documents.

### Threat 4: Access After Permission Revocation

**Risk:** A user continues accessing a document after their permission has been removed.

**Planned mitigation:** Check current permissions for protected operations and test that revoked access is denied. Any temporary download links will have a limited lifetime.

### Threat 5: Insecure File Storage

**Risk:** Sensitive documents become publicly accessible through cloud storage.

**Planned mitigation:** Keep the S3 bucket private, restrict cloud permissions, and allow downloads only through a controlled authorization flow.

### Threat 6: Audit Log Tampering

**Risk:** A user modifies or deletes audit records to hide document access.

**Planned mitigation:** Restrict write access to audit records, separate audit operations from ordinary user operations, and test that unauthorized users cannot modify or delete audit events.

### Threat 7: Malicious File Uploads

**Risk:** A user uploads an oversized or unexpected file.

**Planned mitigation:** Validate file size and allowed file types, enforce upload limits, and avoid trusting the filename or content type supplied by the client.

### Threat 8: Credential Exposure

**Risk:** Database passwords or cloud access keys are committed to source control.

**Planned mitigation:** Keep secrets in environment-specific configuration or an appropriate secrets manager. Exclude secret files from Git and use least-privilege credentials.

## 4. Security Testing Plan

The following cases will be tested as the application is implemented:

- Unauthenticated requests to protected endpoints are rejected.
- Users without document permission cannot download the document.
- Users cannot access another client's documents by changing an identifier.
- Revoked permissions prevent subsequent authorized operations.
- Users cannot perform administrative actions without the required role.
- Unauthorized users cannot modify or delete audit records.
- Invalid and oversized uploads are rejected.
- Secrets are not included in source control.

## 5. Current Status

This is the initial threat model. The mitigations listed above are planned controls and must be implemented and verified through testing before they can be considered complete.

## 6. Guiding Principle

Security decisions must be enforced by the backend. A user interface restriction alone is not sufficient to protect a document.


## Document Upload Security

### Threats
- Users may upload unsupported or potentially unsafe file types.
- Oversized uploads may consume excessive server resources.
- Rejected upload attempts may go unrecorded, weakening the audit trail.

### Implemented Controls
- Only PDF, DOC, DOCX, and TXT extensions are accepted by the application validation.
- The application enforces a 10 MB file-size limit.
- Multipart requests exceeding the configured limit are rejected.
- Successful uploads and tested validation rejections are recorded in the audit log.
- Audit entries record the actor email, action, result, details, and timestamp.

### Verification
- Valid TXT upload: HTTP 201; audit result SUCCESS.
- Unsupported EXE upload: HTTP 400; audit result DENIED.
- 11 MB TXT upload: HTTP 413; audit result DENIED.
- The above scenarios were manually tested against the local application and SQL Server audit records.

### Remaining Risks
- File extensions and MIME types alone do not prove that file contents are safe.
- S3 failures and database failures require additional failure-path testing.
- Audit logging should be protected against unauthorized modification or deletion.
- Duplicate requests may create multiple audit entries and should be investigated when unexpected.

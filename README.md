# TrustVault – Secure Document Management System

## About the Project

TrustVault is a secure document management and sharing platform designed to protect confidential files and provide a reliable record of document activity.

Organizations frequently share sensitive documents such as employee records, customer contracts, financial reports, technical drawings, and audit documents. Traditional document-sharing systems may expose files through excessive permissions, unauthorized access, or sharing links that remain active after access has been revoked.

TrustVault addresses these challenges through document-level access control, role-based authorization, secure file storage, permission management, and audit logging.

The primary goal of TrustVault is to ensure that only explicitly authorized users can access a document and that document-related activities can be investigated through an auditable record.

**Project Name:** TrustVault  
**Project Type:** Secure Document Management System  
**Challenge:** Snovasys Fresher Hiring Challenge 2026  
**Development Period:** October 19–25, 2026  
**Application Type:** Web Application

## Problem Statement

Organizations need a reliable way to manage confidential documents without exposing them to unauthorized users.

The major problems addressed by TrustVault are:

- Unauthorized users accessing documents belonging to other users.
- Excessive permissions that expose more documents than intended.
- Users retaining access after their permissions have been revoked.
- Unauthorized document downloads, modifications, or deletions.
- Missing or unreliable records of document activity.
- Insufficient validation of uploaded files.
- Difficulty identifying who accessed a document and when.

TrustVault addresses these problems by enforcing authorization on the server for every protected operation, storing files privately, maintaining document-level permissions, and recording successful and denied access attempts.

## Project Objectives

The main objectives of TrustVault are:

1. Implement secure user authentication.
2. Support Administrator, Document Owner, and Viewer roles.
3. Allow users to upload, organize, search, and manage documents.
4. Provide document-specific read and edit permissions.
5. Allow document owners to grant and revoke access.
6. Prevent unauthorized document viewing, downloading, modification, and deletion.
7. Maintain an audit trail of document and permission-related activities.
8. Provide search by document name, owner, category, and date.
9. Validate uploaded files, file types, and file sizes.
10. Provide an administrative dashboard for monitoring document activity.
11. Develop automated security tests for cross-user access and authorization failures.
12. Document identified threats, security decisions, AI-assisted development, and known limitations.

## Key Features

### 1. Authentication

- User login and logout.
- Secure password handling.
- Authenticated access to protected application features.
- Password recovery and reset workflows, where implemented.
- Session or token management with appropriate expiration.

### 2. Document Management

- Upload documents.
- View a list of accessible documents.
- Organize documents using categories and metadata.
- Search and filter documents.
- Download documents after authorization.
- Edit document metadata and content, where supported.
- Delete documents according to the permission model.

### 3. Document-Level Permissions

- Grant read access to named users.
- Grant edit access to named users.
- Revoke previously granted permissions.
- Enforce permissions on the backend.
- Prevent access through unauthorized API requests.

### 4. Audit Trail

Record relevant events such as:

- Successful and denied document access attempts.
- Document uploads and downloads.
- Document updates and deletions.
- Permission grants and revocations.
- Authentication and authorization failures, where configured.

Audit records should include the actor, action, target document, timestamp, outcome, and relevant request metadata.

### 5. Administrative Dashboard

- View document activity.
- Review permission changes.
- Investigate denied access attempts.
- Monitor suspicious or repeated authorization failures.
- Review audit events according to administrative privileges.

### 6. File Validation

- Validate allowed file types.
- Enforce maximum upload size.
- Reject empty or malformed uploads where applicable.
- Generate safe storage identifiers.
- Avoid trusting client-provided filenames or MIME types alone.

## User Roles and Permissions

TrustVault uses role-based access control together with document-level permissions.

| Feature | Administrator | Document Owner | Viewer |
|---|---|---|---|
| Access administrative dashboard | Yes | No | No |
| Review system-wide audit activity | Yes | No | No |
| Upload documents | As explicitly permitted | Yes | No by default |
| View own documents | If authorized | Yes | If authorized |
| Read documents shared with them | If authorized | If authorized | Yes |
| Edit documents | If explicitly permitted | Own documents | Only if granted edit permission |
| Grant document permissions | According to policy | Own documents | No |
| Revoke document permissions | According to policy | Own documents | No |
| Delete documents | According to policy | Own documents | No |

**Authorization principle:** A role does not automatically grant access to every document. Document ownership, explicit grants, the requested operation, and applicable administrative policies must be checked by the backend.

Administrative access should not silently bypass document-level security. Any exceptional administrative access must be explicitly designed, authorized, and audited.

## System Architecture

TrustVault follows a layered web application architecture.

### Frontend Layer

**Technology:** React and TypeScript

Responsibilities:

- Display the login page and application dashboard.
- Provide document upload and management interfaces.
- Display document permissions and sharing controls.
- Support document search and filtering.
- Display audit information to authorized users.
- Communicate with the backend through REST APIs.

The frontend improves usability but is not responsible for enforcing security decisions.

### Backend Layer

**Technology:** Java and Spring Boot

Responsibilities:

- Authenticate users.
- Enforce role-based and document-level authorization.
- Validate requests and uploaded files.
- Process document operations.
- Grant and revoke permissions.
- Generate and retrieve audit events.
- Communicate with SQL Server and private file storage.

All protected operations must be authorized on the server.

### Database Layer

**Technology:** Microsoft SQL Server

Stores structured application data such as:

- User accounts and roles.
- Document metadata.
- Document ownership.
- Document-level permissions.
- Audit events.
- Relevant document and permission status information.

Passwords must be stored as secure password hashes, never as plaintext.

### File Storage Layer

**Technology:** Private AWS S3 bucket

Responsibilities:

- Store uploaded document content.
- Prevent public access to confidential files.
- Keep storage credentials on the backend.
- Retrieve files only after authorization.
- Avoid exposing permanent public file URLs.

The backend should verify authorization before issuing a download or streaming file content. If presigned URLs are used, their short expiration and revocation limitations must be considered.

### Architecture Flow

1. A user interacts with the React frontend.
2. The frontend sends a request to the Spring Boot backend.
3. The backend authenticates the user and checks authorization.
4. The backend reads or updates application data in SQL Server.
5. For file operations, the backend accesses private S3 storage after authorization.
6. Relevant successful and denied operations are recorded in the audit trail.
7. The backend returns an appropriate response to the frontend.

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Programming Language | TypeScript | Frontend type safety |
| Build Tool | Vite | Frontend development and build |
| Backend | Java | Server-side application logic |
| Backend Framework | Spring Boot | REST APIs and application services |
| Security | Spring Security | Authentication and authorization |
| Database | Microsoft SQL Server | Structured application data |
| Database Access | Spring Data JPA / Hibernate | Database persistence |
| File Storage | AWS S3 | Private document storage |
| Testing | JUnit 5 | Automated backend tests |
| Security Testing | Spring Security Test and MockMvc | Authorization and API security tests |
| Version Control | Git | Source control and development history |
| Repository Hosting | GitHub | Source code and collaboration |
| Optional Automation | n8n | Workflow automation, if time permits |
| Optional AI | LLM integration | Human-reviewed suggestions, if implemented |

The core security model does not depend on AI. Any AI-generated sharing recommendation must require explicit human approval and must never grant access automatically.

## Project Structure

The planned project structure is:

```text
TrustVault/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── .../
│   │   │   │       ├── config/
│   │   │   │       ├── controller/
│   │   │   │       ├── service/
│   │   │   │       ├── repository/
│   │   │   │       ├── entity/
│   │   │   │       ├── dto/
│   │   │   │       ├── security/
│   │   │   │       ├── audit/
│   │   │   │       └── exception/
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   └── pom.xml
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   ├── API.md
│   └── architecture.md
│
├── THREATS.md
├── PROMPTS.md
├── README.md
└── .gitignore
```

This is the intended structure. Update it to match the actual files and folders created in the repository.

## Application Workflow

### 1. User Login

The user enters their credentials. The backend verifies them and establishes an authenticated session or issues an appropriately protected token.

### 2. Dashboard Access

The application displays features permitted for the user's role and document-level access.

### 3. Document Upload

An authorized user selects a document. The backend validates the file and metadata, stores the content privately, saves the metadata, and records the upload event.

### 4. Document Listing and Search

The backend returns only documents the user is allowed to discover. Search filters are applied without exposing other users' confidential metadata.

### 5. Document Sharing

A document owner selects a named user and assigns a read or edit permission. The backend validates ownership and records the permission change.

### 6. Document Access

When a user reads or downloads a document, the backend verifies authentication, document access, and the required permission before returning the content.

### 7. Permission Revocation

The owner revokes a user's permission. Subsequent requests must be denied immediately after the revocation takes effect.

Previously issued download URLs, cached copies, and already downloaded files require separate consideration because revocation cannot erase copies already obtained by a recipient.

### 8. Audit Review

Authorized administrators review document activity, permission changes, and denied access attempts through the administrative dashboard.

## Authentication and Authorization

Authentication establishes the identity of a user. Authorization determines what that user can do.

TrustVault uses Spring Security to implement server-side security controls.

### Authentication

- Verify user credentials securely.
- Hash passwords using an appropriate password-hashing algorithm.
- Protect authentication endpoints against abuse.
- Use secure session handling or carefully configured token-based authentication.
- Enforce authentication on protected endpoints.
- Avoid exposing credentials, tokens, or sensitive details in logs.

### Authorization

Each protected request must be checked against the applicable security policy.

For a document operation, the backend should verify:

1. The user is authenticated.
2. The document exists.
3. The user is permitted to discover or access the document.
4. The requested action is allowed by ownership, role, and explicit grants.
5. The permission has not been revoked.
6. The operation is allowed under any additional security restrictions.

The authorization check must be applied to every relevant API endpoint, including download, update, delete, and permission-management endpoints.

Hiding a button or restricting frontend navigation is not sufficient security.

## Document Management

TrustVault manages document content separately from document metadata.

### Document Metadata

Each document may contain:

- Unique document ID.
- Original filename.
- Storage key.
- Owner ID.
- Category.
- Content type.
- File size.
- Upload timestamp.
- Last modification timestamp.
- Current status.

### Upload

The backend validates the uploaded file before accepting it. It generates a unique storage key rather than using an untrusted filename as the storage path.

The document metadata and storage operation should be handled with appropriate failure recovery so that incomplete uploads do not create inconsistent records.

### Search

Authorized users can search and filter documents by:

- Document name.
- Document owner.
- Category.
- Upload date or date range.

Search results must respect the user's document visibility permissions.

### Update and Delete

Only authorized users may update or delete a document. Destructive operations must be audited. Where practical, soft deletion and recovery can be considered, but their behavior must be documented and tested.

## Access Control Mechanism

TrustVault uses a deny-by-default approach with document-level authorization.

### Permission Model

The supported permission types are:

- **READ:** Allows an authorized user to view or download a document.
- **EDIT:** Allows an authorized user to modify a document, subject to the defined policy.

The application may also define owner-only operations, such as granting and revoking access or deleting a document.

### Access Decision

For every protected operation, the backend checks the authenticated user, target document, requested action, ownership, and applicable permission grants.

Access is denied when:

- The user is unauthenticated.
- The document does not exist or is not accessible.
- No applicable permission exists.
- The requested operation exceeds the granted permission.
- Access has been revoked.
- The request violates another security policy.

The API must not rely on a document ID being difficult to guess. Every document ID supplied by a client must be checked against the current user's authorization.

### Immediate Revocation

Permission revocation must take effect on subsequent protected requests without waiting for a long-lived application cache to expire.

The backend must not continue trusting stale permission data. Any caching strategy must support reliable invalidation.

Private S3 objects must not be directly accessible to unauthorized users. If presigned URLs are used, a URL that has already been issued may remain usable until it expires. Therefore, short-lived URLs or backend-mediated downloads should be selected according to the revocation requirements.

## Audit Logging

The audit trail records important security and document-management events.

### Audited Events

- Login success and failure, where configured.
- Document upload.
- Document view or download.
- Document modification.
- Document deletion.
- Permission grant.
- Permission revocation.
- Denied document access.
- Unauthorized modification or deletion attempts.

### Audit Record Fields

Each audit record should include:

- Unique event ID.
- Actor or authenticated user ID, when known.
- Action type.
- Target document or resource ID.
- Timestamp.
- Success or failure outcome.
- Reason or event details, where safe.
- Request correlation ID and limited security-relevant metadata, where appropriate.

### Audit Integrity

Audit events should be written by trusted backend services rather than accepted from the frontend.

Ordinary users must not be able to edit or delete audit records through application APIs. Access to audit data must be restricted and itself monitored.

For stronger tamper detection, the system can use append-only database permissions, protected backups, cryptographic hash chaining, or an independently controlled audit destination.

A hash chain alone is not sufficient if an attacker can rewrite the entire chain and its trusted starting point. Stronger protection requires appropriate separation of privileges and independently protected evidence.

Audit records should avoid storing document contents, passwords, authentication tokens, or unnecessary personal information.

## Security Measures

TrustVault is designed around the following security controls:

1. **Server-side authorization:** Every protected document operation is checked by the backend.
2. **Least privilege:** Users receive only the permissions necessary for their work.
3. **Deny by default:** Missing or invalid permission information results in denial.
4. **Document isolation:** One user's document cannot be accessed merely by changing an ID in a request.
5. **Private file storage:** S3 objects are not publicly readable.
6. **Immediate permission revocation:** Revoked grants are not accepted for subsequent protected requests.
7. **Input validation:** Uploaded files and API inputs are validated on the server.
8. **Safe file naming:** Storage keys are generated by the application.
9. **Secure password storage:** Passwords are hashed, not stored in plaintext.
10. **Secure configuration:** Credentials and secrets are kept outside source control.
11. **Audit protection:** Audit records are restricted and protected against ordinary application-level modification.
12. **Error handling:** API errors do not reveal stack traces or confidential document information.
13. **Database safety:** Database queries use safe parameter binding and appropriate access privileges.
14. **Automated security tests:** Unauthorized read, download, edit, delete, and permission-management attempts are tested.
15. **Dependency management:** Dependencies are reviewed and updated to address known vulnerabilities.

Security claims must be verified through implementation review and testing. Listing a control here does not mean it is already implemented or independently verified.

## Installation and Setup

### Prerequisites

Install the following software and configure the necessary accounts:

- Git.
- Node.js and npm.
- Java Development Kit (JDK).
- Maven, if it is not included through the project's Maven Wrapper.
- Microsoft SQL Server.
- A compatible SQL Server management tool, such as SQL Server Management Studio.
- An AWS account with appropriately configured S3 access, if AWS S3 is used.
- Visual Studio Code or another suitable development environment.

### Clone the Repository

```bash
git clone <PUBLIC_GITHUB_REPOSITORY_URL>
cd TrustVault
```

Replace the repository URL with the actual public repository URL.

### Frontend Installation

```bash
cd frontend
npm install
```

### Backend Installation

Open a separate terminal:

```bash
cd backend
```

If Maven is installed:

```bash
mvn clean install
```

If the repository includes the Maven Wrapper, use the appropriate wrapper command for your operating system.

### Database Setup

1. Start SQL Server.
2. Create a database for TrustVault.
3. Configure the database connection using environment variables or an appropriate local configuration.
4. Execute the schema script at `database/schema.sql`, if provided.
5. Execute the seed script only after reviewing its contents and ensuring that its credentials are safe for the environment.

Use a dedicated database account with only the privileges required by the application.

## Environment Configuration

TrustVault uses environment-specific configuration to avoid storing sensitive information in source control.

Example configuration variables:

```env
# Database
DB_URL=jdbc:sqlserver://localhost:1433;databaseName=TrustVault;encrypt=true;trustServerCertificate=true
DB_USERNAME=<YOUR_DATABASE_USERNAME>
DB_PASSWORD=<YOUR_DATABASE_PASSWORD>

# File storage
AWS_REGION=<YOUR_AWS_REGION>
AWS_S3_BUCKET=<YOUR_PRIVATE_S3_BUCKET>

# Authentication
APP_AUTH_SECRET=<A_SECURE_SECRET_IF_REQUIRED_BY_THE_SELECTED_AUTH_DESIGN>
```

These names are examples. The actual variable names must match the application's configuration.

Important notes:

- Never commit real credentials or secrets.
- Use AWS IAM roles or another appropriate credential provider rather than hardcoding AWS access keys.
- For production, configure valid TLS certificates and secure database connections. Do not blindly use `trustServerCertificate=true` in production.
- Keep local environment files out of Git using `.gitignore`.
- Do not use development credentials in the deployed application.
- If a variable is not used by the chosen implementation, remove it from the example configuration.

## How to Run the Project

### 1. Start SQL Server

Ensure that SQL Server is running and the TrustVault database is available.

### 2. Start the Backend

From the backend directory, run:

```bash
mvn spring-boot:run
```

If using the Maven Wrapper, run the equivalent wrapper command for your operating system.

The backend address depends on the configured server port. The default Spring Boot port is commonly `8080`, unless changed in the application configuration.

### 3. Start the Frontend

From the frontend directory, run:

```bash
npm run dev
```

Vite commonly starts the development server at:

```text
http://localhost:5173/
```

Open that address in a browser.

### 4. Verify Application Connectivity

Verify that:

- The frontend loads.
- The backend starts successfully.
- The database connection works.
- Authentication works.
- Document operations call the backend successfully.
- Unauthorized requests are denied.
- Audit events are created for relevant operations.

The exact commands and URLs should be updated if the final configuration differs from these defaults.

## Testing

TrustVault uses automated tests to validate application behavior and security controls.

### Testing Technologies

- JUnit 5.
- Spring Security Test.
- MockMvc.
- Additional integration testing tools, where appropriate.

### Functional Testing

Test the following:

- User authentication.
- Document upload and listing.
- Document search and filtering.
- Permission grants and revocations.
- Authorized document downloads.
- Authorized updates and deletions.
- Administrative activity views.
- Upload validation and error handling.

### Security Testing

Important authorization tests include:

1. User A cannot read User B's private document without a grant.
2. User A cannot download User B's document without a grant.
3. User A cannot edit or delete User B's document without authorization.
4. A viewer cannot perform owner-only permission changes.
5. A user cannot grant permissions to documents they do not own.
6. A revoked user is denied on the next protected request.
7. Changing a document ID in an API request does not bypass authorization.
8. Unauthorized attempts are recorded in the audit trail.
9. Search results do not expose inaccessible documents.
10. Audit records cannot be modified or deleted through ordinary user APIs.
11. Invalid, oversized, or disallowed uploads are rejected.
12. Missing or invalid authentication is handled correctly.

### Testing Standard

Tests must exercise the real authorization decision in the backend rather than simply checking whether a button is hidden in the frontend.

Where a security test is intended to fail if an authorization check is removed, it should demonstrate that behavior through a controlled negative test or a suitable mutation-testing approach.

Test results should be recorded honestly. Do not claim that all security tests pass until they have actually been executed.

## Screenshots

Add screenshots of the actual running application to this section.

Recommended screenshots:

1. Login page.
2. Main dashboard.
3. Document upload interface.
4. Document list and search.
5. Document details.
6. Permission management interface.
7. Access revocation workflow.
8. Administrative audit dashboard.
9. Unauthorized access response.
10. Automated test results.

Suggested repository structure:

```text
docs/
└── screenshots/
    ├── login.png
    ├── dashboard.png
    ├── documents.png
    ├── permissions.png
    ├── audit-dashboard.png
    └── access-denied.png
```

Only add screenshots that correspond to implemented functionality. Replace this list with the actual screenshot files as they become available.

## Limitations

The initial version prioritizes secure document access, permission enforcement, and auditable activity over advanced enterprise features.

Potential limitations, depending on the final implementation, include:

- No automatic recovery of documents permanently deleted from storage.
- Limited document version history.
- No advanced content-based search.
- No integration with enterprise identity providers.
- Limited notification and alerting capabilities.
- No guaranteed recall of files already downloaded by authorized users.
- Previously issued presigned URLs may remain usable until expiry.
- Advanced audit tamper protection may require an independent logging service or storage system.
- AI-based sharing recommendations may be excluded from the initial version.
- Production-scale performance and penetration testing may remain incomplete.

The final limitations section must distinguish between features not implemented, known security weaknesses, and functionality that has not yet been tested.

## Future Enhancements

Potential future improvements include:

- Multi-factor authentication.
- Enterprise single sign-on.
- Document versioning and recovery.
- Expiring document grants.
- Time-limited external sharing.
- Notifications for permission changes.
- Alerts for suspicious access patterns.
- Advanced audit integrity verification.
- Protected audit backups and external log archival.
- Encryption key management improvements.
- Malware scanning for uploaded files.
- Rate limiting and abuse detection.
- More comprehensive penetration testing.
- Improved document retention and deletion policies.
- AI-assisted permission recommendations requiring explicit human approval.
- Integration with workflow automation tools such as n8n.

Any future AI integration must remain advisory. The final access decision must be enforced by the backend, and human-approved recommendations and decisions should be auditable.

## Project Status

**Current status:** Under development.

TrustVault is being developed for the Snovasys Fresher Hiring Challenge 2026.

The project aims to deliver a functional secure document management platform with authentication, role-based access control, document-level permissions, private file storage, audit logging, automated security tests, and deployment documentation.

The status of each feature should be updated based on actual implementation and verification.

| Component | Status |
|---|---|
| Frontend React + TypeScript setup | Scaffold created |
| Login and navigation interfaces | Under development |
| Backend Spring Boot application | To be implemented or verified |
| SQL Server integration | To be implemented or verified |
| Private AWS S3 integration | To be implemented or verified |
| Document-level authorization | To be implemented and security-tested |
| Permission grant and revocation | To be implemented and verified |
| Audit trail | To be implemented and integrity-tested |
| Automated security tests | To be implemented and executed |
| Deployment | Pending verification |
| Public repository and documentation | In progress |

Update this table as work progresses. Mark a component as completed only after the relevant implementation and verification have succeeded.

## Contributors

**Project Developer:** [Your Name]

**Project:** TrustVault – Secure Document Management System

**Challenge:** Snovasys Fresher Hiring Challenge 2026

AI tools may be used to support development, testing, documentation, and problem-solving. All generated code and recommendations must be reviewed, tested, and validated by the developer, particularly for authentication, authorization, file handling, and audit integrity.

## License

This project is developed for the Snovasys Fresher Hiring Challenge 2026.

The applicable license should be selected and added before public distribution. If the project is released as open source, include an appropriate license file, such as an MIT License, only if that is the intended licensing choice and the developer has the right to grant it.

Until a license is selected, the repository should not imply that third parties have permission to reuse, modify, or distribute the code.

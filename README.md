# TrustVault
### Secure Document Sharing with a Real Audit Trail

## About the Project

TrustVault is a project I am building as part of the Snovasys Fresher Hiring Challenge 2026.

The main idea behind this project is to make document sharing more secure. When we share important files, we need to make sure that only the right people can access them. We should also be able to check who accessed a document and when it happened.

I am building TrustVault to solve these problems by managing document permissions, controlling access, and maintaining an audit trail.

## Why I Chose This Project

Sharing a file is easy, but sharing it securely is more important. Sometimes users may get access to files that they should not see. Also, when access is removed, the user should not be able to access the document again through the application.

Through this project, I want to understand how to build an application where security is considered from the beginning, rather than added at the end.

## Main Features

The following features are planned for TrustVault:

- User login and role-based access.
- Uploading and viewing documents.
- Managing document owners and permissions.
- Giving access to specific users.
- Revoking access when it is no longer needed.
- Allowing only authorized users to download documents.
- Recording document access activities, including denied attempts.
- Providing an activity dashboard for administrators.
- Testing the application against common security issues.

## Technologies I Am Using

- **Frontend:** React and TypeScript
- **Backend:** Java and Spring Boot
- **Database:** Microsoft SQL Server
- **File Storage:** Private AWS S3
- **Security:** Spring Security
- **Testing:** JUnit 5, Spring Security Test, and MockMvc

## How I Plan to Protect Documents

### 1. Access Control

The backend will check whether the logged-in user has permission to perform an action on a document. Access will not depend only on what is displayed on the frontend.

### 2. Document Privacy

Documents will be stored in a private S3 bucket. Users will access files only after the backend verifies their permissions.

### 3. Permission Management

Document owners or authorized administrators will be able to grant and revoke access, according to the application's permission rules.

### 4. Audit Trail

The application will record important access events, such as who tried to access a document, which document was involved, when the action happened, and whether access was allowed or denied.

### 5. Security Testing

I plan to test cases such as unauthorized downloads, access to another client's documents, attempts to access restricted operations, and access after permissions have been revoked.

## Application Structure

The application will have three main parts:

- **Frontend:** Provides the user interface for uploading documents and managing permissions.
- **Backend:** Handles authentication, authorization, document operations, and audit logging.
- **Storage and Database:** SQL Server will store application data, while private AWS S3 will store document files.

## Current Status

The project is currently under development. I am setting up the project structure and will implement the features step by step. I will update this README as the application becomes functional and the security tests are completed.

## Project Goal

My goal is to build a working document-sharing application that protects sensitive files, enforces permissions correctly, and provides a useful audit trail when access needs to be investigated.

This project will also help me improve my skills in Java, Spring Boot, React, databases, and application security.


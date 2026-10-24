# TrustVault — AI Interaction Log

This file documents how AI tools were used during the planning and initial setup of TrustVault. AI-generated suggestions were reviewed, and implementation details must be verified through code review and testing.

---

## 19-10-2026

### Entry 1: Understanding the Problem Statement and Clarifying Doubts

**AI Tool:** ChatGPT

**Prompt:**

I read the Snovasys Fresher Hiring Challenge 2026 problem statement, "TrustVault — Secure Document Sharing with a Real Audit Trail." I understood the basic purpose of the project, but I had some doubts about certain requirements and how to approach the implementation.

I asked ChatGPT to clarify the differences between the Administrator, Document Owner, and Viewer roles; how document-level permissions and access revocation should work; how the system should record document activity in an audit trail; and how unauthorized access should be prevented and tested.

I also asked for clarification on the expected technology stack, project development steps, and submission requirements so I could plan the implementation based on my understanding of the problem statement.

**AI Output:**

ChatGPT clarified the requirements I had doubts about and explained how the three user roles differ, how document permissions should be managed, and why the backend must check authorization for every protected operation.

It also explained the importance of enforcing revoked permissions on subsequent access attempts, recording successful and denied access attempts in the audit trail, and testing whether one user can access another user's documents without authorization.

Based on these clarifications, I gained a better understanding of the security requirements and the expected deliverables. The proposed technology stack was React with TypeScript, Java with Spring Boot, Microsoft SQL Server, private AWS S3 storage, and JUnit 5 with Spring Security Test.

These explanations helped me clarify my doubts and plan the project. The implementation and security controls still needed to be developed and verified.

**Mistake Identified:**

At the planning stage, I had not fully understood how document-level permissions, access revocation, and audit trail integrity should work together. There was a risk of treating the project as a basic document management application instead of a security-focused system.

**Correction Made:**

Clarified the role responsibilities, document-level access rules, backend authorization requirements, access revocation expectations, audit logging requirements, and security testing approach before beginning implementation.

**Verification:**

Reviewed the explanations against the original challenge problem statement. This was a requirements review only; application security controls had not yet been implemented or tested.

**Fix Commit:**

Not applicable. This entry documents problem analysis and clarification rather than a code fix.

---

## 21-10-2026

### Entry 2: Development Environment and Project Setup

**AI Tool:** ChatGPT

**Prompt:**

Guide me step by step through setting up my TrustVault development environment in `D:\Snovasys_Project`.

Help me verify Git, Java, Node.js, npm, and Visual Studio Code. Explain how to configure Git, prepare the root `.gitignore`, organize the project workspace, and initialize a React with TypeScript frontend using Vite.

If I encounter errors, help me understand the cause and fix them. Give me clear verification steps before moving to the next task.

**AI Output:**

ChatGPT provided step-by-step instructions for verifying the development tools, configuring the workspace, preparing `.gitignore`, and creating the React with TypeScript frontend using Vite.

The frontend project was created in `D:\Snovasys_Project\frontend`, the required dependencies were installed, and the Vite development server started successfully.

**Mistake Identified:**

Initially, the `node` command was not recognized in PowerShell. Git availability and Visual Studio Code startup and workspace settings also required troubleshooting.

**Correction Made:**

Resolved the development environment issues, verified the installed tool versions, configured the project workspace and `.gitignore`, and initialized the frontend project.

**Verification:**

- Git version: `2.56.0.windows.2`
- Java version: `24.0.1`
- Node.js version: `v24.22.0`
- npm version: `11.19.1`
- Frontend: React with TypeScript using Vite
- Development server: `http://localhost:5173/`
- Dependencies: Installation completed successfully.

These checks verified the development environment and frontend startup, not the completed application's security or backend functionality.

**Fix Commit:**

Initial commit: `5c91a8f` — `Initial commit: TrustVault project setup`.

Add the actual GitHub commit URL after confirming that the commit has been pushed to the remote repository.


## October 24, 2026

### Entry 3 — Upload Validation and Audit Logging

**AI Tool:** ChatGPT

**Prompt:**  
Help implement and verify secure document upload validation, file-size restrictions, and audit logging in the TrustVault Spring Boot backend.

**AI Output:**  
Guidance for validating supported file extensions, enforcing a 10 MB file-size limit, handling oversized multipart requests, and recording upload success and rejection events in SQL Server.

**Mistake Identified:**  
Oversized uploads were rejected with HTTP 413, but the rejection was not initially recorded in the audit log.

**Correction Made:**  
Configured multipart upload limits and added a global exception handler to record oversized upload attempts through `AuditLogService`.

**Verification:**  
- Valid TXT upload returned HTTP 201 and created a SUCCESS audit entry.
- Unsupported EXE upload returned HTTP 400 and created a DENIED audit entry.
- An 11 MB TXT upload returned HTTP 413 and created a DENIED audit entry.
- Confirmed the corresponding records in SQL Server's `audit_logs` table.
- Updated `THREATS.md` to document implemented upload controls, verification, and remaining risks.

**Fix Commit:** Pending

# AI Interaction Log

## 19-10-2026

### Entry 1: TrustVault Project Planning and Security Architecture

**AI Tool:** ChatGPT

**Prompt:**
```text
I am participating in the Snovasys Fresher Hiring Challenge 2026, and my project is TrustVault — Secure Document Sharing with a Real Audit Trail. Help me understand the problem statement, identify the most important functional and security requirements, and plan a practical implementation within the available development time.

Recommend a suitable technology stack for the frontend, backend, database, and private file storage. Explain how authentication, role-based access control, document permissions, permission revocation, and audit logging should work together. Also help me identify the main security risks, plan security testing, and organize the development process into clear, manageable steps.
```

**AI Output:**

ChatGPT explained that TrustVault is a security-focused document-sharing application rather than a basic CRUD system. It identified the need to prevent unauthorized document access, isolate documents belonging to different clients, revoke permissions when access is no longer required, and maintain an audit trail of important access events.

The recommended stack was React + TypeScript, Java + Spring Boot, Microsoft SQL Server, private AWS S3 storage, and JUnit 5 with Spring Security Test. The AI also suggested organizing the work into implementation stages covering project setup, authentication, document operations, permissions, audit logging, security testing, and documentation.

**Mistake Identified:**

No specific incorrect implementation or verified security vulnerability was identified during this planning activity. The main design risk was treating document sharing as an ordinary CRUD workflow without making authorization, document isolation, permission revocation, and auditability core requirements.

**Correction Made:**

Defined the project direction around least-privilege access, backend-enforced authorization, private file storage, explicit permission management, and auditable access decisions. AI was designated as an optional development aid rather than a security enforcement mechanism. Security-sensitive features were identified as requiring implementation and verification before being described as complete.

**Verification:**

Reviewed the proposed technology stack and development plan against the challenge's stated security objectives. Confirmed the intended separation between the frontend, backend API, database, and private file storage. This was a planning review only; application security controls and automated security tests had not yet been implemented or verified.

**Fix Commit:**

Not applicable. This entry documents project planning and architecture decisions rather than a specific code fix.

---

## 21-10-2026

### Entry 2: Git Repository Setup and Project Documentation

**AI Tool:** ChatGPT

**Prompt:**
```text
Guide me step by step in setting up Git for my TrustVault project in D:\Snovasys_Project. Help me configure a root .gitignore that excludes local Git and Node.js installation folders, dependency directories, build outputs, IDE files, and sensitive environment configuration. Help me prepare a professional README.md that explains the project's purpose, technology stack, security objectives, planned features, and current development status.

After the setup, show me how to verify the repository using Git commands, confirm that the React + TypeScript frontend files are tracked, and ensure that unnecessary dependencies and local installation files are excluded. Explain each step clearly and wait for verification before moving to the next task.
```

**AI Output:**

ChatGPT provided step-by-step guidance for creating and reviewing `.gitignore`, improving `README.md`, and verifying the repository's contents. The ignore rules covered Node.js dependencies, frontend build output, environment files, Java build artifacts, IDE files, and local Git and Node.js installation directories.

The AI also explained how to use `git status`, `git show --stat --oneline HEAD`, `git ls-files`, and `git check-ignore` to distinguish staged files, committed files, tracked files, and ignored dependencies.

**Mistake Identified:**

Initial Git status output showed only selected staged files, which made it necessary to verify exactly what the initial commit contained and which documentation files were awaiting a subsequent commit. The presence of an untracked directory alone was not sufficient to establish whether its contents should be included in the repository.

**Correction Made:**

Added `/Git/` and `/nodejs/` to the root `.gitignore` to exclude local installation folders without deleting them. Reviewed the initial commit and tracked-file list to confirm that the root `.gitignore`, README, and React + TypeScript frontend files were included. Checked the ignore rule for `frontend/node_modules/` before proceeding.

**Verification:**

- `git show --stat --oneline HEAD` identified the initial commit as `5c91a8f` (`Initial commit: TrustVault project setup`).
- The initial commit contained the root `.gitignore`, root `README.md`, and React + TypeScript frontend source and configuration files.
- `git ls-files` listed the tracked project files, including `PROMPTS.md` and `THREATS.md`.
- `git check-ignore frontend/node_modules/` returned `frontend/node_modules/`, confirming that the frontend dependency directory was ignored.
- At the last recorded status check, `PROMPTS.md` and `THREATS.md` were staged for a subsequent commit. A clean working tree after that commit has not yet been verified.

**Fix Commit:**

Initial commit: `5c91a8f`. No remote commit URL has been provided. Record the relevant commit hash and remote URL after the documentation changes are committed and pushed.
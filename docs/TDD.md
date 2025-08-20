# Technical Design Document (TDD) — Carbon Emission Monitoring & Reporting System

## 1. System Architecture

### 1.1 Overview

The system will use a monolithic architecture for the MVP, ensuring simplicity and faster development. It will consist of:

- **Monorepo**: The project will use a monorepo structure managed with Bun workspaces to streamline development and dependency management.
- **Frontend**: React + Bun for UI, styled with Tailwind CSS.
- **Backend**: Bun with Express.js for API and business logic.
- **Database**: PostgreSQL for relational data storage.
- **Deployment**: Containerized deployment on Coolify (Indonesian VPS).

### 1.2 Architecture Diagram

[Frontend (React + Bun)] <--> [Backend (Bun + Express)] <--> [Database (PostgreSQL)]

### 1.3 Component Interaction

- **Frontend**: Sends API requests to the backend for data retrieval, submission, and report generation.
- **Backend**: Handles business logic, authentication, authorization, and database interactions.
- **Database**: Stores user data, emissions data, audit logs, and configurations.

---

## 2. Database Design

### 2.1 Entity-Relationship Diagram (ERD)

Key entities:

- **Users**: Stores user information, roles, and permissions.
- **Emissions**: Stores emissions data per site.
- **Audit Logs**: Tracks user actions for compliance.
- **Configurations**: Stores admin-defined settings (e.g., units, date formats).

### 2.2 Tables

#### Users Table

| Field         | Type        | Description               |
| ------------- | ----------- | ------------------------- |
| id            | UUID        | Primary key               |
| username      | VARCHAR(50) | Unique username           |
| password_hash | TEXT        | Encrypted password        |
| role          | ENUM        | User role (Admin, Viewer) |
| created_at    | TIMESTAMP   | Record creation timestamp |

#### Emissions Table

| Field         | Type        | Description               |
| ------------- | ----------- | ------------------------- |
| id            | UUID        | Primary key               |
| site_id       | UUID        | Foreign key to Sites      |
| emission_type | VARCHAR(50) | Type of emission          |
| value         | FLOAT       | Emission value            |
| unit          | VARCHAR(10) | Unit of measurement       |
| created_at    | TIMESTAMP   | Record creation timestamp |

#### Audit Logs Table

| Field     | Type      | Description          |
| --------- | --------- | -------------------- |
| id        | UUID      | Primary key          |
| user_id   | UUID      | Foreign key to Users |
| action    | TEXT      | Action performed     |
| timestamp | TIMESTAMP | Action timestamp     |

#### Configurations Table

| Field      | Type        | Description                      |
| ---------- | ----------- | -------------------------------- |
| id         | UUID        | Primary key                      |
| key        | VARCHAR(50) | Configuration key (e.g., "unit") |
| value      | TEXT        | Configuration value (e.g., "kg") |
| created_at | TIMESTAMP   | Record creation timestamp        |

---

## 3. API Design

### 3.1 Endpoints

#### Authentication

- **POST /auth/login**: User login (JWT token generation).
- **POST /auth/refresh**: Refresh JWT token.

#### Emissions

- **GET /emissions**: Retrieve emissions data (with pagination).
- **POST /emissions**: Add new emissions data.
- **PUT /emissions/:id**: Update emissions data.
- **DELETE /emissions/:id**: Delete emissions data.

#### Bulk Uploads

- **POST /uploads/emissions**: Upload CSV/Excel files for emissions data.

#### Reporting

- **GET /reports**: Generate and retrieve reports (including charts and graphs).

#### Audit Logs

- **GET /audit-logs**: Retrieve audit logs with filters (site, date range, action type, affected data) and pagination.
- **GET /audit-logs/export**: Export filtered audit logs in PDF format.

#### Configurations

- **GET /configurations**: Retrieve all configurations.
- **PUT /configurations/:key**: Update a specific configuration (e.g., unit or date format).

#### ERP Integration (Future-Ready)

- **POST /erp/sync**: Sync data from ERP systems (e.g., SAP, Odoo).

---

## 4. Frontend Design

### 4.1 Wireframes

- **Dashboard**: Displays emissions data and reports.
- **Data Entry Form**: Allows manual entry of emissions data.
- **Bulk Upload Page**: Upload CSV/Excel files with progress bar and error display.
- **Reports Page**: View and download generated reports, including visual elements like charts and graphs.
- **Audit Logs Page**: View and filter audit logs, with export functionality.
- **Configurations Page**: Admin interface to update units and date formats.

### 4.2 Component Hierarchy

- **App**: Root component.
  - **Header**: Navigation bar.
  - **Sidebar**: Links to pages.
  - **MainContent**: Displays page content.
    - **Dashboard**: Emissions overview.
    - **DataEntryForm**: Manual data entry.
    - **BulkUpload**: File upload interface.
    - **Reports**: Report generation and download.
    - **AuditLogs**: Audit log filtering and export.
    - **Configurations**: Admin configuration management.

---

## 5. Security Measures

### 5.1 Authentication & Authorization

- **JWT-based Authentication**: Secure token generation and validation.
- **Role-Based Access Control (RBAC)**: Restrict access based on user roles.

### 5.2 Data Encryption

- **At Rest**: Encrypt sensitive fields in PostgreSQL (e.g., API keys).
- **In Transit**: Enforce HTTPS for all communications.

### 5.3 Audit Logging

- Immutable logs for all user actions.
- Exportable logs in PDF format with filters.

### 5.4 Rate Limiting

- Implement rate limiting for API endpoints to prevent abuse.

---

## 6. Deployment Plan

### 6.1 Containerization

- Use Docker to containerize the application.
- Define Dockerfiles for frontend and backend.

### 6.2 VPS Setup

- Deploy on Coolify (Indonesian VPS).
- Configure HTTPS and domain settings.

### 6.3 CI/CD Pipeline

- Use GitHub Actions for automated builds and deployments.
- Include pre-commit checks for code quality:
  - Type-checking.
  - Linting.
  - Unit testing.
- Ensure each file has less than 500 lines of code.

---

## 7. Testing Strategy

### 7.1 Unit Testing

- Backend: Test API endpoints and business logic.
- Frontend: Test React components and state management.

### 7.2 Integration Testing

- Test interactions between frontend, backend, and database.

### 7.3 End-to-End Testing

- Simulate user workflows (e.g., data entry, report generation).

### 7.4 Load Testing

- **Upload Performance**: Test bulk uploads with up to 10,000 rows of emissions data, ensuring processing time is under 5 seconds per 1,000 rows.
- **Report Generation**: Test report generation for datasets with up to 1 million rows, ensuring completion within 30 seconds.

---

## 8. Dependencies

### 8.1 Backend

- Bun, Express.js, Passport.js (JWT authentication).
- PostgreSQL (database).

### 8.2 Frontend

- React, bun, Tailwind CSS.

### 8.3 Deployment

- Docker, Coolify.

---

## 9. Implementation Timeline

### Milestones

1. **Week 0**: **Project Setup**

   - Set up the project repository structure (frontend and backend).
   - Configure development environment (Docker, PostgreSQL, Bun, React).
   - Install dependencies (e.g., Express.js, Passport.js, Tailwind CSS).
   - Define coding standards and pre-commit hooks for type-checking, linting, and testing.
   - Verify initial setup by running a "Hello World" application for both frontend and backend.

2. **Week 1**: **Authentication & Authorization**

   - Backend: Implement JWT-based authentication and RBAC.
   - Frontend: Create login page and role-based navigation.
   - Testing: Verify login flow, token generation, and role-based access.

3. **Week 2**: **Data Entry (Manual Input)**

   - Backend: Develop API endpoints for emissions data (CRUD operations).
   - Frontend: Create data entry form for manual input.
   - Testing: Test end-to-end flow for adding, updating, and deleting emissions data.

4. **Week 3**: **Bulk Uploads**

   - Backend: Implement CSV/Excel upload API with validation and error reporting.
   - Frontend: Create bulk upload page with progress bar and error display.
   - Testing: Test bulk upload functionality with sample files.

5. **Week 4**: **Reporting**

   - Backend: Develop report generation API (PDF/Excel formats, including charts and graphs).
   - Frontend: Create reports page with download options.
   - Testing: Verify report generation and download functionality.

6. **Week 5**: **Audit Logs**

   - Backend: Implement audit logging and retrieval API with pagination and export functionality.
   - Frontend: Create audit logs page with filters and export options.
   - Testing: Test audit log retrieval and export functionality.

7. **Week 6**: **Configurations**

   - Backend: Implement API for retrieving and updating configurations (e.g., units, date formats).
   - Frontend: Create configurations page for admin users.
   - Testing: Verify configuration updates and their impact on the system.

8. **Week 7**: **Deployment & Final Testing**
   - Deployment: Containerize the application and deploy on Coolify.
   - Testing: Perform integration testing for all features.
   - Final Review: Ensure system stability and readiness for production.

---

Let me know if you need further refinements or additional sections!

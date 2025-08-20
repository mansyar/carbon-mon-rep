# Product Requirements Document (PRD) — Carbon Emission Monitoring & Reporting System

## 1. Overview

A carbon emission monitoring and reporting platform tailored for Indonesian companies (e.g., Pertamina) to comply with local regulations (GHG Protocol, KLHK), supporting manual and automated data collection from ERP systems (SAP, Odoo), CSV/Excel uploads, and future integration with other ERP systems. The platform is designed to be industry-agnostic, ensuring flexibility for various sectors.

## 2. Goals

- Enable companies to track and report carbon emissions per Indonesian regulatory standards.
- Support configurable monitoring intervals: daily, weekly, monthly.
- Provide both manual (single-entry and bulk) and automated data input methods.
- Generate compliant reports for submission to Indonesian authorities in PDF and Excel formats.
- Ensure scalability for future ERP integrations, granularity enhancements, and expanded geographies.

## 3. Target Users

- **Admin Users**: Configure system, manage sites, manage ERP/API connections and API keys, manage roles and permissions.
- **Data Entry Users**: Enter or upload data manually.
- **Auditors/Compliance Officers**: Review audit logs, verify compliance.
- **View-Only Stakeholders**: Access all reports and dashboards.

## 4. Key Features (MVP)

### 4.1 Data Sources

- **ERP Integration**: API-based data import from SAP and Odoo using API key authentication, with secure encrypted storage of keys.
- **Manual Entry**: Single-entry forms for emission data input.
- **Bulk Uploads**: CSV/Excel uploads with predefined templates, immediate validation, and downloadable PDF error reports including row-level details. Admins can configure custom field mappings for uploaded files.

### 4.2 Reporting & Monitoring

- **Configurable Reporting Intervals**: Daily, weekly, monthly, selectable in system settings.
- **Per Site Reporting**: Ability to configure and monitor emissions per site.
- **Emission Factor Database Integration**: Manual upload and management of emission factor databases (GHG Protocol, KLHK).
- **Automated Report Generation**: Generation of Indonesian regulation-compliant reports in PDF and Excel formats, including visual elements like charts and graphs.
- **Dynamic Reporting Templates**: Support for template versioning and updates via admin upload.

### 4.3 User Management & RBAC

- Role-Based Access Control with dynamic permission management:
  - Admins can create custom roles by selecting granular CRUD permissions via checklist.
  - Assign users to roles within their company.
  - Audit trail for all permission changes, including who made the change and when.
- Predefined roles: Admin, Manager, Data Entry, Auditor, Viewer.
- Secure password hashing (bcrypt or equivalent).
- JWT-based authentication implemented with Passport.js using the JWT strategy.
- Token refresh and revocation flows.
- Audit logs for all user actions with export capability.

### 4.4 Compliance & Localization

- Compliance with Indonesian regulatory formats for emissions reporting.
- Hosted on Indonesian VPS (e.g., Coolify) with HTTPS enforced.
- Data encryption at rest and in transit.
- Indonesia-only mode for MVP, with toggle planned for future multi-region support.
- Configurable units of measurement and date formats by admin.
- Audit logs accessible only to Admin and roles with audit log permission enabled.
- Audit logs exportable in PDF format with filters: site, date range, action type, affected data.

### 4.5 Notifications & UX

- In-app toast notifications for upload success, failure, and system messages.
- Upload progress bar for bulk data uploads.
- Responsive web design targeting mobile-first (minimum 320px width) up to desktop.

## 5. Future Features (Post-MVP)

- Additional ERP integrations beyond SAP and Odoo.
- Increased data granularity (per department, process).
- Predictive analytics and AI-assisted anomaly detection.
- Automated emission factor updates via APIs.
- Carbon credit marketplace integration.
- Multi-language support.
- Comparison tools for emissions trends across sites, departments, or processes.
- Notifications via email or SMS for critical events (e.g., failed uploads, compliance deadlines).
- Accessibility support for notifications and forms (e.g., WCAG compliance).

## 6. Technical Requirements

- **Architecture**: Modular plug-and-play ERP connectors; monorepo structure using Bun workspaces.
- **Backend**: Bun with Express.js framework; authentication and authorization via Passport.js JWT strategy.
- **Frontend**: React + Bun with Tailwind CSS for styling and responsive design.
- **Database**: PostgreSQL with encrypted fields for sensitive data (e.g., API keys).
- **Deployment**: Containerized deployment on Indonesian VPS (Coolify).
- **Security**: HTTPS, data encryption at rest and in transit, RBAC, audit logging with immutable logs.

## 7. Compliance & Security

- Full audit logging of critical actions and permission changes.
- Secure encrypted storage of ERP API keys, with admin management interface.
- Enforcement of HTTPS for all communications.
- Data retention policies compliant with Indonesian regulations.
- Token refresh and revocation mechanisms.
- Role-based access restricting data and functionality.
- Exportable audit logs with filters in PDF format.

## 8. Dependencies

- Open-source emission factor databases (GHG Protocol, KLHK).
- ERP API documentation (SAP, Odoo).
- Indonesian regulatory reporting templates.
- Passport.js and related JWT libraries.
- Encryption libraries for secure storage (e.g., bcrypt, AES).

## 9. Risks & Mitigation

- **ERP API Changes**: Maintain versioned ERP connectors and modular architecture.
- **Regulatory Changes**: Dynamic reporting template management system for quick adaptation.
- **Data Accuracy**: Immediate validation on uploads, downloadable error reports, manual verification steps.
- **Security Breaches**: Encrypted storage, audit logging, RBAC, token revocation.

## 10. Success Metrics

- Number of active companies onboarded monthly.
- Percentage of reports generated without manual rework.
- Average time from data entry to report submission (hours/days).
- API uptime percentage (target ≥ 99.5%).
- Number of compliance audits passed without issue.
- Rate of upload errors per batch (target threshold).

---

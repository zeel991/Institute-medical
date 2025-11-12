# 🏥 Hostel Health Portal — ER Diagram

This ER diagram represents the PostgreSQL database schema for the Hostel Health Portal.

```mermaid
erDiagram
  USERS {
    UUID id PK
    STRING email "Unique, Not Null"
    STRING password "Not Null"
    STRING name "Not Null"
    STRING role "ENUM"
  }

  FACILITIES {
    UUID id PK
    STRING name "Unique, Not Null"
    STRING type "ENUM"
    STRING location "Nullable"
  }

  COMPLAINTS {
    UUID id PK
    STRING title "Not Null"
    STRING description "Not Null"
    STRING status "ENUM"
    STRING priority "ENUM"
    UUID facilityId FK
    UUID createdById FK
    DATETIME createdAt
  }

  COMPLAINT_ASSIGNMENTS {
    UUID id PK
    UUID complaintId FK
    UUID assignedToId FK
    BOOLEAN isActive "Not Null"
    DATETIME assignedAt
  }

  COMPLAINT_STATUS_HISTORY {
    UUID id PK
    UUID complaintId FK
    STRING toStatus "ENUM"
    DATETIME changedAt "Not Null"
  }

  MEDICAL_RECORDS {
    UUID id PK
    UUID userId FK "Unique -> enforces 1:1"
    STRING bloodType
    STRING allergies
    STRING emergencyContact
    DATETIME updatedAt
  }

  APPOINTMENTS {
    UUID id PK
    UUID studentId FK
    UUID staffId FK "Nullable"
    DATETIME scheduledTime "Not Null"
    STRING status "ENUM"
    STRING notes
  }

  MEDICINES {
    UUID id PK
    STRING name "Unique, Not Null"
    INTEGER stockLevel "Not Null"
    DATETIME expiryDate
  }

  ENTRY_EXIT_LOGS {
    UUID id PK
    UUID userId FK
    DATETIME timestamp "Not Null"
    STRING type
  }

  NOTIFICATIONS {
    UUID id PK
    UUID userId FK
    STRING title "Not Null"
    STRING body
    BOOLEAN isRead "Not Null"
    DATETIME createdAt
  }

  %% Relationships (multiplicities)
  USERS ||--o{ COMPLAINTS : "created_by"
  FACILITIES ||--o{ COMPLAINTS : "has"

  COMPLAINTS ||--o{ COMPLAINT_ASSIGNMENTS : "assigned_in"
  USERS ||--o{ COMPLAINT_ASSIGNMENTS : "assigned_to"

  COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : "status_history"

  USERS ||--|| MEDICAL_RECORDS : "has (1:1)"

  USERS ||--o{ APPOINTMENTS : "student_of"
  USERS ||--o{ APPOINTMENTS : "staff_of"

  USERS ||--o{ ENTRY_EXIT_LOGS : "has_logs"
  USERS ||--o{ NOTIFICATIONS : "receives"

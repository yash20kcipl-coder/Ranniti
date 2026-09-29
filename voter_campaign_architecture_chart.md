# 📊 Voter & Campaign Architecture Guide

> [!NOTE]
> **Key Architectural Goal**: Maintain one central master database for 1.46B+ official voter records (ECI data), while providing **100% private, isolated campaign workspaces** for each election team.

---

## 🏛️ 1. High-Level Architecture Diagram

![Voter & Campaign Multi-Tenant Architecture Diagram](file:///Users/mac-yash/.gemini/antigravity-ide/brain/c14f18b0-b2bd-4efd-9e9e-a4bd17a4394c/voter_campaign_architecture.svg)

---

## 🔗 2. How Campaign Links to Voters & Workers

```mermaid
erDiagram
    CAMPAIGN ||--|{ CAMPAIGN_WORKER : employs
    CAMPAIGN ||--|{ CAMPAIGN_VOTER_DETAILS : owns_private_data
    CAMPAIGN ||--o{ POLLING_BOOTH : manages
    
    GLOBAL_VOTER_MASTER ||--|{ CAMPAIGN_VOTER_DETAILS : provides_identity
    POLLING_BOOTH ||--|{ GLOBAL_VOTER_MASTER : contains
    
    CAMPAIGN {
        uuid campaign_id PK
        string campaign_name
        uuid target_ac_id FK
        string status
    }

    CAMPAIGN_WORKER {
        uuid worker_id PK
        uuid campaign_id FK
        string name
        string role
    }

    GLOBAL_VOTER_MASTER {
        uuid voter_id PK
        string epic_no
        string full_name
        string relative_name
        int age
        string gender
        uuid booth_id FK
    }

    CAMPAIGN_VOTER_DETAILS {
        uuid id PK
        uuid campaign_id FK
        uuid voter_id FK
        string mobile_no
        string voter_disposition
        boolean is_family_head
        string survey_notes
    }
```

---

## 🔄 3. End-to-End Data Flow: From Bulk Import to Field Survey

```mermaid
sequenceDiagram
    autonumber
    participant Admin as Campaign Admin
    participant System as Ranniti Importer
    participant MasterDB as Global Master DB
    participant CampDB as Campaign DB
    participant FieldWorker as Field Worker App

    Admin->>System: 1. Upload ECI Voter List (CSV/Excel)
    System->>MasterDB: 2. Stream & Insert Global Voter Records (EPIC, Name, Booth)
    Admin->>System: 3. Create New Campaign Workspace (e.g. Kothrud Assembly 2026)
    System->>CampDB: 4. Allocate AC/Booth Voters to Campaign Workspace
    FieldWorker->>CampDB: 5. Conduct Door-to-Door Survey (Collect Mobile, Disposition, Family Head)
    CampDB-->>Admin: 6. Real-time Dashboard Analytics (Targeting Favorable Voters, Booth Turnout)
```

---

## 📋 4. Master vs. Campaign Data Summary

| Data Layer | Accessible By | What it Contains | Security & Privacy |
| :--- | :--- | :--- | :--- |
| **Global Master DB** | All System Admins | Official ECI Data: Name, EPIC No, Booth, Serial No, Caste, Religion | Read-Only Reference |
| **Campaign Workspace** | Campaign Members Only | Phone Numbers, Political Inclination, Notes, Family Grouping | 100% Encrypted & Isolated |

> [!TIP]
> **Key Benefit**: Campaign A will **never** see phone numbers or survey ratings collected by Campaign B, even though both campaigns are operating on the same central voter roll.

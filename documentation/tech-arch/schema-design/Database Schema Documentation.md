# **Database Schema Documentation**

## **Overview**

The Google Ads Automation Tool uses a relational database implemented in Supabase (PostgreSQL) with a carefully designed schema to support all aspects of the application. This document details the database schema structure, security model, performance optimizations, and maintenance strategy.

## **Schema Design Philosophy**

The database schema follows these core design principles:

1. **Security-First Approach** \- Row-Level Security (RLS) is implemented throughout all tables  
2. **Comprehensive Audit Trail** \- All operations and changes are tracked with timestamps and user attribution  
3. **Hierarchical Relationships** \- Support for MCC account structures and nested relationships  
4. **Performance Optimization** \- Strategic indexing and denormalization where appropriate  
5. **Flexible Storage** \- JSON/JSONB fields for dynamic data alongside structured columns

## **Entity Relationship Diagram**

Copy  
┌─────────────────┐       ┌───────────────────────┐       ┌───────────────────┐  
│     users       │       │  google\_ads\_accounts  │       │     campaigns     │  
├─────────────────┤       ├───────────────────────┤       ├───────────────────┤  
│ id              │       │ id                    │       │ id                │  
│ email           │───1:N─┤ user\_id              │───1:N─┤ account\_id        │  
│ full\_name       │       │ account\_name          │       │ name              │  
│ created\_at      │       │ customer\_id           │       │ status            │  
│ updated\_at      │       │ oauth\_credentials\_json│       │ type              │  
└─────────────────┘       │ parent\_account\_id     │       │ budget\_amount     │  
                          │ created\_at            │       │ bidding\_strategy  │  
                          │ updated\_at            │       │ targeting\_json    │  
                          └───────────────────────┘       │ created\_at        │  
                                                          │ updated\_at        │  
                                                          └─────────┬─────────┘  
                                                                    │  
                 ┌────────────────────┐                    ┌────────┴──────────┐  
                 │     ad\_groups      │                    │  campaign\_history │  
                 ├────────────────────┤                    ├───────────────────┤  
                 │ id                 │                    │ id                │  
                 │ campaign\_id        │◄──────1:N──────────┤ campaign\_id       │  
                 │ name               │                    │ change\_type       │  
                 │ status             │                    │ before\_json       │  
                 │ created\_at         │                    │ after\_json        │  
                 │ updated\_at         │                    │ changed\_by        │  
                 └──────────┬─────────┘                    │ created\_at        │  
                            │                              └───────────────────┘  
                            │  
              ┌─────────────┴───────────┐  
              │                         │  
    ┌─────────┴────────┐      ┌─────────┴─────────┐  
    │     keywords     │      │    ad\_creatives   │  
    ├──────────────────┤      ├───────────────────┤  
    │ id               │      │ id                │  
    │ ad\_group\_id      │      │ ad\_group\_id       │  
    │ text             │      │ headline\_1        │  
    │ match\_type       │      │ headline\_2        │  
    │ is\_negative      │      │ headline\_3        │  
    │ bid\_micros       │      │ description\_1     │  
    │ created\_at       │      │ description\_2     │  
    │ updated\_at       │      │ final\_url         │  
    └──────────────────┘      │ created\_at        │  
                              │ updated\_at        │  
                              └───────────────────┘

┌─────────────────────┐      ┌──────────────────────┐      ┌───────────────────────┐  
│  automation\_tasks   │      │  operation\_templates │      │ operation\_schedules   │  
├─────────────────────┤      ├──────────────────────┤      ├───────────────────────┤  
│ id                  │      │ id                   │      │ id                    │  
│ user\_id             │      │ user\_id              │      │ template\_id           │  
│ type                │      │ name                 │      │ frequency             │  
│ status              │      │ type                 │      │ next\_run              │  
│ account\_id          │      │ config\_json          │      │ last\_run              │  
│ params\_json         │      │ created\_at           │      │ created\_at            │  
│ results\_json        │      │ updated\_at           │      │ updated\_at            │  
│ error\_json          │      └──────────────────────┘      │ status                │  
│ created\_at          │                                    └───────────────────────┘  
│ updated\_at          │  
│ started\_at          │  
│ completed\_at        │  
└─────────────────────┘

┌─────────────────────┐      ┌──────────────────────┐  
│  report\_definitions │      │  report\_executions   │  
├─────────────────────┤      ├──────────────────────┤  
│ id                  │      │ id                   │  
│ user\_id             │      │ definition\_id        │  
│ name                │      │ status               │  
│ type                │      │ data\_json            │  
│ metrics\_json        │      │ error\_json           │  
│ dimensions\_json     │      │ created\_at           │  
│ filters\_json        │      │ updated\_at           │  
│ date\_range\_type     │      │ started\_at           │  
│ created\_at          │      │ completed\_at         │  
│ updated\_at          │      └──────────────────────┘  
└─────────────────────┘

## **Table Descriptions**

### **User Management**

#### **`users`**

Primary user account table (extended from Supabase auth.users).

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key, generated by Supabase Auth |
| email | text | User's email address |
| full\_name | text | User's full name |
| created\_at | timestamp | Account creation timestamp |
| updated\_at | timestamp | Last update timestamp |

### **Account Management**

#### **`google_ads_accounts`**

Represents Google Ads accounts connected to the system.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| user\_id | uuid | Foreign key to users.id |
| account\_name | text | Display name for the account |
| customer\_id | text | Google Ads customer ID |
| oauth\_credentials\_json | jsonb | OAuth credentials including tokens |
| parent\_account\_id | uuid | Self-reference for MCC hierarchy (null for top-level) |
| created\_at | timestamp | Account connection timestamp |
| updated\_at | timestamp | Last update timestamp |

### **Campaign Management**

#### **`campaigns`**

Represents Google Ads campaigns.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| account\_id | uuid | Foreign key to google\_ads\_accounts.id |
| google\_id | text | Google Ads campaign ID |
| name | text | Campaign name |
| status | text | Campaign status (ENABLED, PAUSED, REMOVED) |
| type | text | Campaign type (SEARCH, DISPLAY, etc.) |
| budget\_amount | numeric | Daily budget amount |
| bidding\_strategy | text | Bidding strategy (MANUAL\_CPC, TARGET\_CPA, etc.) |
| targeting\_json | jsonb | Targeting settings (locations, devices, etc.) |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |

#### **`campaign_history`**

Tracks all changes to campaigns.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| campaign\_id | uuid | Foreign key to campaigns.id |
| change\_type | text | Type of change (CREATE, UPDATE, DELETE) |
| before\_json | jsonb | Campaign state before change |
| after\_json | jsonb | Campaign state after change |
| changed\_by | uuid | Foreign key to users.id |
| created\_at | timestamp | Change timestamp |

#### **`ad_groups`**

Represents ad groups within campaigns.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| campaign\_id | uuid | Foreign key to campaigns.id |
| google\_id | text | Google Ads ad group ID |
| name | text | Ad group name |
| status | text | Ad group status |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |

#### **`keywords`**

Represents keywords within ad groups.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| ad\_group\_id | uuid | Foreign key to ad\_groups.id |
| google\_id | text | Google Ads keyword ID |
| text | text | Keyword text |
| match\_type | text | Match type (EXACT, PHRASE, BROAD) |
| is\_negative | boolean | Whether it's a negative keyword |
| bid\_micros | bigint | Bid amount in micros |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |

#### **`ad_creatives`**

Represents ad creatives within ad groups.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| ad\_group\_id | uuid | Foreign key to ad\_groups.id |
| google\_id | text | Google Ads ad ID |
| headline\_1 | text | Primary headline |
| headline\_2 | text | Second headline |
| headline\_3 | text | Third headline |
| description\_1 | text | Primary description |
| description\_2 | text | Second description |
| final\_url | text | Landing page URL |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |

### **Automation**

#### **`automation_tasks`**

Tracks execution of automation operations.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| user\_id | uuid | Foreign key to users.id |
| type | text | Task type (CAMPAIGN\_CLONE, MATCH\_TYPE\_CONVERSION, etc.) |
| status | text | Task status (PENDING, RUNNING, COMPLETED, FAILED) |
| account\_id | uuid | Foreign key to google\_ads\_accounts.id |
| params\_json | jsonb | Input parameters for the task |
| results\_json | jsonb | Task results |
| error\_json | jsonb | Error details if failed |
| created\_at | timestamp | Task creation timestamp |
| updated\_at | timestamp | Last update timestamp |
| started\_at | timestamp | Execution start timestamp |
| completed\_at | timestamp | Execution completion timestamp |

#### **`operation_templates`**

Stores reusable operation templates.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| user\_id | uuid | Foreign key to users.id |
| name | text | Template name |
| type | text | Operation type |
| config\_json | jsonb | Template configuration |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |

#### **`operation_schedules`**

Defines scheduled operations.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| template\_id | uuid | Foreign key to operation\_templates.id |
| frequency | text | Schedule frequency (DAILY, WEEKLY, MONTHLY) |
| next\_run | timestamp | Next scheduled run timestamp |
| last\_run | timestamp | Last run timestamp |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |
| status | text | Schedule status (ACTIVE, PAUSED) |

### **Reporting**

#### **`report_definitions`**

Defines saved reports.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| user\_id | uuid | Foreign key to users.id |
| name | text | Report name |
| type | text | Report type |
| metrics\_json | jsonb | Selected metrics |
| dimensions\_json | jsonb | Selected dimensions |
| filters\_json | jsonb | Applied filters |
| date\_range\_type | text | Date range type (LAST\_7\_DAYS, LAST\_30\_DAYS, CUSTOM) |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |

#### **`report_executions`**

Stores results of report executions.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | uuid | Primary key |
| definition\_id | uuid | Foreign key to report\_definitions.id |
| status | text | Execution status |
| data\_json | jsonb | Report data |
| error\_json | jsonb | Error details if failed |
| created\_at | timestamp | Creation timestamp |
| updated\_at | timestamp | Last update timestamp |
| started\_at | timestamp | Execution start timestamp |
| completed\_at | timestamp | Execution completion timestamp |

## **Security Model**

The database implements a comprehensive security model:

### **Row-Level Security (RLS)**

RLS policies are enabled on all tables, ensuring users can only access their own data:

sql  
Copy  
\-- Example for campaigns table  
CREATE POLICY campaigns\_user\_isolation ON campaigns  
  USING (account\_id IN (  
    SELECT id FROM google\_ads\_accounts WHERE user\_id \= auth.uid()  
  ));

### **Hierarchical Permissions**

The schema supports MCC (Manager) account relationships:

1. Parent-child relationships are tracked in `google_ads_accounts.parent_account_id`  
2. Recursive queries allow access to all child accounts:

sql  
Copy  
\-- Example recursive query to get all accessible accounts  
WITH RECURSIVE account\_tree AS (  
  \-- Base case: directly owned accounts  
  SELECT id, account\_name, parent\_account\_id   
  FROM google\_ads\_accounts  
  WHERE user\_id \= auth.uid()  
    
  UNION ALL  
    
  \-- Recursive case: child accounts  
  SELECT a.id, a.account\_name, a.parent\_account\_id  
  FROM google\_ads\_accounts a  
  JOIN account\_tree t ON a.parent\_account\_id \= t.id  
)  
SELECT \* FROM account\_tree;

### **Credential Storage**

OAuth credentials are securely stored as JSONB with appropriate protections:

1. Tokens are encrypted at rest (using Supabase Vault)  
2. Access to token data is restricted through RLS policies  
3. Token refresh is handled through secure server functions

## **Performance Optimizations**

The database includes several performance optimizations:

### **Indexing Strategy**

Strategic indexes are created on frequently queried columns:

sql  
Copy  
\-- Example indexes  
CREATE INDEX idx\_campaigns\_account\_id ON campaigns(account\_id);  
CREATE INDEX idx\_ad\_groups\_campaign\_id ON ad\_groups(campaign\_id);  
CREATE INDEX idx\_keywords\_ad\_group\_id ON keywords(ad\_group\_id);  
CREATE INDEX idx\_automation\_tasks\_user\_id ON automation\_tasks(user\_id);  
CREATE INDEX idx\_automation\_tasks\_status ON automation\_tasks(status);

### **Denormalization**

Selective denormalization is used for reporting efficiency:

1. Common metrics are stored directly in campaign records  
2. Report results are cached in `report_executions.data_json`  
3. Historical data is preserved in `campaign_history` for trend analysis

### **JSON/JSONB Usage**

JSON/JSONB fields are used for flexible storage while maintaining structure:

1. `targeting_json` for campaign targeting settings  
2. `params_json` and `results_json` for automation tasks  
3. `metrics_json` and `dimensions_json` for report definitions

These fields allow for flexible schema evolution while maintaining query performance through JSONB indexing:

sql  
Copy  
CREATE INDEX idx\_task\_params ON automation\_tasks USING GIN (params\_json);

## **Migration Strategy**

The database uses versioned migrations for schema evolution:

### **Migration File Naming**

Migration files follow a consistent naming pattern:

Copy  
YYYYMMDD\_HHMMSS\_description.sql

For example:

Copy  
20230601\_120000\_create\_base\_tables.sql  
20230602\_093000\_add\_campaign\_history.sql  
20230605\_143000\_add\_reporting\_tables.sql

### **Migration Structure**

Each migration is structured with:

1. A unique version identifier  
2. Up and down migrations  
3. Idempotent checks to prevent duplicate execution  
4. Descriptive comments explaining the purpose

Example migration:

sql  
Copy  
\-- Migration: 20230601\_120000\_create\_base\_tables  
\-- Description: Creates the initial base tables for the application

\-- VERSIONING  
INSERT INTO schema\_migrations (version) VALUES ('20230601\_120000');

\-- UP MIGRATION  
CREATE TABLE IF NOT EXISTS google\_ads\_accounts (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
  account\_name TEXT NOT NULL,  
  customer\_id TEXT NOT NULL,  
  oauth\_credentials\_json JSONB NOT NULL,  
  parent\_account\_id UUID REFERENCES google\_ads\_accounts(id),  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT now(),  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT now()  
);

\-- RLS Policies  
ALTER TABLE google\_ads\_accounts ENABLE ROW LEVEL SECURITY;  
CREATE POLICY account\_user\_isolation ON google\_ads\_accounts  
  USING (user\_id \= auth.uid());

\-- DOWN MIGRATION (in case of rollback)  
\-- DROP TABLE IF EXISTS google\_ads\_accounts;

## **Audit Trail Implementation**

Comprehensive audit trailing is implemented throughout the database:

### **Timestamp Tracking**

All tables include timestamp columns:

* `created_at` \- Creation timestamp  
* `updated_at` \- Last update timestamp  
* Operation-specific timestamps like `started_at` and `completed_at`

### **Change History**

The `campaign_history` table records all campaign modifications with:

* Previous state (`before_json`)  
* New state (`after_json`)  
* Type of change  
* User who made the change

### **Operation Logging**

The `automation_tasks` table provides detailed operation tracking:

* Complete input parameters  
* Full results or error details  
* Execution timing information  
* Operation status

### **Database Triggers**

Automatic triggers maintain the audit trail:

sql  
Copy  
\-- Example trigger for campaign history  
CREATE OR REPLACE FUNCTION log\_campaign\_change()  
RETURNS TRIGGER AS $$  
BEGIN  
  IF TG\_OP \= 'INSERT' THEN  
    INSERT INTO campaign\_history (  
      campaign\_id, change\_type, before\_json, after\_json, changed\_by  
    ) VALUES (  
      NEW.id, 'CREATE', NULL, row\_to\_json(NEW), auth.uid()  
    );  
  ELSIF TG\_OP \= 'UPDATE' THEN  
    INSERT INTO campaign\_history (  
      campaign\_id, change\_type, before\_json, after\_json, changed\_by  
    ) VALUES (  
      NEW.id, 'UPDATE', row\_to\_json(OLD), row\_to\_json(NEW), auth.uid()  
    );  
  ELSIF TG\_OP \= 'DELETE' THEN  
    INSERT INTO campaign\_history (  
      campaign\_id, change\_type, before\_json, after\_json, changed\_by  
    ) VALUES (  
      OLD.id, 'DELETE', row\_to\_json(OLD), NULL, auth.uid()  
    );  
  END IF;  
  RETURN NULL;  
END;  
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign\_audit\_trail  
AFTER INSERT OR UPDATE OR DELETE ON campaigns  
FOR EACH ROW EXECUTE FUNCTION log\_campaign\_change();

## **Integration with Application Components**

The database schema is designed to integrate seamlessly with application components:

### **Campaign Clone Operation**

The database supports the Campaign Clone Operation with:

* `automation_tasks` for tracking cloning operations  
* `campaign_history` for recording campaign duplications  
* `keywords` table with `match_type` and `is_negative` fields for match type conversion and negative keyword implementation

### **Bulk Operations**

Bulk operations are supported through:

* Efficient indexing for querying related entities  
* JSON/JSONB fields for flexible operation parameters  
* Tracking of operation history and results

### **Task Management and Reporting**

The task management system is powered by:

* `automation_tasks` table for tracking all operations  
* `operation_templates` for saving reusable configurations  
* `operation_schedules` for scheduled automation

### **Campaign Form**

The campaign form component integrates with:

* `campaigns` table for basic campaign properties  
* `targeting_json` field for storing targeting settings  
* Campaign history tracking for changes made through the form

## **Conclusion**

The database schema provides a robust foundation for the Google Ads Automation Tool with:

1. **Comprehensive Data Model** \- Complete representation of Google Ads entities and relationships  
2. **Strong Security** \- Row-level security with hierarchical permissions  
3. **Performance Optimization** \- Strategic indexing and denormalization  
4. **Audit Trail** \- Detailed history tracking for all operations  
5. **Flexibility** \- JSON/JSONB fields for extensibility while maintaining structure

This design aligns with the PRD requirements and supports all core features, particularly the Campaign Clone Operation. The schema is also designed to be maintainable and extensible as the application evolves beyond the MVP phase.


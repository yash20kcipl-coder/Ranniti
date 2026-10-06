# `voters` Table Specification

Primary database entity for storing voter information across electoral constituencies, polling booths, and campaign overlays based on `InfoSheet.xlsx`.

---

## 📊 Table Structure & Columns

| Column Name            | Data Type      | Nullable | Default             | Description / Constraints                                               |
| :-----------------------| :---------------| :---------| :--------------------| :------------------------------------------------------------------------|
| `id`                   | `UUID`         | No       | `gen_random_uuid()` | Primary Key                                                             |
| `epic_no`              | `VARCHAR(30)`  | No       | *None*              | Unique Electoral Photo Identity Card (EPIC) ID                          |
| `state_id`             | `UUID`         | Yes      | `NULL`              | Foreign Key -> `states(id)`                                             |
| `district_id`          | `UUID`         | Yes      | `NULL`              | Foreign Key -> `districts(id)`                                          |
| `pc_id`                | `UUID`         | Yes      | `NULL`              | Foreign Key -> `parliamentary_constituencies(id)`                       |
| `ac_id`                | `UUID`         | Yes      | `NULL`              | Foreign Key -> `assembly_constituencies(id)`                            |
| `booth_id`             | `UUID`         | Yes      | `NULL`              | Foreign Key -> `booths(id)`                                             |
| `ward_id`              | `UUID`         | Yes      | `NULL`              | Foreign Key -> `wards(id)` (Electoral ward assignment)                  |
| `village_id`           | `UUID`         | Yes      | `NULL`              | Foreign Key -> `villages(id)` (Independent rural village reference)     |
| `serial_no`            | `INT`          | Yes      | `NULL`              | Electoral serial number within booth                                    |
| `section_no`           | `INT`          | Yes      | `NULL`              | Electoral section number                                                |
| `house_no`             | `VARCHAR(100)` | Yes      | `NULL`              | Residential house number                                                |
| `first_name`           | `VARCHAR(150)` | Yes      | `NULL`              | Local language first name                                               |
| `eng_first_name`       | `VARCHAR(150)` | Yes      | `NULL`              | English language first name                                             |
| `middle_name`          | `VARCHAR(150)` | Yes      | `NULL`              | Local language middle/father/husband name                               |
| `eng_middle_name`      | `VARCHAR(150)` | Yes      | `NULL`              | English language middle name                                            |
| `surname`              | `VARCHAR(150)` | Yes      | `NULL`              | Local language surname/last name                                        |
| `eng_surname`          | `VARCHAR(150)` | Yes      | `NULL`              | English language surname                                                |
| `guardian_name`        | `VARCHAR(255)` | Yes      | `NULL`              | Local/English language father/husband/guardian name                     |
| `relation`             | `VARCHAR(100)` | Yes      | `NULL`              | Guardian / family relation (e.g. Father, Husband, Mother)                |
| `gender`               | `VARCHAR(10)`  | Yes      | `NULL`              | Gender (`Male`, `Female`, `Other`)                                      |
| `dob`                  | `DATE`         | Yes      | `NULL`              | Date of Birth                                                           |
| `age`                  | `INT`          | Yes      | `NULL`              | Computed or recorded age                                                |
| `mobile_no`            | `VARCHAR(15)`  | Yes      | `NULL`              | Mobile contact number                                                   |
| `email`                | `VARCHAR(150)` | Yes      | `NULL`              | Email address                                                           |
| `aadhaar_no`           | `VARCHAR(20)`  | Yes      | `NULL`              | Aadhaar identification number                                           |
| `pan_no`               | `VARCHAR(20)`  | Yes      | `NULL`              | PAN card number                                                         |
| `profession_type`      | `VARCHAR(100)` | Yes      | `NULL`              | Category of profession (e.g. Govt, Private, Business)                   |
| `profession`           | `VARCHAR(100)` | Yes      | `NULL`              | Detailed profession/occupation                                          |
| `religion_id`          | `UUID`         | Yes      | `NULL`              | Foreign Key -> `religions(id)`                                          |
| `caste_id`             | `UUID`         | Yes      | `NULL`              | Foreign Key -> `castes(id)`                                             |
| `subcaste_name`        | `VARCHAR(150)` | Yes      | `NULL`              | Sub-caste name                                                          |
| `voter_type`           | `VARCHAR(50)`  | Yes      | `'Voter'`           | Voter category (`Voter`, `Neutral Voter`, `Non Voter`)                  |
| `status`               | `VARCHAR(30)`  | Yes      | `'ACTIVE'`          | Voter status (`ACTIVE`, `INACTIVE`, `SHIFTED`, `UNVERIFIED`, `PENDING`) |
| `is_dead`              | `BOOLEAN`      | Yes      | `FALSE`             | Deceased status flag                                                    |
| `blood_group`          | `VARCHAR(10)`  | Yes      | `NULL`              | Blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`)          |
| `avatar`               | `VARCHAR(255)` | Yes      | `NULL`              | Profile photo upload relative file path                                 |
| `taluka`               | `VARCHAR(100)` | Yes      | `NULL`              | Administrative Taluka / Tehsil                                          |
| `village`              | `VARCHAR(100)` | Yes      | `NULL`              | Village / Locality name                                                 |
| `full_address`         | `TEXT`         | Yes      | `NULL`              | Full permanent address                                                  |
| `voter_address`        | `TEXT`         | Yes      | `NULL`              | Full electoral roll voting address                                      |
| `party_id`             | `UUID`         | Yes      | `NULL`              | Foreign Key -> `political_parties(id)`                                  |
| `family_influencer_id` | `UUID`         | Yes      | `NULL`              | Foreign Key -> `voters(id)` (Family Influencer / Head link)              |
| `social_influencer_id` | `UUID`         | Yes      | `NULL`              | Foreign Key -> `voters(id)` (Social Influencer link)                    |
| `is_family_influencer` | `BOOLEAN`      | Yes      | `FALSE`             | Explicit Family Influencer / Head of House role flag                    |
| `is_social_influencer` | `BOOLEAN`      | Yes      | `FALSE`             | Explicit Social / Community Influencer role flag                        |
| `family_id`            | `VARCHAR(50)`  | Yes      | `NULL`              | Canonical Family ID / Household code (e.g. FAM-B042-H12A)               |
| `created_at`           | `TIMESTAMPTZ`  | No       | `NOW()`             | Record creation timestamp                                               |
| `updated_at`           | `TIMESTAMPTZ`  | No       | `NOW()`             | Record update timestamp                                                 |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_voters_epic_no` | `B-Tree (Unique)` | `epic_no` | Fast unique identifier lookup |
| `idx_voters_booth_serial` | `B-Tree` | `(booth_id, serial_no)` | Fast booth electoral roll order listing |
| `idx_voters_ac_id` | `B-Tree` | `ac_id` | Constituency level filtering |
| `idx_voters_religion_id` | `B-Tree` | `religion_id` | Demographic filtering by religion |
| `idx_voters_caste_id` | `B-Tree` | `caste_id` | Demographic filtering by caste |
| `idx_voters_status` | `B-Tree` | `status` | Filter by voter active/shifted status |
| `idx_voters_is_dead` | `B-Tree` | `is_dead` | Filter active vs deceased voters |
| `idx_voters_party_id` | `B-Tree` | `party_id` | Party affiliation filtering |
| `idx_voters_family_influencer_id` | `B-Tree` | `family_influencer_id` | Fast family influencer relationship lookup |
| `idx_voters_social_influencer_id` | `B-Tree` | `social_influencer_id` | Fast social influencer relationship lookup |
| `idx_voters_state_id` | `B-Tree` | `state_id` | Covering foreign key index for state filtering |
| `idx_voters_district_id` | `B-Tree` | `district_id` | Covering foreign key index for district filtering |
| `idx_voters_pc_id` | `B-Tree` | `pc_id` | Covering foreign key index for parliamentary constituency filtering |
| `idx_voters_gender` | `B-Tree` | `gender` | Fast demographic filtering and stats aggregation |
| `idx_voters_voter_type` | `B-Tree` | `voter_type` | Fast voter type filtering and grouping |
| `idx_voters_age` | `B-Tree` | `age` | Fast age range range-scan filtering |
| `idx_voters_section_no` | `B-Tree` | `section_no` | Candidate modal and section-level roll navigation |
| `idx_voters_created_at` | `B-Tree` | `created_at DESC` | Accelerated default roll sorting order |
| `idx_voters_booth_house` | `B-Tree` | `(booth_id, house_no)` | Sub-millisecond household grouping and influencer search |
| `idx_voters_eng_fname_trgm` | `GIN` | `eng_first_name gin_trgm_ops` | Sub-millisecond fuzzy search on English first name |
| `idx_voters_eng_sname_trgm` | `GIN` | `eng_surname gin_trgm_ops` | Sub-millisecond fuzzy search on English surname |
| `idx_voters_epic_no_trgm` | `GIN` | `epic_no gin_trgm_ops` | Sub-millisecond fuzzy wildcard search on EPIC number |
| `idx_voters_mobile_no_trgm` | `GIN` | `mobile_no gin_trgm_ops` | Sub-millisecond fuzzy wildcard search on mobile number |
| `idx_voters_house_no_trgm` | `GIN` | `house_no gin_trgm_ops` | Sub-millisecond fuzzy wildcard search on house number |
| `idx_voters_first_name_trgm` | `GIN` | `first_name gin_trgm_ops` | Sub-millisecond fuzzy wildcard search on local first name |
| `idx_voters_surname_trgm` | `GIN` | `surname gin_trgm_ops` | Sub-millisecond fuzzy wildcard search on local surname |
| `idx_voters_family_id` | `B-Tree` | `family_id` | Fast household cluster lookup by family ID |
| `idx_voters_booth_family_id` | `B-Tree` | `(booth_id, family_id)` | Fast booth-level household filtering |
| `idx_voters_guardian_name` | `B-Tree` | `guardian_name` | Fast guardian name lookup |


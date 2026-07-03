# RentMate AI - Database Schema Documentation

This document describes the database schema, models, references, and indexes implemented in MongoDB Atlas using Mongoose.

---

## 1. Collections Diagram & Relations

- **Users (1) <---> (1) TenantProfiles**: Linked via `userId` reference. Only users with the role `tenant` possess a profile.
- **Users (1) <---> (N) Listings**: Linked via `ownerId` string matching.
- **Listings (1) <---> (N) InterestRequests**: Linked via `listingId`.
- **Users (Tenant) (1) <---> (N) InterestRequests**: Linked via `tenantId`.
- **Users (Tenant) (1) <---> (N) CompatibilityScores**: Linked via `tenantId`.
- **Listings (1) <---> (N) CompatibilityScores**: Linked via `listingId`.
- **Chats (1) <---> (N) Messages**: Linked via `chatId`.

---

## 2. Collections Schema Specifications

### `Users` Collection
- **Purpose**: Stores account authentication details, verification keys, and security roles.
- **Fields**:
  - `name`: `String` (Required)
  - `email`: `String` (Required, Unique)
  - `password`: `String` (Required, Bcrypt hashed)
  - `role`: `String` (Enum: `tenant`, `owner`, `admin`; Default: `tenant`)
  - `avatar`: `String` (Avatar generator SVG fallback)
  - `isVerified`: `Boolean` (Default: `false`)
  - `otp`: `String` (6-digit verification code)
  - `otpExpires`: `Date` (expiration timestamp)
- **Indexes**:
  - `email: 1` (Unique, ascending index for quick login checks)
  - `role: 1` (Ascending index to optimize admin overview filters)

### `TenantProfiles` Collection
- **Purpose**: Stores housing search specifications and preferences for tenant matching.
- **Fields**:
  - `userId`: `String` (Required, Unique, references `Users.id`)
  - `preferredLocation`: `String` (Default: `""`)
  - `budgetMin`: `Number` (Default: `0`)
  - `budgetMax`: `Number` (Default: `1200`)
  - `moveInDate`: `String` (Default: `""`)
  - `roomType`: `String` (Default: `"Any"`)
  - `furnished`: `String` (Default: `"Any"`)
  - `genderPreference`: `String` (Default: `"Any"`)
  - `lifestyle`: `[String]` (Default: `[]`)
- **Indexes**:
  - `userId: 1` (Unique index for profile lookup)
  - `budgetMax: 1` (Optimize matching ranges)
  - `preferredLocation: 1` (Optimize location searches)

### `Listings` Collection
- **Purpose**: Stores room listings uploaded by landlords.
- **Fields**:
  - `title`: `String` (Required)
  - `description`: `String` (Required)
  - `rent`: `Number` (Required)
  - `location`: `String` (Required)
  - `images`: `[String]` (Base64 image array)
  - `roomType`: `String` (Required)
  - `furnishedStatus`: `String` (Required)
  - `amenities`: `[String]` (Amenities keywords list)
  - `moveInDate`: `String` (Required)
  - `genderPreference`: `String` (Required)
  - `isFilled`: `Boolean` (Default: `false`)
  - `ownerId`: `String` (Required, references `Users.id`)
  - `ownerName`: `String` (Required)
  - `ownerAvatar`: `String`
- **Indexes**:
  - `ownerId: 1` (List owner properties in dashboard)
  - `rent: 1` (Filter listings by budget limit)
  - `location: 1` (Keyword lookup index)
  - `isFilled: 1` (Exclude filled properties from searches)

### `InterestRequests` Collection
- **Purpose**: Captures application request records submitted by tenants to landlords.
- **Fields**:
  - `listingId`: `String` (Required, references `Listings.id`)
  - `tenantId`: `String` (Required, references `Users.id`)
  - `tenantName`: `String`
  - `tenantAvatar`: `String`
  - `status`: `String` (Enum: `pending`, `accepted`, `rejected`; Default: `pending`)
  - `message`: `String` (Applicant intro note)
- **Indexes**:
  - `{ tenantId: 1, listingId: 1 }` (Compound Unique Index to prevent double application attempts)
  - `status: 1` (Filtering pending tasks)

### `CompatibilityScores` Collection
- **Purpose**: Caches pre-calculated match scores and explanations to prevent redundant LLM API charges.
- **Fields**:
  - `tenantId`: `String` (Required, references `Users.id`)
  - `listingId`: `String` (Required, references `Listings.id`)
  - `score`: `Number` (0-100)
  - `explanation`: `String` (LLM-generated explanation paragraph)
  - `breakdown`: `Object` (budget, location, moveIn, roomType, gender match ratings)
- **Indexes**:
  - `{ tenantId: 1, listingId: 1 }` (Compound Unique Index ensuring a single cache document per tenant-flat match context)
  - `score: 1` (Sorting search suggestions by score matches)

### `Messages` Collection
- **Purpose**: Stores real-time chat message history logs.
- **Fields**:
  - `chatId`: `String` (Required, references `Chats.id`)
  - `senderId`: `String` (Required, references `Users.id`)
  - `text`: `String` (Required)
  - `readBy`: `[String]` (User IDs of readers for seen receipts sync)
- **Indexes**:
  - `chatId: 1` (Accelerates retrieval of conversation lists)

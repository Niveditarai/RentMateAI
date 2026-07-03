# RentMate AI - API Documentation

The RentMate AI backend runs a standard RESTful JSON API. All endpoints (except Auth paths) require a valid JWT passed in the HTTP Authorization header as a Bearer token:
`Authorization: Bearer <token>`

---

## 1. Authentication Endpoints

### Post Signup
- **Path**: `POST /api/auth/signup`
- **Payload**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "role": "tenant"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Signup successful! Verification OTP sent to your email.",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603f...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "tenant",
      "isVerified": false,
      "preferences": null
    },
    "simulatedOtp": "589324"
  }
  ```

### Post Login
- **Path**: `POST /api/auth/login`
- **Payload**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Login successful!",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603f...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "tenant",
      "isVerified": true,
      "preferences": {
        "budget": 1200,
        "location": "Downtown",
        "moveInDate": "2026-08-01",
        "roomType": "private room",
        "lifestyle": ["reading", "hiking"],
        "furnished": "furnished",
        "genderPreference": "Any"
      }
    }
  }
  ```

### Verify OTP
- **Path**: `POST /api/auth/verify-otp`
- **Payload**:
  ```json
  {
    "email": "john@example.com",
    "otp": "589324"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Verification successful! Account is active.",
    "isVerified": true
  }
  ```

---

## 2. Listing Endpoints

### Create Room Listing (Owner Only)
- **Path**: `POST /api/listings`
- **Payload**:
  ```json
  {
    "title": "Charming Room in City Center",
    "description": "Spacious room close to all central transit points.",
    "rent": 900,
    "location": "Downtown",
    "roomType": "private room",
    "furnishedStatus": "furnished",
    "amenities": ["WiFi", "Laundry", "Gym"],
    "moveInDate": "2026-08-01",
    "genderPreference": "Any",
    "images": ["data:image/png;base64,..."]
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Listing created successfully!",
    "listing": {
      "_id": "65ab...",
      "title": "Charming Room in City Center",
      "rent": 900,
      "location": "Downtown",
      "isFilled": false,
      "ownerId": "604d..."
    }
  }
  ```

### Browse Room Listings
- **Path**: `GET /api/listings`
- **Query Parameters**:
  - `budget`: Maximum rent limit
  - `location`: Substring matching location keyword
  - `roomType`: "private room", "shared room", "entire flat"
  - `moveInDate`: Availability target date
  - `sortBy`: "newest", "rent_low_high", "rent_high_low"
- **Response** (200 OK): Array of active listing documents.

### Update Filled Status
- **Path**: `PATCH /api/listings/:id/filled`
- **Payload**:
  ```json
  {
    "isFilled": true
  }
  ```
- **Response** (200 OK): Updated listing details.

---

## 3. AI Compatibility Endpoints

### Compute Match Compatibility
- **Path**: `POST /api/compatibility/compute`
- **Payload**:
  ```json
  {
    "listingId": "65ab..."
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "_id": "609c...",
    "tenantId": "603f...",
    "listingId": "65ab...",
    "score": 92,
    "explanation": "This flat fits comfortably in your budget. The Downtown location matches your preferred suburb...",
    "breakdown": {
      "budget": 100,
      "location": 100,
      "moveIn": 80,
      "roomType": 100,
      "gender": 100
    }
  }
  ```

---

## 4. Interest Request Endpoints

### Submit Interest Application
- **Path**: `POST /api/interests`
- **Payload**:
  ```json
  {
    "listingId": "65ab...",
    "message": "Hey! I would love to check out this flat."
  }
  ```
- **Response** (201 Created): Interest Request document.

### Update Application Status (Owner Only)
- **Path**: `PATCH /api/interests/:id/status`
- **Payload**:
  ```json
  {
    "status": "accepted"
  }
  ```
- **Response** (200 OK): Mark status as accepted/rejected and return created chat reference if accepted.

# Requirements Specification — Delivery Buddy API

**Base URL (local):** `http://localhost:3000/api`  
**Base URL (deployed):** `https://<your-deployed-host>/api` *(update after deployment)*  
**Swagger UI:** `http://localhost:3000/api-docs`  
**Auth:** Bearer JWT in `Authorization` header, unless marked **Public**.

> All routes below are relative to the base URL. Example: `POST /auth/login` → `POST http://localhost:3000/api/auth/login`

---

## Auth

### POST /auth/signup — Public
Register a new courier.
**Body:**
```json
{ "email": "tyler@example.com", "password": "min8chars", "name": "Tyler Teeler" }
```
**Response 201:**
```json
{ "token": "jwt...", "courier": { "id": "uuid", "email": "...", "name": "..." } }
```
**Errors:** 400 (validation), 409 (email exists)

### POST /auth/login — Public
**Body:** `{ "email": "...", "password": "..." }`  
**Response 200:** `{ "token": "jwt...", "courier": {...} }`  
**Errors:** 401 (invalid credentials)

### POST /auth/logout
**Response 200:** `{ "message": "logged out" }`

---

## Courier Profile

### GET /courier/me
Returns full profile — powers dashboard header, settings screen.
**Response 200:**
```json
{
  "id": "uuid", "workId": "487587", "name": "Tyler Teeler",
  "avatarUrl": "...", "team": "Downtown", "rate": 25,
  "level": 3, "transportation": "BICYCLE", "vehicleNumber": "RE 345 6"
}
```

### PATCH /courier/me/profile
Onboarding "Step 2" form — first-time setup.
**Body:**
```json
{
  "workId": "487587", "name": "Tyler Teeler", "team": "Downtown",
  "transportation": "BICYCLE", "vehicleNumber": "RE 345 6"
}
```
**Response 200:** updated courier object  
**Errors:** 400 (transportation not one of BICYCLE|CAR|TRUCK)

### PATCH /courier/me
Edit profile (settings screen pencil icon).
**Body:** any subset of `{ name, avatarUrl }`  
**Response 200:** updated courier object

### GET /courier/settings
**Response 200:**
```json
{ "billingMethod": "card", "location": "1142 Madison Ave", "notificationsEnabled": true }
```

### PATCH /courier/settings
**Body:** any subset of the above fields  
**Response 200:** updated settings object

---

## Shifts

### POST /shifts/start
Starts a new active shift. Rejects if one is already active.
**Response 201:**
```json
{ "id": "uuid", "startedAt": "2026-07-10T08:34:00Z", "status": "ACTIVE" }
```
**Errors:** 409 (shift already active)

### POST /shifts/stop
Ends the active shift, finalizes totals.
**Response 200:**
```json
{
  "id": "uuid", "startedAt": "...", "endedAt": "...", "status": "ENDED",
  "earnings": 456.89, "tips": 123.65, "deliveriesCompleted": 8
}
```
**Errors:** 404 (no active shift)

### GET /shifts/current
Drives dashboard idle vs. active view.
**Response 200:** active shift object, or `null`

### GET /shifts/last
Powers "My last shift" card.
**Response 200:**
```json
{ "startedAt": "2026-02-24T11:34:00Z", "endedAt": "2026-02-24T16:09:00Z", "earnings": 456.89, "tips": 123.65 }
```

---

## Orders

### GET /orders/current
The order tied to the courier's active shift — powers dashboard "Currently delivering"
card and the map screen.
**Response 200:**
```json
{
  "id": "uuid", "orderNumber": "#403-540", "status": "DELIVERING",
  "etaTime": "2026-07-10T14:44:00Z", "distanceLeftKm": 1.6,
  "destinationName": "Sarah Jorson", "destinationAddress": "1142 Madison Ave, apt. 34",
  "customerPhone": "816-304-1636"
}
```
**Response 200 (none active):** `null`

### GET /orders/next
**Response 200:** `{ "orderNumber": "#403-540", "etaTime": "12:45" }` or `null`

### GET /orders/:id
Full order detail screen.
**Response 200:**
```json
{
  "id": "uuid", "orderNumber": "#403-540", "status": "DELIVERED",
  "pickupName": "Lazzy Pizza", "pickupAddress": "1912 286-4504, 3000 Fenaridge Lane",
  "destinationName": "Mrs. Jorson", "destinationAddress": "1912 286-4504, 1142 Madison Ave, apt. 34",
  "items": [
    { "name": "Ham and Cheese Pizza 11 inch", "note": "Prosciutto cheese mix", "price": 12 },
    { "name": "Pepperoni Pepper", "price": 10 },
    { "name": "Tuesday Combo", "note": "Prosciutto Hawaiian sausage, Double cheeseburger, cola 1L", "price": 30 }
  ],
  "total": 42, "paymentMethod": "CARD", "courierEarn": 42, "tip": 10
}
```
**Errors:** 404

### PATCH /orders/:id/status
**Body:** `{ "status": "AT_DOOR" }`  
Valid transitions only: `PENDING → DELIVERING → AT_DOOR → DELIVERED`.  
On reaching `DELIVERED`: increments `shift.deliveriesCompleted`, creates `EARNING`
and `TIP` Transaction rows.
**Response 200:** updated order  
**Errors:** 400 (invalid transition), 404

---

## Wallet

### GET /wallet
Powers wallet tab header.
**Response 200:**
```json
{ "balance": 487.67, "tips": 276.78, "rate": 25, "level": 3 }
```

### GET /wallet/transactions?page=1&limit=20
**Response 200:**
```json
{
  "transactions": [
    { "orderNumber": "#403-540", "date": "2026-06-23T12:34:00Z", "amount": 45.05, "tip": 12.6 },
    { "type": "WITHDRAWAL", "date": "...", "amount": -670 }
  ],
  "page": 1, "hasMore": true
}
```

### POST /wallet/withdraw
**Body:** `{ "amount": 670 }`  
**Response 200:** `{ "newBalance": 0, "transactionId": "uuid" }`  
(balance after withdrawal must remain >= 0)  
**Errors:** 400 (amount exceeds balance)

---

## Chat

### GET /orders/:id/messages
Marks customer messages as `seen: true` on fetch.
**Response 200:**
```json
[
  { "id": "uuid", "senderType": "CUSTOMER", "text": "Hi, cannot reach a customer...", "seen": true, "createdAt": "..." },
  { "id": "uuid", "senderType": "COURIER", "text": "Thanks for reaching out...", "seen": true, "createdAt": "..." }
]
```

### POST /orders/:id/messages
**Body:** `{ "text": "On my way!" }`  
**Response 201:** created message object

---

## Error shape (all endpoints)
```json
{ "error": "ValidationError", "message": "transportation must be one of BICYCLE, CAR, TRUCK", "details": [] }
```
Status codes used: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found,
409 conflict, 500 server error.

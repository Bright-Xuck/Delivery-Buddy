# ERD — Delivery Buddy

Paste this block into any Mermaid-compatible viewer (GitHub renders it natively in
markdown). Entity names below are shown in PascalCase for readability in the diagram.
The live schema is defined in `backend/src/db/init.sql` using PostgreSQL with
snake_case table and column names (`couriers`, `work_id`, `courier_id`, etc.).

```mermaid
erDiagram
    COURIER ||--o{ SHIFT : has
    COURIER ||--o{ ORDER : delivers
    COURIER ||--o{ TRANSACTION : owns
    SHIFT ||--o{ ORDER : "includes"
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ TRANSACTION : generates
    ORDER ||--o{ MESSAGE : "has thread"

    COURIER {
        string id PK
        string workId
        string email
        string passwordHash
        string name
        string avatarUrl
        string team
        float rate
        int level
        string transportation "BICYCLE|CAR|TRUCK"
        string vehicleNumber
        string billingMethod
        string location
        boolean notificationsEnabled
        datetime createdAt
    }

    SHIFT {
        string id PK
        string courierId FK
        datetime startedAt
        datetime endedAt
        string status "ACTIVE|ENDED"
        float earnings
        float tips
        int deliveriesCompleted
    }

    ORDER {
        string id PK
        string orderNumber
        string courierId FK
        string shiftId FK
        string status "PENDING|DELIVERING|AT_DOOR|DELIVERED"
        string pickupName
        string pickupAddress
        string destinationName
        string destinationAddress
        string customerPhone
        float total
        string paymentMethod "CARD|CASH"
        float courierEarn
        float tip
        datetime etaTime
        float distanceLeftKm
        datetime createdAt
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string name
        string note
        float price
    }

    TRANSACTION {
        string id PK
        string courierId FK
        string orderId FK
        string type "EARNING|TIP|WITHDRAWAL"
        float amount
        datetime createdAt
    }

    MESSAGE {
        string id PK
        string orderId FK
        string senderType "COURIER|CUSTOMER"
        string text
        boolean seen
        datetime createdAt
    }
```

## Notes on cardinality decisions
- **Shift → Order** is one-to-many: an order is assigned within a single shift,
  but a courier's full order history spans many shifts.
- **Transaction.orderId is nullable**: withdrawals aren't tied to an order.
- **Order status is a strict state machine**, enforced in the route handlers, not
  just the DB: `PENDING → DELIVERING → AT_DOOR → DELIVERED`.
- **Courier settings** (`billingMethod`, `location`, `notificationsEnabled`) are
  stored on the `couriers` table — no separate settings table.
- Level/rate on COURIER are stored, not computed — the "level raised due to high
  activity" banner implies a background rule (e.g. deliveries-completed threshold)
  updates it; simplest implementation is a check on shift-stop, bump level if
  weekly deliveries > threshold.

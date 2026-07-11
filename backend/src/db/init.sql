CREATE TABLE IF NOT EXISTS couriers (
  id UUID PRIMARY KEY,
  work_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  team VARCHAR(255),
  rate REAL NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  transportation VARCHAR(50),
  vehicle_number VARCHAR(50),
  billing_method VARCHAR(50) DEFAULT 'card',
  location VARCHAR(255),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  earnings REAL NOT NULL DEFAULT 0,
  tips REAL NOT NULL DEFAULT 0,
  deliveries_completed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(255) NOT NULL UNIQUE,
  courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,
  pickup_name VARCHAR(255) NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  destination_address TEXT NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  total REAL NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  courier_earn REAL NOT NULL DEFAULT 0,
  tip REAL NOT NULL DEFAULT 0,
  eta_time TIMESTAMP,
  distance_left_km REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  amount REAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Seed data for development
-- Run this AFTER init.sql

-- Insert courier (password: test1234 — bcrypt hash)
INSERT INTO couriers (id, work_id, name, email, password_hash, avatar_url, team, rate, level, transportation, vehicle_number)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '487587',
  'Tyler Teeler',
  'tyler@example.com',
  '$2b$10$xf5fh/wDmVpz8msTCVrzNOiMAnZrt/ZeOVRQE0YBmBt49ofwFrkDu',
  'https://example.com/avatar.png',
  'Downtown',
  25,
  3,
  'BICYCLE',
  'RE 345 6'
) ON CONFLICT (id) DO NOTHING;

-- Insert shift
INSERT INTO shifts (id, courier_id, started_at, status, earnings, tips, deliveries_completed)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  NOW(),
  'ACTIVE',
  0,
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Insert order
INSERT INTO orders (id, order_number, courier_id, shift_id, status, pickup_name, pickup_address, destination_name, destination_address, customer_name, customer_phone, total, payment_method, courier_earn, tip, eta_time, distance_left_km)
VALUES (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '#403-540',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'DELIVERING',
  'Lazzy Pizza',
  '1912 286-4504, 3000 Fenaridge Lane',
  'Mrs. Jorson',
  '1912 286-4504, 1142 Madison Ave, apt. 34',
  'Sarah Jorson',
  '816-304-1636',
  42,
  'CARD',
  42,
  10,
  NOW(),
  1.6
) ON CONFLICT (id) DO NOTHING;

-- Insert order items
INSERT INTO order_items (id, order_id, name, price, note) VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ham and Cheese Pizza 11 inch', 12, 'Prosciutto cheese mix'),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pepperoni Pepper', 10, NULL),
  ('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tuesday Combo', 20, 'Prosciutto Hawaiian sausage, Double cheeseburger, cola 1L')
ON CONFLICT (id) DO NOTHING;

-- Insert transactions
INSERT INTO transactions (id, courier_id, order_id, type, amount) VALUES
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'EARNING', 42),
  ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TIP', 10)
ON CONFLICT (id) DO NOTHING;

-- Insert messages
INSERT INTO messages (id, order_id, sender_type, text, seen) VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CUSTOMER', 'Hi, I cannot reach the customer. Please check the delivery instructions.', FALSE),
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'COURIER', 'I am on my way and will be there shortly.', TRUE)
ON CONFLICT (id) DO NOTHING;
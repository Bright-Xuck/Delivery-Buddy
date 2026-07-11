import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export async function seed(knex) {
  await knex('messages').del();
  await knex('transactions').del();
  await knex('order_items').del();
  await knex('orders').del();
  await knex('shifts').del();
  await knex('couriers').del();

  const courierId = uuidv4();
  const shiftId = uuidv4();
  const orderId = uuidv4();
  const password_hash = await bcrypt.hash('test1234', 10);

  await knex('couriers').insert({
    id: courierId,
    work_id: '487587',
    name: 'Tyler Teeler',
    email: 'tyler@example.com',
    password_hash,
    avatar_url: 'https://example.com/avatar.png',
    team: 'Downtown',
    rate: 25,
    level: 3,
    transportation: 'BICYCLE',
    vehicle_number: 'RE 345 6',
  });

  await knex('shifts').insert({
    id: shiftId,
    courier_id: courierId,
    started_at: knex.fn.now(),
    status: 'ACTIVE',
    earnings: 0,
    tips: 0,
    deliveries_completed: 0,
  });

  await knex('orders').insert({
    id: orderId,
    order_number: '#403-540',
    courier_id: courierId,
    shift_id: shiftId,
    status: 'DELIVERING',
    pickup_name: 'Lazzy Pizza',
    pickup_address: '1912 286-4504, 3000 Fenaridge Lane',
    destination_name: 'Mrs. Jorson',
    destination_address: '1912 286-4504, 1142 Madison Ave, apt. 34',
    customer_name: 'Sarah Jorson',
    customer_phone: '816-304-1636',
    total: 42,
    payment_method: 'CARD',
    courier_earn: 42,
    tip: 10,
    eta_time: knex.fn.now(),
    distance_left_km: 1.6,
  });

  await knex('order_items').insert([
    {
      id: uuidv4(),
      order_id: orderId,
      name: 'Ham and Cheese Pizza 11 inch',
      price: 12,
      note: 'Prosciutto cheese mix',
    },
    {
      id: uuidv4(),
      order_id: orderId,
      name: 'Pepperoni Pepper',
      price: 10,
    },
    {
      id: uuidv4(),
      order_id: orderId,
      name: 'Tuesday Combo',
      price: 20,
      note: 'Prosciutto Hawaiian sausage, Double cheeseburger, cola 1L',
    },
  ]);

  await knex('transactions').insert([
    {
      id: uuidv4(),
      courier_id: courierId,
      order_id: orderId,
      type: 'EARNING',
      amount: 42,
    },
    {
      id: uuidv4(),
      courier_id: courierId,
      order_id: orderId,
      type: 'TIP',
      amount: 10,
    },
  ]);

  await knex('messages').insert([
    {
      id: uuidv4(),
      order_id: orderId,
      sender_type: 'CUSTOMER',
      text: 'Hi, I cannot reach the customer. Please check the delivery instructions.',
      seen: false,
    },
    {
      id: uuidv4(),
      order_id: orderId,
      sender_type: 'COURIER',
      text: 'I am on my way and will be there shortly.',
      seen: true,
    },
  ]);
}

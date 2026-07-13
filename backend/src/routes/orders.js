import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from '../db/connection.js';

const router = express.Router();

/**
 * @openapi
 * /orders/current:
 *   get:
 *     tags: [Orders]
 *     summary: Order tied to the active shift
 *     responses:
 *       200: { description: Current order or null }
 *
 * /orders/next:
 *   get:
 *     tags: [Orders]
 *     summary: Next pending order (order number + ETA)
 *     responses:
 *       200: { description: Next order or null }
 *
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Full order detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order detail }
 *       404: { description: Not found }
 *
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Advance order status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [DELIVERING, AT_DOOR, DELIVERED] }
 *     responses:
 *       200: { description: Updated order }
 *       400: { description: Invalid transition }
 *       404: { description: Not found }
 *
 * /orders/{id}/messages:
 *   get:
 *     tags: [Orders]
 *     summary: Get chat messages for an order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of messages }
 *       404: { description: Not found }
 *   post:
 *     tags: [Orders]
 *     summary: Post a chat message
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201: { description: Created message }
 *       400: { description: text required }
 *       404: { description: Not found }
 */
const NEXT_STATUS = {
  PENDING: 'DELIVERING',
  DELIVERING: 'AT_DOOR',
  AT_DOOR: 'DELIVERED',
};

function formatTime(date) {
  const d = new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function toCurrentOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    etaTime: row.eta_time,
    distanceLeftKm: row.distance_left_km,
    destinationName: row.destination_name,
    destinationAddress: row.destination_address,
    customerPhone: row.customer_phone,
  };
}

function toOrderDetail(row, items) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    pickupName: row.pickup_name,
    pickupAddress: row.pickup_address,
    destinationName: row.destination_name,
    destinationAddress: row.destination_address,
    items: items.map((item) => ({
      name: item.name,
      note: item.note,
      price: item.price,
    })),
    total: row.total,
    paymentMethod: row.payment_method,
    courierEarn: row.courier_earn,
    tip: row.tip,
  };
}

router.get('/current', async (req, res) => {
  const [shift] = await sql`
    SELECT id FROM shifts
    WHERE courier_id = ${req.courierId} AND status = 'ACTIVE'
  `;

  if (!shift) {
    return res.json(null);
  }

  const [order] = await sql`
    SELECT * FROM orders
    WHERE shift_id = ${shift.id}
      AND courier_id = ${req.courierId}
      AND status IN ('DELIVERING', 'AT_DOOR')
    LIMIT 1
  `;

  if (!order) {
    return res.json(null);
  }

  res.json(toCurrentOrder(order));
});

router.get('/next', async (req, res) => {
  const [order] = await sql`
    SELECT order_number, eta_time FROM orders
    WHERE courier_id = ${req.courierId} AND status = 'PENDING'
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (!order) {
    return res.json(null);
  }

  res.json({
    orderNumber: order.order_number,
    etaTime: order.eta_time ? formatTime(order.eta_time) : null,
  });
});

router.get('/:id/messages', async (req, res) => {
  const { id } = req.params;

  const [order] = await sql`
    SELECT id FROM orders
    WHERE id = ${id} AND courier_id = ${req.courierId}
  `;

  if (!order) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: 'Order not found',
      details: [],
    });
  }

  await sql`
    UPDATE messages SET seen = TRUE
    WHERE order_id = ${id} AND sender_type = 'CUSTOMER'
  `;

  const messages = await sql`
    SELECT * FROM messages
    WHERE order_id = ${id}
    ORDER BY created_at ASC
  `;

  res.json(
    messages.map((msg) => ({
      id: msg.id,
      senderType: msg.sender_type,
      text: msg.text,
      seen: msg.seen,
      createdAt: msg.created_at,
    })),
  );
});

router.post('/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'text is required',
      details: [],
    });
  }

  const [order] = await sql`
    SELECT id FROM orders
    WHERE id = ${id} AND courier_id = ${req.courierId}
  `;

  if (!order) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: 'Order not found',
      details: [],
    });
  }

  const messageId = uuidv4();

  const [message] = await sql`
    INSERT INTO messages (id, order_id, sender_type, text, seen)
    VALUES (${messageId}, ${id}, 'COURIER', ${text}, TRUE)
    RETURNING *
  `;

  res.status(201).json({
    id: message.id,
    senderType: message.sender_type,
    text: message.text,
    seen: message.seen,
    createdAt: message.created_at,
  });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const [order] = await sql`
    SELECT * FROM orders
    WHERE id = ${id} AND courier_id = ${req.courierId}
  `;

  if (!order) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: 'Order not found',
      details: [],
    });
  }

  const items = await sql`
    SELECT name, note, price FROM order_items
    WHERE order_id = ${id}
  `;

  res.json(toOrderDetail(order, items));
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'status is required',
      details: [],
    });
  }

  const [order] = await sql`
    SELECT * FROM orders
    WHERE id = ${id} AND courier_id = ${req.courierId}
  `;

  if (!order) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: 'Order not found',
      details: [],
    });
  }

  const allowedNext = NEXT_STATUS[order.status];
  if (!allowedNext || allowedNext !== status) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'invalid status transition',
      details: [],
    });
  }

  if (status === 'DELIVERED') {
    const [updated] = await sql.begin(async (tx) => {
      const [delivered] = await tx`
        UPDATE orders SET status = 'DELIVERED'
        WHERE id = ${id}
        RETURNING *
      `;

      await tx`
        UPDATE shifts
        SET deliveries_completed = deliveries_completed + 1,
            earnings = earnings + ${delivered.courier_earn},
            tips = tips + ${delivered.tip}
        WHERE id = ${delivered.shift_id}
      `;

      await tx`
        INSERT INTO transactions (id, courier_id, order_id, type, amount)
        VALUES (${uuidv4()}, ${req.courierId}, ${id}, 'EARNING', ${delivered.courier_earn})
      `;

      if (delivered.tip > 0) {
        await tx`
          INSERT INTO transactions (id, courier_id, order_id, type, amount)
          VALUES (${uuidv4()}, ${req.courierId}, ${id}, 'TIP', ${delivered.tip})
        `;
      }

      return [delivered];
    });

    return res.json({
      id: updated.id,
      orderNumber: updated.order_number,
      status: updated.status,
    });
  }

  const [updated] = await sql`
    UPDATE orders SET status = ${status}
    WHERE id = ${id}
    RETURNING *
  `;

  res.json({
    id: updated.id,
    orderNumber: updated.order_number,
    status: updated.status,
  });
});

export default router;

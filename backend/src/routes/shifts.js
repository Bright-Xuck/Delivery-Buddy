import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from '../db/connection.js';

const router = express.Router();

/**
 * @openapi
 * /shifts/start:
 *   post:
 *     tags: [Shifts]
 *     summary: Start a new active shift
 *     responses:
 *       201:
 *         description: Shift started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 startedAt: { type: string, format: date-time }
 *                 status: { type: string }
 *       409: { description: A shift is already active }
 *
 * /shifts/stop:
 *   post:
 *     tags: [Shifts]
 *     summary: End the active shift
 *     responses:
 *       200: { description: Shift ended }
 *       404: { description: No active shift }
 *
 * /shifts/current:
 *   get:
 *     tags: [Shifts]
 *     summary: Get the active shift (or null)
 *     responses:
 *       200:
 *         description: Active shift or null
 *
 * /shifts/last:
 *   get:
 *     tags: [Shifts]
 *     summary: Get the most recent ended shift
 *     responses:
 *       200:
 *         description: Last shift or null
 */
function toShift(row) {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status,
    earnings: row.earnings,
    tips: row.tips,
    deliveriesCompleted: row.deliveries_completed,
  };
}

router.post('/start', async (req, res) => {
  const [active] = await sql`
    SELECT id FROM shifts
    WHERE courier_id = ${req.courierId} AND status = 'ACTIVE'
  `;

  if (active) {
    return res.status(409).json({
      error: 'ConflictError',
      message: 'A shift is already active',
      details: [],
    });
  }

  const id = uuidv4();

  const [shift] = await sql`
    INSERT INTO shifts (id, courier_id, started_at, status)
    VALUES (${id}, ${req.courierId}, NOW(), 'ACTIVE')
    RETURNING *
  `;

  res.status(201).json({
    id: shift.id,
    startedAt: shift.started_at,
    status: shift.status,
  });
});

router.post('/stop', async (req, res) => {
  const [shift] = await sql`
    SELECT * FROM shifts
    WHERE courier_id = ${req.courierId} AND status = 'ACTIVE'
  `;

  if (!shift) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: 'No active shift',
      details: [],
    });
  }

  const [ended] = await sql`
    UPDATE shifts
    SET ended_at = NOW(), status = 'ENDED'
    WHERE id = ${shift.id}
    RETURNING *
  `;

  res.json(toShift(ended));
});

router.get('/current', async (req, res) => {
  const [shift] = await sql`
    SELECT * FROM shifts
    WHERE courier_id = ${req.courierId} AND status = 'ACTIVE'
  `;

  if (!shift) {
    return res.json(null);
  }

  res.json({
    id: shift.id,
    startedAt: shift.started_at,
    status: shift.status,
  });
});

router.get('/last', async (req, res) => {
  const [shift] = await sql`
    SELECT * FROM shifts
    WHERE courier_id = ${req.courierId} AND status = 'ENDED'
    ORDER BY ended_at DESC
    LIMIT 1
  `;

  if (!shift) {
    return res.json(null);
  }

  res.json({
    startedAt: shift.started_at,
    endedAt: shift.ended_at,
    earnings: shift.earnings,
    tips: shift.tips,
  });
});

export default router;

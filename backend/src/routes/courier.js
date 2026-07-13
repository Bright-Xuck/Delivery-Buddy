import express from 'express';
import sql from '../db/connection.js';
import {
  getCache,
  setCache,
  delCache,
  courierKey,
} from '../cache.js';

const router = express.Router();

const VALID_TRANSPORT = ['BICYCLE', 'CAR', 'TRUCK'];

/**
 * @openapi
 * /courier/me:
 *   get:
 *     tags: [Courier]
 *     summary: Get the current courier's full profile
 *     responses:
 *       200:
 *         description: Profile object
 *       404: { description: Courier not found }
 *   patch:
 *     tags: [Courier]
 *     summary: Edit profile (name / avatarUrl)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200: { description: Updated courier }
 *       400: { description: No fields provided }
 *
 * /courier/me/profile:
 *   patch:
 *     tags: [Courier]
 *     summary: Onboarding profile setup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workId, name, team, transportation, vehicleNumber]
 *             properties:
 *               workId: { type: string }
 *               name: { type: string }
 *               team: { type: string }
 *               transportation: { type: string, enum: [BICYCLE, CAR, TRUCK] }
 *               vehicleNumber: { type: string }
 *     responses:
 *       200: { description: Updated courier }
 *       400: { description: Validation error }
 *       409: { description: workId in use }
 *
 * /courier/settings:
 *   get:
 *     tags: [Courier]
 *     summary: Get courier settings
 *     responses:
 *       200:
 *         description: Settings object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 billingMethod: { type: string }
 *                 location: { type: string }
 *                 notificationsEnabled: { type: boolean }
 *   patch:
 *     tags: [Courier]
 *     summary: Update courier settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billingMethod: { type: string }
 *               location: { type: string }
 *               notificationsEnabled: { type: boolean }
 *     responses:
 *       200: { description: Updated settings }
 *       400: { description: No fields provided }
 */
function toCourier(row) {
  return {
    id: row.id,
    workId: row.work_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    team: row.team,
    rate: row.rate,
    level: row.level,
    transportation: row.transportation,
    vehicleNumber: row.vehicle_number,
  };
}

function toSettings(row) {
  return {
    billingMethod: row.billing_method,
    location: row.location,
    notificationsEnabled: row.notifications_enabled,
  };
}

router.get('/me', async (req, res) => {
  const cacheKey = courierKey(req.courierId);
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const [courier] = await sql`
    SELECT * FROM couriers WHERE id = ${req.courierId}
  `;

  if (!courier) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: 'Courier not found',
      details: [],
    });
  }

  const result = toCourier(courier);
  setCache(cacheKey, result);
  res.json(result);
});

router.patch('/me/profile', async (req, res) => {
  const { workId, name, team, transportation, vehicleNumber } = req.body;

  if (!workId || !name || !team || !transportation || !vehicleNumber) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'workId, name, team, transportation and vehicleNumber are required',
      details: [],
    });
  }

  if (!VALID_TRANSPORT.includes(transportation)) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'transportation must be one of BICYCLE, CAR, TRUCK',
      details: [],
    });
  }

  const [taken] = await sql`
    SELECT id FROM couriers
    WHERE work_id = ${workId} AND id != ${req.courierId}
  `;

  if (taken) {
    return res.status(409).json({
      error: 'ConflictError',
      message: 'workId already in use',
      details: [],
    });
  }

  const [courier] = await sql`
    UPDATE couriers
    SET work_id = ${workId},
        name = ${name},
        team = ${team},
        transportation = ${transportation},
        vehicle_number = ${vehicleNumber}
    WHERE id = ${req.courierId}
    RETURNING *
  `;

  res.json(toCourier(courier));
  delCache(courierKey(req.courierId));
});

router.patch('/me', async (req, res) => {
  const { name, avatarUrl } = req.body;

  if (name === undefined && avatarUrl === undefined) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'send at least one of name or avatarUrl',
      details: [],
    });
  }

  let courier;

  if (name !== undefined && avatarUrl !== undefined) {
    [courier] = await sql`
      UPDATE couriers
      SET name = ${name}, avatar_url = ${avatarUrl}
      WHERE id = ${req.courierId}
      RETURNING *
    `;
  } else if (name !== undefined) {
    [courier] = await sql`
      UPDATE couriers SET name = ${name}
      WHERE id = ${req.courierId}
      RETURNING *
    `;
  } else {
    [courier] = await sql`
      UPDATE couriers SET avatar_url = ${avatarUrl}
      WHERE id = ${req.courierId}
      RETURNING *
    `;
  }

  res.json(toCourier(courier));
  delCache(courierKey(req.courierId));
});

router.get('/settings', async (req, res) => {
  const [courier] = await sql`
    SELECT billing_method, location, notifications_enabled
    FROM couriers WHERE id = ${req.courierId}
  `;

  if (!courier) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: 'Courier not found',
      details: [],
    });
  }

  res.json(toSettings(courier));
});

router.patch('/settings', async (req, res) => {
  const { billingMethod, location, notificationsEnabled } = req.body;

  if (
    billingMethod === undefined &&
    location === undefined &&
    notificationsEnabled === undefined
  ) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'send at least one of billingMethod, location or notificationsEnabled',
      details: [],
    });
  }

  let courier;

  if (
    billingMethod !== undefined &&
    location !== undefined &&
    notificationsEnabled !== undefined
  ) {
    [courier] = await sql`
      UPDATE couriers
      SET billing_method = ${billingMethod},
          location = ${location},
          notifications_enabled = ${notificationsEnabled}
      WHERE id = ${req.courierId}
      RETURNING billing_method, location, notifications_enabled
    `;
  } else if (billingMethod !== undefined && location !== undefined) {
    [courier] = await sql`
      UPDATE couriers
      SET billing_method = ${billingMethod}, location = ${location}
      WHERE id = ${req.courierId}
      RETURNING billing_method, location, notifications_enabled
    `;
  } else if (billingMethod !== undefined && notificationsEnabled !== undefined) {
    [courier] = await sql`
      UPDATE couriers
      SET billing_method = ${billingMethod}, notifications_enabled = ${notificationsEnabled}
      WHERE id = ${req.courierId}
      RETURNING billing_method, location, notifications_enabled
    `;
  } else if (location !== undefined && notificationsEnabled !== undefined) {
    [courier] = await sql`
      UPDATE couriers
      SET location = ${location}, notifications_enabled = ${notificationsEnabled}
      WHERE id = ${req.courierId}
      RETURNING billing_method, location, notifications_enabled
    `;
  } else if (billingMethod !== undefined) {
    [courier] = await sql`
      UPDATE couriers SET billing_method = ${billingMethod}
      WHERE id = ${req.courierId}
      RETURNING billing_method, location, notifications_enabled
    `;
  } else if (location !== undefined) {
    [courier] = await sql`
      UPDATE couriers SET location = ${location}
      WHERE id = ${req.courierId}
      RETURNING billing_method, location, notifications_enabled
    `;
  } else {
    [courier] = await sql`
      UPDATE couriers SET notifications_enabled = ${notificationsEnabled}
      WHERE id = ${req.courierId}
      RETURNING billing_method, location, notifications_enabled
    `;
  }

  res.json(toSettings(courier));
  delCache(courierKey(req.courierId));
});

export default router;

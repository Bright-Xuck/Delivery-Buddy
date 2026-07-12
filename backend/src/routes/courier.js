import express from 'express';
import sql from '../db/connection.js';

const router = express.Router();

const VALID_TRANSPORT = ['BICYCLE', 'CAR', 'TRUCK'];

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

  res.json(toCourier(courier));
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
});

export default router;

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sql from '../db/connection.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'email, password and name are required',
      details: [],
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'password must be at least 8 characters',
      details: [],
    });
  }

  const [existing] = await sql`
    SELECT id FROM couriers WHERE email = ${email}
  `;
  if (existing) {
    return res.status(409).json({
      error: 'ConflictError',
      message: 'Email already registered',
      details: [],
    });
  }

  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO couriers (id, email, name, password_hash, work_id)
    VALUES (${id}, ${email}, ${name}, ${password_hash}, ${id})
  `;

  const token = jwt.sign({ courierId: id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  res.status(201).json({
    token,
    courier: { id, email, name },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'email and password are required',
      details: [],
    });
  }

  const [courier] = await sql`
    SELECT * FROM couriers WHERE email = ${email}
  `;
  if (!courier) {
    return res.status(401).json({
      error: 'UnauthorizedError',
      message: 'Invalid credentials',
      details: [],
    });
  }

  const match = await bcrypt.compare(password, courier.password_hash);
  if (!match) {
    return res.status(401).json({
      error: 'UnauthorizedError',
      message: 'Invalid credentials',
      details: [],
    });
  }

  const token = jwt.sign({ courierId: courier.id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  res.json({
    token,
    courier: {
      id: courier.id,
      email: courier.email,
      name: courier.name,
    },
  });
});

router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'logged out' });
});

export default router;
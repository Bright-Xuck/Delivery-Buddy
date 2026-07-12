import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from '../db/connection.js';

const router = express.Router();

async function getBalance(courierId) {
  const [row] = await sql`
    SELECT COALESCE(SUM(amount), 0) AS balance
    FROM transactions
    WHERE courier_id = ${courierId}
  `;
  return Number(row.balance);
}

router.get('/', async (req, res) => {
  const [courier] = await sql`
    SELECT rate, level FROM couriers WHERE id = ${req.courierId}
  `;

  const [totals] = await sql`
    SELECT
      COALESCE(SUM(amount), 0) AS balance,
      COALESCE(SUM(CASE WHEN type = 'TIP' THEN amount ELSE 0 END), 0) AS tips
    FROM transactions
    WHERE courier_id = ${req.courierId}
  `;

  res.json({
    balance: Number(totals.balance),
    tips: Number(totals.tips),
    rate: courier.rate,
    level: courier.level,
  });
});

router.get('/transactions', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const rows = await sql`
    SELECT t.id, t.type, t.amount, t.created_at, o.order_number, o.tip AS order_tip
    FROM transactions t
    LEFT JOIN orders o ON o.id = t.order_id
    WHERE t.courier_id = ${req.courierId}
      AND t.type IN ('EARNING', 'WITHDRAWAL')
    ORDER BY t.created_at DESC
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const transactions = pageRows.map((row) => {
    if (row.type === 'WITHDRAWAL') {
      return {
        type: 'WITHDRAWAL',
        date: row.created_at,
        amount: row.amount,
      };
    }

    return {
      orderNumber: row.order_number,
      date: row.created_at,
      amount: row.amount,
      tip: row.order_tip,
    };
  });

  res.json({
    transactions,
    page,
    hasMore,
  });
});

router.post('/withdraw', async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'amount must be greater than 0',
      details: [],
    });
  }

  const balance = await getBalance(req.courierId);

  if (amount > balance) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'amount exceeds balance',
      details: [],
    });
  }

  const transactionId = uuidv4();
  const negativeAmount = -amount;

  await sql`
    INSERT INTO transactions (id, courier_id, order_id, type, amount)
    VALUES (${transactionId}, ${req.courierId}, NULL, 'WITHDRAWAL', ${negativeAmount})
  `;

  const newBalance = balance - amount;

  res.json({
    newBalance,
    transactionId,
  });
});

export default router;

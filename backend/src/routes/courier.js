import express from 'express';

const router = express.Router();

router.get('/me', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.patch('/me/profile', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.patch('/me', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/settings', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.patch('/settings', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

export default router;

import express from 'express';

const router = express.Router();

router.post('/signup', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/logout', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

export default router;

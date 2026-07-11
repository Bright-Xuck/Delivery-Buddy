import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import authRoutes from './auth.js';
import courierRoutes from './courier.js';
import shiftRoutes from './shifts.js';
import orderRoutes from './orders.js';
import walletRoutes from './wallet.js';
import chatRoutes from './chat.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courier', requireAuth, courierRoutes);
router.use('/shifts', requireAuth, shiftRoutes);
router.use('/orders', requireAuth, orderRoutes);
router.use('/wallet', requireAuth, walletRoutes);
router.use('/chat', requireAuth, chatRoutes);

export default router;

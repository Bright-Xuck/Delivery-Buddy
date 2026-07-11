import express from 'express';
import authRoutes from './auth.js';
import courierRoutes from './courier.js';
import shiftRoutes from './shifts.js';
import orderRoutes from './orders.js';
import walletRoutes from './wallet.js';
import chatRoutes from './chat.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courier', courierRoutes);
router.use('/shifts', shiftRoutes);
router.use('/orders', orderRoutes);
router.use('/wallet', walletRoutes);
router.use('/chat', chatRoutes);

export default router;

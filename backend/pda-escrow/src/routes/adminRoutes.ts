import { Router } from 'express';
import { adminAuthGuard } from '../middleware/adminAuthGuard';
import {
  getHouseBalance,
  depositToHouseWallet,
  withdrawFromHouseWallet,
  getHouseProfitLoss,
} from '../controllers/houseController';

const router = Router();

/**
 * Admin routes for house wallet management
 * All routes are protected by adminAuthGuard middleware
 * Requires x-api-key header with valid ADMIN_API_KEY
 */

// GET /house/balance - Get current house wallet balance
router.get('/house/balance', adminAuthGuard, getHouseBalance);

// POST /house/deposit - Deposit funds to house wallet (devnet/testnet only via airdrop)
router.post('/house/deposit', adminAuthGuard, depositToHouseWallet);

// POST /house/withdraw - Withdraw funds from house wallet to specified destination
router.post('/house/withdraw', adminAuthGuard, withdrawFromHouseWallet);

// GET /house/profit-loss - Get house profit/loss from transaction logs
router.get('/house/profit-loss', adminAuthGuard, getHouseProfitLoss);

export default router;


/**
 * POST /api/admin
 * Admin-only endpoints: deposit and withdraw
 * Handles both deposit and withdraw operations based on action parameter
 */

import { depositService } from '../backend/services/admin/depositService.js';
import { withdrawService } from '../backend/services/admin/withdrawService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const apiKey = req.headers['x-admin-api-key'] || req.body.adminApiKey;
    const { action, ...body } = req.body;

    if (!action || (action !== 'deposit' && action !== 'withdraw')) {
      return res.status(400).json({
        success: false,
        error: 'action must be either "deposit" or "withdraw"',
      });
    }

    let result;
    if (action === 'deposit') {
      result = await depositService(body, apiKey);
    } else {
      result = await withdrawService(body, apiKey);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Admin Error:', error);
    
    // Handle unauthorized
    if (error.message && error.message.includes('Unauthorized')) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    
    // Handle validation errors
    if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    
    // Handle insufficient balance for withdraw
    if (error.message && error.message.includes('Insufficient')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        houseBalanceLamports: error.houseBalanceLamports,
        houseBalanceSOL: error.houseBalanceSOL,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process admin request',
    });
  }
}


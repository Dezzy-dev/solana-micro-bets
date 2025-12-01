/**
 * POST /api/cancel-bet
 * Cancels a bet if timeout has passed
 */

import { cancelBetService } from '../backend/services/bet/cancelBetService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const result = await cancelBetService(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Cancel Bet Error:', error);
    
    // Handle validation errors
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    
    // Return 501 for not implemented
    if (error.message.includes('Cancellation requires')) {
      return res.status(501).json({
        success: false,
        error: error.message,
        note: 'Without a program, we cannot transfer from a SystemProgram-owned account. Please implement a program or use an alternative account structure.',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel bet',
    });
  }
}


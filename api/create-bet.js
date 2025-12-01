/**
 * POST /api/create-bet
 * Creates a new bet transaction (unsigned, for player to sign)
 */

import { createBetService } from '../backend/services/bet/createBetService.js';

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
    const result = await createBetService(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Create Bet Error:', error);
    
    // Handle validation errors
    if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create bet transaction',
    });
  }
}


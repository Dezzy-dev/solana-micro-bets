/**
 * POST /api/bets/resolve
 * Resolves a bet (house signs and sends transaction)
 */
import { resolveBetService } from '../../backend/services/bet/resolveBetService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const result = await resolveBetService(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Resolve Bet Error:', error);
    
    // Handle validation errors
    if (error.message?.includes('required') || 
        error.message?.includes('not found') || 
        error.message?.includes('already settled') ||
        error.message?.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve bet',
    });
  }
}


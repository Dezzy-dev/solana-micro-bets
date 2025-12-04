/**
 * POST /api/admin/house/deposit
 * Deposits to house vault (for demo purposes, this is a no-op if HOUSE==vault)
 * Requires admin API key
 */
import { depositService } from '../../../backend/services/admin/depositService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

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
    const apiKey = req.headers['x-api-key'] || req.body.adminApiKey;
    const result = await depositService(req.body, apiKey);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Deposit Error:', error);
    
    // Handle unauthorized
    if (error.message && error.message.includes('Unauthorized')) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    
    // Handle validation errors
    if (error.message && (error.message.includes('required') || error.message.includes('must be'))) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to deposit to house wallet',
    });
  }
}


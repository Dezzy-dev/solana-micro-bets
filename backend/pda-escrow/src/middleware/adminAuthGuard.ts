import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware to protect admin routes with API key authentication
 * 
 * Reads the admin API key from process.env.ADMIN_API_KEY
 * Checks for the key in the request header "x-api-key"
 * 
 * Returns 403 with error message if key is missing or invalid
 * Calls next() if key is valid
 */
export function adminAuthGuard(req: Request, res: Response, next: NextFunction): void {
  const adminApiKey = process.env.ADMIN_API_KEY;

  // Check if ADMIN_API_KEY is configured
  if (!adminApiKey || adminApiKey.trim() === '') {
    console.error('ADMIN_API_KEY is not configured in environment variables');
    res.status(500).json({
      error: 'Server configuration error: Admin API key not configured',
    });
    return;
  }

  // Get API key from request header
  const requestApiKey = req.headers['x-api-key'] as string;

  // Check if API key is provided
  if (!requestApiKey) {
    res.status(403).json({
      error: 'Unauthorized: Invalid admin key',
    });
    return;
  }

  // Compare API keys (case-sensitive)
  if (requestApiKey.trim() !== adminApiKey.trim()) {
    res.status(403).json({
      error: 'Unauthorized: Invalid admin key',
    });
    return;
  }

  // API key is valid, proceed to next middleware/route handler
  next();
}


import { supabase } from '../config/supabase.js';

/**
 * Middleware to verify JWT token from Supabase
 * Extracts user from the Authorization header
 */
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Auth middleware: Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Auth middleware: Verifying token...');

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth middleware: Token validation failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('Auth middleware: User authenticated:', user.id);
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware: Unexpected error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}


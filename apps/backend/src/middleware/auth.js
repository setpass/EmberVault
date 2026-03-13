const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Simple API key auth for write operations.
 * Set EMBERVAULT_API_KEY in your environment.
 * Reads skip auth; writes require x-api-key header.
 */
export function authMiddleware(req, res, next) {
  if (!WRITE_METHODS.includes(req.method)) {
    return next();
  }

  const apiKey = process.env.EMBERVAULT_API_KEY;

  // If no key configured, warn loudly but allow in dev
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Server misconfiguration: EMBERVAULT_API_KEY not set.' });
    }
    console.warn('[auth] WARNING: EMBERVAULT_API_KEY not set. Write routes are unprotected.');
    return next();
  }

  const provided = req.headers['x-api-key'];
  if (provided !== apiKey) {
    return res.status(401).json({ message: 'Unauthorized: invalid or missing API key.' });
  }

  next();
}

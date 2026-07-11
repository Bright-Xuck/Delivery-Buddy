import jwt from 'jsonwebtoken';

export default function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UnauthorizedError',
      message: 'Authentication required',
      details: [],
    });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.courierId = decoded.courierId;
    next();
  } catch {
    return res.status(401).json({
      error: 'UnauthorizedError',
      message: 'Invalid or expired token',
      details: [],
    });
  }
}

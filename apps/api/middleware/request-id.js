import { randomUUID } from 'node:crypto';

// Ensures every request carries an id for log correlation and error responses.
// Honours an inbound X-Request-Id (set by the load balancer) or mints one.
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] ?? randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

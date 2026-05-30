// Wraps an async route handler so a rejected promise is forwarded to Express's
// error middleware instead of crashing the process. Lets controllers be written
// as plain `async (req, res) => ...` without try/catch boilerplate.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

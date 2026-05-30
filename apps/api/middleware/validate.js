import { ZodError } from 'zod';

import { AppError } from '../utils/app-error';

// Validation middleware factory. Validates and *replaces* the chosen request
// part with the parsed (and coerced/defaulted) value:
//
//   router.post('/', validate(createThingSchema), controller.create)
//   router.get('/', validate(listSchema, 'query'), controller.list)
//
// A ZodError becomes a 400 with field-level details, matching the old
// ZodValidationPipe / GlobalExceptionFilter response shape.
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new AppError(400, 'validation_error', err.flatten().fieldErrors),
        );
      }
      next(err);
    }
  };
}

import { z } from 'zod'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details)
export const unauthorized = (message = 'Unauthorized') =>
  new HttpError(401, message)
export const forbidden = (message = 'Forbidden') =>
  new HttpError(403, message)
export const notFound = (message = 'Not found') =>
  new HttpError(404, message)
export const conflict = (message: string) => new HttpError(409, message)

/** Parse untrusted input with a zod schema, throwing a 400 HttpError on failure. */
export function parse<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new HttpError(
      400,
      'Validation failed',
      z.flattenError(result.error),
    )
  }
  return result.data
}

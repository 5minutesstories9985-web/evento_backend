// zod validation middleware. Pass a schema for body/query/params.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues.map((i) => i.message).join(', ') });
  }
  req[source] = result.data;
  next();
};

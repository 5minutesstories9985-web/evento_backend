// Central error handler. Always returns { error }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: err.message || 'Internal error' });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

const securityHeaders = {
  'Content-Type': 'application/json',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function success(body, statusCode = 200) {
  return {
    statusCode,
    headers: { ...securityHeaders },
    body: JSON.stringify(body),
  };
}

export function error(message, statusCode = 400) {
  return {
    statusCode,
    headers: { ...securityHeaders },
    body: JSON.stringify({ error: message }),
  };
}


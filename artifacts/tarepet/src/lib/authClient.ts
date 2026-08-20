import { authClient } from './api-auth';

/**
 * Tarepet Django REST API Auth Client
 *
 * All authentication requests are routed to the Django REST Framework backend.
 * Endpoints: /api/v1/auth/login/, /api/v1/auth/refresh/, /api/v1/auth/me/
 */
export { authClient };


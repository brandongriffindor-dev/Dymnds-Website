/**
 * Request ID generation for API error tracking.
 * Generates short, unique IDs for tracking requests in logs and error responses.
 * Helps correlate errors between frontend and backend logs.
 */

import { randomUUID } from 'crypto';

export function generateRequestId(): string {
  return randomUUID().slice(0, 8);
}

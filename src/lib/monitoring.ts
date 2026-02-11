/**
 * Monitoring configuration and health check endpoint.
 *
 * Uptime Monitoring Setup:
 * 1. Sign up at uptimerobot.com (free tier: 50 monitors, 5-min intervals)
 * 2. Add monitors:
 *    - https://dymnds.ca (HTTP, check every 5 min)
 *    - https://dymnds.ca/api/health (HTTP, check every 5 min)
 * 3. Set alert contacts (email + optional Slack/Discord webhook)
 *
 * Alternative: Better Stack (betterstack.com) — nicer UI, status pages
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    firebase: boolean;
    upstash?: boolean;
    stripe?: boolean;
  };
}

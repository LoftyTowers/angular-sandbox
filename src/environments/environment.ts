export const environment = {
  production: false,
  apiBaseUrl: '/api',
  defaultCurrency: 'GBP',
  mockApi: {
    enabled: true,
    minLatencyMs: 150,
    maxLatencyMs: 600,
    transientFailureRate: 0.15,
  },
} as const;

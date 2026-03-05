export const environment = {
  production: true,
  apiBaseUrl: 'https://api.workshops.example',
  defaultCurrency: 'GBP',
  mockApi: {
    enabled: false,
    minLatencyMs: 0,
    maxLatencyMs: 0,
    transientFailureRate: 0,
  },
} as const;

module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 3,
      startServerCommand: 'node scripts/serve.js',
      startServerReadyPattern: 'QA server listening',
      startServerReadyTimeout: 15000,
      settings: {
        chromeFlags: '--headless --no-sandbox',
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.85, aggregationMethod: 'optimistic'}],
        'categories:accessibility': ['error', {minScore: 0.95, aggregationMethod: 'optimistic'}],
        'categories:best-practices': ['error', {minScore: 0.90, aggregationMethod: 'optimistic'}],
        'categories:seo': ['error', {minScore: 0.90, aggregationMethod: 'optimistic'}],
        'first-contentful-paint': ['error', {maxNumericValue: 2500, aggregationMethod: 'optimistic'}],
        'largest-contentful-paint': ['error', {maxNumericValue: 3500, aggregationMethod: 'optimistic'}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.10, aggregationMethod: 'optimistic'}],
        'total-blocking-time': ['error', {maxNumericValue: 300, aggregationMethod: 'optimistic'}],
        'total-byte-weight': ['error', {maxNumericValue: 3000000, aggregationMethod: 'optimistic'}]
      }
    }
  }
};

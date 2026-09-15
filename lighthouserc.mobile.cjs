const base = require('./lighthouserc.cjs');

module.exports = {
  ci: {
    collect: {
      ...base.ci.collect,
      warmupRuns: 1,
      expectedFormFactor: 'mobile',
      settings: {
        chromeFlags: '--headless --no-sandbox'
      }
    },
    assert: base.ci.assert
  }
};

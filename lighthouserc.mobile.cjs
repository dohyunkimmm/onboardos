const base = require('./lighthouserc.cjs');

module.exports = {
  ci: {
    collect: {
      ...base.ci.collect,
      expectedFormFactor: 'mobile',
      settings: {
        chromeFlags: '--headless --no-sandbox'
      }
    },
    assert: base.ci.assert
  }
};

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIntegrityManifest } = require('../public-assets');

test('production manifest separates static public files from server-only source', () => {
  const { assets, sourceOnlyFiles } = validateIntegrityManifest();
  assert.ok(assets.length >= 20);
  assert.ok(assets.includes('index.html'));
  for(const file of ['api/recommend.js', 'lib/recommendation.js', 'lib/recommendation-rate-limit.js', 'scripts/release-contract.js']){
    assert.ok(sourceOnlyFiles.includes(file), `${file} should be source-only`);
    assert.ok(!assets.includes(file), `${file} must not be fetched as a public asset`);
  }
});

test('production manifest refuses server-only source in the public asset group', () => {
  const manifest = require('../../integrity-assets.json');
  const polluted = {...manifest, requiredFiles:[...manifest.requiredFiles, 'api/recommend.js']};
  assert.throws(() => validateIntegrityManifest(polluted), /multiple manifest groups/);
});

test('production manifest requires API source coverage', () => {
  const manifest = require('../../integrity-assets.json');
  const missing = {...manifest, sourceOnlyFiles:manifest.sourceOnlyFiles.filter(x => x !== 'api/recommend.js')};
  assert.throws(() => validateIntegrityManifest(missing), /server source coverage missing/);
});

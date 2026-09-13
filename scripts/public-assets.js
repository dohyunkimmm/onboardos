'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = 'integrity-assets.json';

const fail = message => {
  throw new Error(`integrity manifest: ${message}`);
};

const readJson = file => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`${file} is invalid JSON: ${error.message}`);
  }
};

const normalizeRelative = value => {
  if(typeof value !== 'string' || !value.trim()) fail('asset path must be a non-empty string');
  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '');
  if(path.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')){
    fail(`unsafe asset path: ${value}`);
  }
  return normalized;
};

const assertRegularFile = file => {
  if(!fs.existsSync(file)) fail(`missing file: ${file}`);
  const stat = fs.lstatSync(file);
  if(stat.isSymbolicLink()) fail(`symbolic links are not allowed: ${file}`);
  if(!stat.isFile()) fail(`expected regular file: ${file}`);
};

const walk = (root, extensions) => {
  if(!fs.existsSync(root)) fail(`missing recursive root: ${root}`);
  const rootStat = fs.lstatSync(root);
  if(rootStat.isSymbolicLink() || !rootStat.isDirectory()) fail(`invalid recursive root: ${root}`);
  const allowed = new Set(extensions);
  const files = [];
  const visit = current => {
    for(const name of fs.readdirSync(current).sort()){
      const absolute = path.join(current, name);
      const stat = fs.lstatSync(absolute);
      if(stat.isSymbolicLink()) fail(`symbolic links are not allowed: ${absolute}`);
      if(stat.isDirectory()) visit(absolute);
      else if(stat.isFile() && allowed.has(path.extname(name))) files.push(absolute.replace(/\\/g, '/'));
    }
  };
  visit(root);
  return files;
};

function validateIntegrityManifest(manifest = readJson(MANIFEST_PATH)){
  if(manifest.schemaVersion !== 1) fail(`schemaVersion must be 1, found ${manifest.schemaVersion}`);
  if(manifest.profile !== 'production-critical-public-assets') fail(`unexpected profile: ${manifest.profile}`);
  if(!Array.isArray(manifest.requiredFiles) || !manifest.requiredFiles.length) fail('requiredFiles must be non-empty');
  if(!Array.isArray(manifest.recursiveSets) || !manifest.recursiveSets.length) fail('recursiveSets must be non-empty');

  const assets = new Set();
  for(const raw of manifest.requiredFiles){
    const file = normalizeRelative(raw);
    assertRegularFile(file);
    if(assets.has(file)) fail(`duplicate asset: ${file}`);
    assets.add(file);
  }

  for(const set of manifest.recursiveSets){
    const root = normalizeRelative(set?.root);
    if(!Array.isArray(set?.extensions) || !set.extensions.length) fail(`recursive set ${root} needs extensions`);
    const extensions = set.extensions.map(ext => {
      if(typeof ext !== 'string' || !/^\.[a-z0-9]+$/i.test(ext)) fail(`invalid extension in ${root}: ${ext}`);
      return ext.toLowerCase();
    });
    for(const file of walk(root, extensions)){
      if(assets.has(file)) fail(`asset appears in more than one manifest rule: ${file}`);
      assets.add(file);
    }
  }

  for(const required of [MANIFEST_PATH, 'release.json', 'version.txt', 'index.html', 'production-demo.html']){
    if(!assets.has(required)) fail(`canonical coverage missing ${required}`);
  }
  if(assets.size < 20) fail(`unexpectedly small asset surface: ${assets.size}`);

  return { manifest, assets:[...assets].sort() };
}

function collectPublicAssets(){
  return validateIntegrityManifest().assets;
}

if(require.main === module){
  try {
    const { manifest, assets } = validateIntegrityManifest();
    console.log(`Integrity manifest PASS: ${assets.length} assets · ${manifest.profile}`);
  } catch (error) {
    console.error(`INTEGRITY MANIFEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { MANIFEST_PATH, collectPublicAssets, validateIntegrityManifest };

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
let errors = 0;

// 1. No root-level wrangler config (would hijack Pages project)
['wrangler.jsonc', 'wrangler.toml', 'wrangler.json'].forEach(f => {
  if (fs.existsSync(path.join(root, f))) {
    console.error(`FATAL: ${f} found at project root. This will destroy the Pages project.`);
    errors++;
  }
});

// 2. No @cloudflare/vite-plugin (converts Pages to Workers)
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
if (allDeps['@cloudflare/vite-plugin']) {
  console.error('FATAL: @cloudflare/vite-plugin found in package.json. This converts Pages to Workers.');
  errors++;
}

// 3. No wrangler deploy/dev in npm scripts
Object.entries(pkg.scripts || {}).forEach(([name, cmd]) => {
  if (typeof cmd === 'string' && (cmd.includes('wrangler deploy') || cmd.includes('wrangler dev'))) {
    console.error(`FATAL: npm script "${name}" contains wrangler deploy/dev. Pages deploys via git push only.`);
    errors++;
  }
});

// 4. vite.config.ts clean of cloudflare plugin
const vitePath = path.join(root, 'vite.config.ts');
if (fs.existsSync(vitePath)) {
  const viteConfig = fs.readFileSync(vitePath, 'utf8');
  if (viteConfig.includes('@cloudflare/vite-plugin') || viteConfig.includes('cloudflare()')) {
    console.error('FATAL: vite.config.ts contains @cloudflare/vite-plugin references.');
    errors++;
  }
}

// 5. package.json is valid JSON (catches truncation/corruption)
try {
  JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
} catch (e) {
  console.error('FATAL: package.json is not valid JSON. File may be corrupted.');
  errors++;
}

if (errors > 0) {
  console.error(`\n${errors} FATAL error(s) found. DO NOT DEPLOY.`);
  process.exit(1);
} else {
  console.log('Deploy safety checks passed.');
}

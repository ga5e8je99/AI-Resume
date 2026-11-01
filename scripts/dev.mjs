import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

// 1. Normalize Windows drive-letter casing (e.g. c:\ -> C:\) so Node require.cache
// and Webpack output paths always share identical drive-letter casing.
try {
  const canonicalCwd = fs.realpathSync.native(process.cwd());
  if (canonicalCwd !== process.cwd()) {
    process.chdir(canonicalCwd);
  }
} catch {
  // Ignore if native realpath fails
}

// 2. Ensure Next.js require-cache.js handles both lowercase and uppercase drive letters on Windows
const requireCachePath = path.join(
  process.cwd(),
  'node_modules',
  'next',
  'dist',
  'server',
  'dev',
  'require-cache.js'
);

try {
  if (fs.existsSync(requireCachePath)) {
    const content = fs.readFileSync(requireCachePath, 'utf8');
    if (!content.includes('removeModFromRequireCache')) {
      const target = `    const mod = require.cache[filePath];
    if (mod) {
        // remove the child reference from all parent modules
        for (const parent of Object.values(require.cache)){
            if (parent == null ? void 0 : parent.children) {
                const idx = parent.children.indexOf(mod);
                if (idx >= 0) parent.children.splice(idx, 1);
            }
        }
        // remove parent references from external modules
        for (const child of mod.children){
            child.parent = null;
        }
        delete require.cache[filePath];
        return true;
    }
    return false;`;
      const replacement = `    const keysToTry = [filePath];
    if (process.platform === 'win32' && typeof filePath === 'string' && /^[a-zA-Z]:/.test(filePath)) {
        const lowerKey = filePath[0].toLowerCase() + filePath.slice(1);
        const upperKey = filePath[0].toUpperCase() + filePath.slice(1);
        if (!keysToTry.includes(lowerKey)) keysToTry.push(lowerKey);
        if (!keysToTry.includes(upperKey)) keysToTry.push(upperKey);
    }
    let deleted = false;
    for (const key of keysToTry) {
        const mod = require.cache[key];
        if (mod) {
            for (const parent of Object.values(require.cache)){
                if (parent == null ? void 0 : parent.children) {
                    const idx = parent.children.indexOf(mod);
                    if (idx >= 0) parent.children.splice(idx, 1);
                }
            }
            for (const child of mod.children){
                child.parent = null;
            }
            delete require.cache[key];
            deleted = true;
        }
    }
    return deleted; // removeModFromRequireCache`;
      if (content.includes(target)) {
        fs.writeFileSync(requireCachePath, content.replace(target, replacement), 'utf8');
      }
    }
  }
} catch {
  // Non-fatal
}

// 3. Launch next dev --webpack with canonicalized working directory
const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const extraArgs = process.argv.slice(2);
const args = [nextBin, 'dev', '--webpack', ...extraArgs];

const child = spawn(process.execPath, args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PRIVATE_DEV_DIR: process.cwd(),
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});


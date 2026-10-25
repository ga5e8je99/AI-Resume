import fs from 'fs';
import path from 'path';
import { uploadFiles } from '@huggingface/hub';

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error('❌ HF_TOKEN environment variable is required.');
  process.exit(1);
}
const REPO_NAME = 'Gamal306/JobMatch-AI';

// Patterns to ignore
const IGNORED_DIRS = new Set([
  '.git',
  '.next',
  'node_modules',
  '.vscode',
  '.idea',
  '.data',
]);

const IGNORED_FILES = new Set([
  '.env.local',
  'next-env.d.ts',
  'tsconfig.tsbuildinfo',
  'deploy-hf.mjs',
]);

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of list) {
    const fullPath = path.join(dir, dirent.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (dirent.isDirectory()) {
      if (IGNORED_DIRS.has(dirent.name)) continue;
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      if (IGNORED_FILES.has(dirent.name)) continue;
      if (dirent.name.endsWith('.log')) continue;
      results.push({ fullPath, relPath });
    }
  }

  return results;
}

async function main() {
  console.log(`🚀 Gathering project files for deployment to Hugging Face Space: ${REPO_NAME}...`);
  const rootDir = process.cwd();
  const fileEntries = getAllFiles(rootDir);

  console.log(`📦 Found ${fileEntries.length} files to upload.`);

  // Create Blob list for uploadFiles
  const filesToUpload = fileEntries.map(({ fullPath, relPath }) => {
    const buffer = fs.readFileSync(fullPath);
    return {
      path: relPath,
      content: new Blob([buffer]),
    };
  });

  console.log(`📡 Committing directly to https://huggingface.co/spaces/${REPO_NAME}...`);
  console.log(`(Hugging Face will automatically manage LFS for binary files)`);

  const commitResult = await uploadFiles({
    repo: {
      type: 'space',
      name: REPO_NAME,
    },
    accessToken: HF_TOKEN,
    files: filesToUpload,
    commitTitle: 'Deploy JobMatch AI Full Application to Hugging Face Spaces',
    commitDescription: 'Auto-deployed via JobMatch Deployment Pipeline',
  });

  console.log('✅ Commit successful! Commit URL:', commitResult.hookUrl || commitResult.commit?.oid);
  console.log(`🎉 Demo is building and will be live at: https://huggingface.co/spaces/${REPO_NAME}`);
}

main().catch((err) => {
  console.error('❌ Upload error:', err.message);
  if (err.data) {
    console.error('API Error Data:', JSON.stringify(err.data, null, 2));
  }
  process.exit(1);
});

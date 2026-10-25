import fs from 'fs';
import path from 'path';
import { uploadFiles } from '@huggingface/hub';

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error('❌ HF_TOKEN environment variable is required.');
  process.exit(1);
}
const REPO_NAME = 'Gamal306/JobMatch-AI';

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of list) {
    const fullPath = path.join(dir, dirent.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (dirent.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push({ fullPath, relPath });
    }
  }

  return results;
}

async function main() {
  console.log(`🚀 Preparing full interactive Next.js application for Hugging Face deployment...`);
  const outDir = path.resolve('out');

  if (!fs.existsSync(outDir)) {
    throw new Error('❌ "out" directory does not exist. Run build first.');
  }

  // Ensure directory index.html exists for all pages for clean URLs in static hosting
  const pages = ['cv-builder', 'builder', 'cover-letter', 'dashboard', 'login', 'register', 'review', 'privacy', 'terms', 'admin'];
  for (const page of pages) {
    const htmlFile = path.join(outDir, `${page}.html`);
    const pageDir = path.join(outDir, page);
    const dirIndex = path.join(pageDir, 'index.html');
    if (fs.existsSync(htmlFile)) {
      if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
      fs.copyFileSync(htmlFile, dirIndex);
      console.log(`✨ Generated ${page}/index.html`);
    }
  }

  const allEntries = getAllFiles(outDir);
  console.log(`📦 Found ${allEntries.length} files in out/ directory.`);

  const readmeContent = `---
title: JobMatch AI
emoji: 🚀
colorFrom: purple
colorTo: green
sdk: static
pinned: false
---

# JobMatch AI — المنصة الذكية للسير الذاتية وخطابات التقديم
Live interactive application running directly on Hugging Face Spaces.
`;

  // Create list of files
  const filesToUpload = [
    {
      path: 'README.md',
      content: new Blob([Buffer.from(readmeContent, 'utf-8')]),
    },
  ];

  for (const entry of allEntries) {
    const buffer = fs.readFileSync(entry.fullPath);
    filesToUpload.push({
      path: entry.relPath,
      content: new Blob([buffer]),
    });
  }

  console.log(`📡 Uploading ${filesToUpload.length} files to https://huggingface.co/spaces/${REPO_NAME}...`);

  // Upload in chunks if necessary (HF commit limit is usually 500-1000 files per commit)
  const CHUNK_SIZE = 250;
  for (let i = 0; i < filesToUpload.length; i += CHUNK_SIZE) {
    const chunk = filesToUpload.slice(i, i + CHUNK_SIZE);
    console.log(`⏳ Committing batch ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(filesToUpload.length / CHUNK_SIZE)} (${chunk.length} files)...`);
    
    await uploadFiles({
      repo: {
        type: 'space',
        name: REPO_NAME,
      },
      accessToken: HF_TOKEN,
      files: chunk,
      commitTitle: `Deploy JobMatch AI Application Batch ${Math.floor(i / CHUNK_SIZE) + 1}`,
      commitDescription: 'Full interactive Next.js application deployment',
    });
  }

  console.log('✅ Deployment to Hugging Face completed successfully!');
  console.log(`🎉 Space Link: https://huggingface.co/spaces/${REPO_NAME}`);
  console.log(`🌐 Direct Web URL: https://gamal306-jobmatch-ai.static.hf.space`);
}

main().catch((err) => {
  console.error('❌ Deployment error:', err);
  process.exit(1);
});

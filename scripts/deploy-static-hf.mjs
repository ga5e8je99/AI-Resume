import fs from 'fs';
import path from 'path';
import { uploadFiles } from '@huggingface/hub';

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error('❌ HF_TOKEN is required.');
  process.exit(1);
}
const REPO_NAME = 'Gamal306/JobMatch-AI';

async function main() {
  console.log(`🚀 Uploading JobMatch AI Demo Portal to Hugging Face Space: ${REPO_NAME}...`);

  const htmlContent = fs.readFileSync('scripts/static-space/index.html');
  const readmeContent = `---
title: JobMatch AI
emoji: 🚀
colorFrom: purple
colorTo: green
sdk: static
pinned: false
---

# JobMatch AI Demo Portal
Official live demo on Hugging Face Spaces: https://huggingface.co/spaces/Gamal306/JobMatch-AI
`;

  const filesToUpload = [
    {
      path: 'index.html',
      content: new Blob([htmlContent]),
    },
    {
      path: 'README.md',
      content: new Blob([Buffer.from(readmeContent, 'utf-8')]),
    },
  ];

  const result = await uploadFiles({
    repo: {
      type: 'space',
      name: REPO_NAME,
    },
    accessToken: HF_TOKEN,
    files: filesToUpload,
    commitTitle: 'Deploy JobMatch AI Official Demo Portal to Space',
  });

  console.log('✅ Successfully published to Hugging Face Space!');
  console.log(`🎉 Live Demo URL: https://huggingface.co/spaces/${REPO_NAME}`);
  console.log(`🌐 Direct Web URL: https://gamal306-jobmatch-ai.static.hf.space`);
}

main().catch((err) => {
  console.error('❌ Upload error:', err);
  process.exit(1);
});

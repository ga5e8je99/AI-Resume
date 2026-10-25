import fs from 'fs';
import { uploadFiles } from '@huggingface/hub';

const filePath = 'out/404.html';
let html = fs.readFileSync(filePath, 'utf8');

const script = `<script>
(function() {
  var p = window.location.pathname.replace(/\\/+$/, '');
  if (p && !p.endsWith('.html') && !p.includes('.')) {
    window.location.replace(p + '.html' + window.location.search + window.location.hash);
  }
})();
</script>`;

if (!html.includes('window.location.replace')) {
  html = html.replace('<head>', '<head>' + script);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ Injected redirect into out/404.html');
}

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error('❌ HF_TOKEN is required.');
  process.exit(1);
}
const REPO_NAME = 'Gamal306/JobMatch-AI';

async function update404() {
  await uploadFiles({
    repo: { type: 'space', name: REPO_NAME },
    accessToken: HF_TOKEN,
    files: [
      {
        path: '404.html',
        content: new Blob([Buffer.from(html, 'utf8')]),
      },
    ],
    commitTitle: 'Add client-side routing fallback in 404.html',
  });
  console.log('✅ 404.html updated on Hugging Face!');
}

update404().catch(console.error);

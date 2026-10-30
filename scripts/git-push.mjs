#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process';
import readline from 'readline';

function run(cmd, options = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();
}

function runInherit(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

async function askCommitMessage(defaultMsg) {
  // If an argument is provided (e.g. node git-push.mjs "my commit message")
  const argsMsg = process.argv.slice(2).join(' ').trim();
  if (argsMsg) {
    return argsMsg;
  }

  // If running in a non-interactive environment, use default
  if (!process.stdin.isTTY) {
    return defaultMsg;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\x1b[36m📝 Enter commit message (Press Enter for: "${defaultMsg}"): \x1b[0m`, (answer) => {
      rl.close();
      const finalMsg = answer.trim() || defaultMsg;
      resolve(finalMsg);
    });
  });
}

async function main() {
  console.log('\n\x1b[1m\x1b[34m====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m🚀 Git Push Automation Script\x1b[0m');
  console.log('\x1b[1m\x1b[34m====================================================\x1b[0m\n');

  try {
    // 1. Check current git branch
    const branch = run('git rev-parse --abbrev-ref HEAD');
    console.log(`📌 Current Branch: \x1b[33m${branch}\x1b[0m`);

    // 2. Check remote URL
    const remote = run('git remote get-url origin');
    console.log(`🌐 Remote Repository: \x1b[36m${remote}\x1b[0m\n`);

    // 3. Check for modified/untracked files
    const status = run('git status --porcelain');
    if (!status) {
      console.log('\x1b[32m✅ No changes to commit. Working tree is clean!\x1b[0m');
      
      // Still offer to push if there are unpushed commits
      const unpushed = run(`git log origin/${branch}..HEAD --oneline || true`, { shell: true });
      if (unpushed) {
        console.log('\n📤 Found unpushed commits:');
        console.log(unpushed);
        console.log('\nPushing to GitHub...');
        runInherit('git', ['push', 'origin', branch]);
        console.log('\x1b[32m🎉 Pushed successfully!\x1b[0m\n');
      }
      return;
    }

    console.log('📂 Detected changes:');
    const lines = status.split('\n');
    for (const line of lines.slice(0, 15)) {
      console.log(`  \x1b[90m${line}\x1b[0m`);
    }
    if (lines.length > 15) {
      console.log(`  \x1b[90m... and ${lines.length - 15} more files\x1b[0m`);
    }
    console.log('');

    // 4. Determine commit message
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const defaultMsg = `Update: ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const commitMessage = await askCommitMessage(defaultMsg);

    // 5. Stage all changes
    console.log('\n➕ Staging changes (git add .)...');
    runInherit('git', ['add', '.']);

    // 6. Commit
    console.log(`💾 Committing: "${commitMessage}"...`);
    runInherit('git', ['commit', '-m', `"${commitMessage.replace(/"/g, '\\"')}"`]);

    // 7. Push to remote
    console.log(`\n⬆️ Pushing to origin/${branch}...`);
    runInherit('git', ['push', 'origin', branch]);

    console.log('\n\x1b[1m\x1b[32m====================================================\x1b[0m');
    console.log('\x1b[1m\x1b[32m🎉 Successfully pushed all changes to GitHub!\x1b[0m');
    console.log('\x1b[1m\x1b[32m====================================================\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31m❌ Error during git operation:\x1b[0m', err.message);
    process.exit(1);
  }
}

main();

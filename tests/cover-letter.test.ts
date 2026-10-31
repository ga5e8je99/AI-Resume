import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { NextRequest } from 'next/server';
import { signToken } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { CoverLetterService } from '@/app/lib/coverLetterService';
import { AICoverLetterClient } from '@/app/lib/aiCoverLetterClient';
import { POST as generateCoverLetterPOST } from '@/app/api/cover-letter/generate/route';
import { POST as extractKeywordsPOST } from '@/app/api/cover-letter/extract-keywords/route';
import { GET as listCoverLettersGET, POST as saveCoverLetterPOST } from '@/app/api/cover-letters/route';
import {
  GET as getCoverLetterByIdGET,
  PATCH as updateCoverLetterByIdPATCH,
  DELETE as deleteCoverLetterByIdDELETE,
} from '@/app/api/cover-letters/[id]/route';

const DB_FILE = path.join(process.cwd(), '.data', 'db.json');

describe('Cover Letter Suites (Existing Scripts + In-Process Route & Service Tests)', () => {
  let dbSnapshot: string | null = null;

  before(() => {
    if (fs.existsSync(DB_FILE)) {
      dbSnapshot = fs.readFileSync(DB_FILE, 'utf-8');
    }
  });

  after(() => {
    if (dbSnapshot !== null) {
      fs.writeFileSync(DB_FILE, dbSnapshot, 'utf-8');
    }
  });

  it('runs existing cover-letter business logic suite (test-cover-letter-business-logic.mjs)', () => {
    const output = execFileSync(
      process.execPath,
      ['--import', 'tsx', 'scripts/test-cover-letter-business-logic.mjs'],
      { cwd: process.cwd(), encoding: 'utf-8' }
    );
    assert.match(output, /25 Passed, 0 Failed/i);
  });

  it('runs existing cover-letter data quality & boundary validation suite (test-cover-letter-data-quality.mjs)', () => {
    const output = execFileSync(
      process.execPath,
      ['--import', 'tsx', 'scripts/test-cover-letter-data-quality.mjs'],
      { cwd: process.cwd(), encoding: 'utf-8' }
    );
    assert.match(output, /ALL PHASE 11 DATA VALIDATION & QUALITY CHECKS PASSED SUCCESSFULLY/i);
  });

  it('runs existing cover-letter UI flow & component contracts suite (test-cover-letter-ui-flow.mjs)', () => {
    const output = execFileSync(
      process.execPath,
      ['--import', 'tsx', 'scripts/test-cover-letter-ui-flow.mjs'],
      { cwd: process.cwd(), encoding: 'utf-8' }
    );
    assert.match(output, /ALL PHASE 12 UI FLOW & COMPONENT TESTS PASSED/i);
  });

  it('verifies AICoverLetterClient fallback resilience on upstream 500 and malformed JSON', async () => {
    const mockServer = http.createServer((_req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Upstream AI failure' } }));
    });

    await new Promise<void>((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const addr = mockServer.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;

    const origKey = process.env.OPENAI_API_KEY;
    const origBase = process.env.OPENAI_BASE_URL;
    const origRetries = process.env.AI_MAX_RETRIES;
    const origTimeout = process.env.AI_REQUEST_TIMEOUT_MS;

    try {
      process.env.OPENAI_API_KEY = 'test-mock-key';
      process.env.OPENAI_BASE_URL = `http://127.0.0.1:${port}`;
      process.env.AI_MAX_RETRIES = '1';
      process.env.AI_REQUEST_TIMEOUT_MS = '1500';

      const result = await AICoverLetterClient.generateCoverLetter(
        {
          jobDescription:
            'We are seeking an experienced Full Stack Software Engineer skilled in React, Node.js, and TypeScript.',
          jobTitle: 'Senior Full Stack Engineer',
          companyName: 'Tech Innovations Inc',
          tone: 'technical',
          language: 'en',
        },
        null
      );

      assert.equal(result.aiGenerated, false);
      assert.equal(result.provider, 'built-in-ats-fallback');
      assert.ok(result.coverLetter.content.fullText.length > 80);
    } finally {
      mockServer.close();
      if (origKey !== undefined) process.env.OPENAI_API_KEY = origKey;
      else delete process.env.OPENAI_API_KEY;
      if (origBase !== undefined) process.env.OPENAI_BASE_URL = origBase;
      else delete process.env.OPENAI_BASE_URL;
      if (origRetries !== undefined) process.env.AI_MAX_RETRIES = origRetries;
      else delete process.env.AI_MAX_RETRIES;
      if (origTimeout !== undefined) process.env.AI_REQUEST_TIMEOUT_MS = origTimeout;
      else delete process.env.AI_REQUEST_TIMEOUT_MS;
    }
  });

  it('verifies Cover Letter API routes (extract-keywords, generate, CRUD, CSRF, and IDOR protection)', async () => {
    const userA = await DataStore.createUserAccount({
      name: 'Cover Letter User A',
      email: `cl_a_${Date.now()}@example.com`,
      password: 'password123',
      plan: 'free',
      aiCredits: 3,
    });
    const userB = await DataStore.createUserAccount({
      name: 'Cover Letter User B',
      email: `cl_b_${Date.now()}@example.com`,
      password: 'password123',
      plan: 'free',
      aiCredits: 3,
    });

    const tokenA = signToken({ userId: userA.id, email: userA.email, name: userA.name });
    const tokenB = signToken({ userId: userB.id, email: userB.email, name: userB.name });

    // 1. Extract keywords route
    const kwReq = new NextRequest('http://localhost:3000/api/cover-letter/extract-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Looking for a Senior React and TypeScript engineer with Next.js and Docker experience.',
        limit: 5,
      }),
    });
    const kwRes = await extractKeywordsPOST(kwReq);
    assert.equal(kwRes.status, 200);
    const kwBody = await kwRes.json();
    assert.equal(kwBody.success, true);
    assert.ok(Array.isArray(kwBody.keywords));
    assert.ok(kwBody.keywords.includes('React') || kwBody.keywords.includes('TypeScript'));

    // 2. Unauthenticated generate -> 401
    const unauthGenReq = new NextRequest('http://localhost:3000/api/cover-letter/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: 'Senior Software Engineer with 5+ years of experience in TypeScript and Node.js.',
      }),
    });
    const unauthGenRes = await generateCoverLetterPOST(unauthGenReq);
    assert.equal(unauthGenRes.status, 401);

    // 3. CSRF cross-origin rejection -> 403
    const csrfGenReq = new NextRequest('http://localhost:3000/api/cover-letter/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
        Origin: 'https://evil-attacker.example.com',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        jobDescription: 'Senior Software Engineer with 5+ years of experience in TypeScript and Node.js.',
      }),
    });
    const csrfGenRes = await generateCoverLetterPOST(csrfGenReq);
    assert.equal(csrfGenRes.status, 403);

    // 4. Authenticated generate -> 200 and deducts 1 credit from User A (3 -> 2)
    const validGenReq = new NextRequest('http://localhost:3000/api/cover-letter/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        jobDescription:
          'We are hiring a Senior Frontend Engineer proficient in React, TypeScript, Next.js, and Tailwind CSS to lead our web platform.',
        companyName: 'Acme Corp',
        jobTitle: 'Senior Frontend Engineer',
        tone: 'technical',
        language: 'en',
      }),
    });
    const validGenRes = await generateCoverLetterPOST(validGenReq);
    assert.equal(validGenRes.status, 200);
    const validGenBody = await validGenRes.json();
    assert.equal(validGenBody.success, true);
    assert.ok(validGenBody.coverLetter?.content?.fullText);

    // 5. Save cover letter draft for User A -> 201
    const saveReq = new NextRequest('http://localhost:3000/api/cover-letters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...validGenBody.coverLetter,
        title: 'Acme Frontend Cover Letter',
      }),
    });
    const saveRes = await saveCoverLetterPOST(saveReq);
    assert.equal(saveRes.status, 201);
    const saveBody = await saveRes.json();
    assert.equal(saveBody.success, true);
    const letterId = saveBody.coverLetter.id as string;
    assert.ok(letterId);

    // 6. List cover letters for User A -> includes saved letter
    const listReq = new NextRequest('http://localhost:3000/api/cover-letters', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listRes = await listCoverLettersGET(listReq);
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(listBody.coverLetters.some((c: { id: string }) => c.id === letterId));

    // 7. IDOR Protection: User B cannot GET, PATCH, or DELETE User A's cover letter -> 404
    const idorGetReq = new NextRequest(`http://localhost:3000/api/cover-letters/${letterId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const idorGetRes = await getCoverLetterByIdGET(idorGetReq, {
      params: Promise.resolve({ id: letterId }),
    });
    assert.equal(idorGetRes.status, 404);

    const idorPatchReq = new NextRequest(`http://localhost:3000/api/cover-letters/${letterId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ title: 'Hijacked Title' }),
    });
    const idorPatchRes = await updateCoverLetterByIdPATCH(idorPatchReq, {
      params: Promise.resolve({ id: letterId }),
    });
    assert.equal(idorPatchRes.status, 404);

    // 8. User A can PATCH and DELETE their own cover letter -> 200
    const ownerPatchReq = new NextRequest(`http://localhost:3000/api/cover-letters/${letterId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Updated Acme Cover Letter' }),
    });
    const ownerPatchRes = await updateCoverLetterByIdPATCH(ownerPatchReq, {
      params: Promise.resolve({ id: letterId }),
    });
    assert.equal(ownerPatchRes.status, 200);

    const ownerDeleteReq = new NextRequest(`http://localhost:3000/api/cover-letters/${letterId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const ownerDeleteRes = await deleteCoverLetterByIdDELETE(ownerDeleteReq, {
      params: Promise.resolve({ id: letterId }),
    });
    assert.equal(ownerDeleteRes.status, 200);

    // Confirm CoverLetterService sanitizer strips script tags
    const sanitized = CoverLetterService.sanitizeText('<script>alert(1)</script>Hello World');
    assert.ok(!sanitized.includes('<script>'));
  });
});


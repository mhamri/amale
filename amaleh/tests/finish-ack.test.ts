import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as c from '../scripts/core.ts';
import { finishGate } from '../scripts/cli.ts';
import { fixtureClaim, clearCut } from './execution-fixture.ts';

async function fixture(t: any) {
 const dir = await mkdtemp(join(tmpdir(), 'amaleh-finish-ack-'));
 t.after(() => rm(dir, { recursive: true, force: true }));
 await writeFile(join(dir, 'app.txt'), 'original');
 return dir;
}

const task = (id: string, deps: string[] = []): c.TaskInput => ({
 id, title: id, goal: 'Correct observable behavior', phase: 'checkout',
 deps, resources: [id], criteria: ['correct result'], kind: 'code' as const,
 checks: [{ id: 'test', command: process.execPath, args: ['-e', 'process.exit(0)'], role: 'guard' }],
 noProbe: 'Test fixture; the acknowledged behaviour is asserted by the test, not by an executable probe',
});

async function syntheticCoverage(store: c.Store, id: string) {
 const state = await store.load();
 return c.reviewObligations(state, c.taskOf(state, id)).map(o => ({
  id: o.id, status: 'covered' as const,
  evidence: 'Synthetic protocol fixture only; not a real model review',
 }));
}

async function deliver(store: c.Store, dir: string, id = 'a') {
 await fixtureClaim(store, id, { workspace: dir, model: 'deepseek/flash' });
 await c.result(store, id, { changed: 'app.txt' });
 await c.check(store, id, 'test');
 await c.review(store, id, {
  coverage: await syntheticCoverage(store, id),
  model: 'z-ai/glm-flash', findings: [],
  fingerprint: await c.fingerprint(dir),
  report: 'Spec and Standards inspected actual implementation',
 });
 await c.accept(store, id);
 await c.integrated(store, id, 'Inspected integrated behavior and actual diff');
}

async function addHostDecisions(store: c.Store, count: number) {
 await store.transaction(s => {
  for (let i = 0; i < count; i++) {
   s.decisions.push({
    purpose: 'requirement', id: `host-decision-${i}`,
    question: 'Synthetic host decision', criteria: { accepted: 'yes' },
    choice: 'accepted', source: 'host:manual', reason: 'Test fixture',
    state: {}, revision: s.revision,
   });
  }
 });
}

test('failed finish after health acknowledgement leaves no health-acknowledged event', async t => {
 const dir = await fixture(t);
 const store = await c.start(dir, {
  shape: clearCut, id: 'fail-ack',
  host: { kind: 'codex', model: 'gpt-6-astra' },
  intent: 'Three outcome task', criteria: ['a', 'b', 'c'],
 });
 await c.plan(store, {
  tasks: [task('a'), task('b', ['a'])],
  integrationChecks: [{ id: 'all', command: process.execPath, args: ['-e', 'process.exit(0)'] }],
 });
 await addHostDecisions(store, 5);
 await deliver(store, dir, 'a');
 await deliver(store, dir, 'b');
 const reason = 'Test override reason';
 let threw = false;
 try {
  await finishGate(store, { claims: ['claim a', 'claim b', 'claim c'], acknowledgeWarnings: reason });
 } catch (error) {
  threw = true;
 }
 assert.ok(threw, 'finishGate should throw because integration checks are incomplete');
 const s = await store.load();
 assert.equal(s.events.some(e => e.type === 'health-acknowledged'), false,
  'No health-acknowledged event should remain after a failed finish');
 assert.equal(s.events.some(e => e.type === 'finished'), false,
  'No finished event should exist after a failed finish');
});

test('successful acknowledged finish records health-acknowledged and finished in the same revision', async t => {
 const dir = await fixture(t);
 const store = await c.start(dir, {
  shape: clearCut, id: 'ok-ack',
  host: { kind: 'codex', model: 'gpt-6-astra' },
  intent: 'Three outcome task', criteria: ['a', 'b', 'c'],
 });
 await c.plan(store, {
  tasks: [task('a'), task('b', ['a'])],
  integrationChecks: [{ id: 'all', command: process.execPath, args: ['-e', 'process.exit(0)'] }],
 });
 await addHostDecisions(store, 5);
 await deliver(store, dir, 'a');
 await deliver(store, dir, 'b');
 await c.check(store, undefined, 'all');
 const reason = 'Test override for acknowledged finish';
 await finishGate(store, { claims: ['done a', 'done b', 'done c'], acknowledgeWarnings: reason });
 const s = await store.load();
 const ack = s.events.filter(e => e.type === 'health-acknowledged');
 assert.equal(ack.length, 1, 'Exactly one health-acknowledged event');
 assert.equal((ack[0].detail as any).reason, reason);
 const fin = s.events.filter(e => e.type === 'finished');
 assert.equal(fin.length, 1, 'Exactly one finished event');
 assert.equal(s.status, 'complete');
 assert.ok(s.revision > 0, 'Revision advanced');
});

test('finish without health warnings does not emit health-acknowledged', async t => {
 const dir = await fixture(t);
 const store = await c.start(dir, {
  shape: clearCut, id: 'no-warn',
  host: { kind: 'codex', model: 'gpt-6-astra' },
  intent: 'Single outcome task', criteria: ['a'],
 });
 await c.plan(store, {
  tasks: [task('a')],
  integrationChecks: [],
 });
 await store.transaction(async s => {
  const t = c.taskOf(s, 'a');
  t.status = 'accepted';
  const fp = await c.fingerprint(dir);
  t.integrated = fp;
  t.fingerprint = fp;
  t.checks.forEach(check => {
   t.receipts.push({ id: check.id, code: 0, fingerprint: fp, artifact: '' });
  });
 });
 await finishGate(store, { claims: ['done'] });
 const s = await store.load();
 assert.equal(s.events.some(e => e.type === 'health-acknowledged'), false,
  'No health-acknowledged event when there are no warnings');
 assert.equal(s.status, 'complete');
});

/**
 * Day 5: Multi-Agent Chaos Orchestration & Automated SLI Abort Gates
 * Coordinates a Red-Team Chaos Injector Agent and a Blue-Team SRE Guardian Agent.
 * Automatically aborts the experiment and rolls back fault injection when SLI guardrails breach.
 */

const fs = require('fs');
const path = require('path');

const MESH_URL = process.env.MESH_URL || 'http://localhost:4100';

async function postJson(url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function runDay5() {
  const policy = JSON.parse(fs.readFileSync(path.join(__dirname, 'abort-policy.json'), 'utf8'));
  await postJson(`${MESH_URL}/api/chaos/reset`);

  let abortTriggered = false;
  let abortedAtStep = null;

  for (const step of policy.attackSequence) {
    console.log(`[Day 5 · Chaos Agent] Injecting Step ${step.step}: ${step.name}`);
    await postJson(`${MESH_URL}/api/chaos/configure`, step.config);

    const probe = await postJson(`${MESH_URL}/api/checkout`);
    console.log(`[Day 5 · SRE Guardian] Probe -> HTTP ${probe.status} | Latency: ${probe.data.latencyMs}ms`);

    if (
      probe.status >= 500 ||
      probe.data.latencyMs > policy.sliGuardrails.maxAllowedLatencyMs
    ) {
      console.log(`🚨 [Day 5 · SRE Guardian] SLI Guardrail Breached at Step ${step.step}! Triggering emergency rollback...`);
      abortTriggered = true;
      abortedAtStep = step.step;
      await postJson(`${MESH_URL}/api/chaos/reset`);
      break;
    }
  }

  if (!abortTriggered || abortedAtStep !== 3) {
    throw new Error(`Expected automated SLI abort at Step 3, got abortTriggered=${abortTriggered}, step=${abortedAtStep}`);
  }

  // Confirm post-abort steady-state recovery
  const postRollback = await postJson(`${MESH_URL}/api/checkout`);
  if (postRollback.status !== 200 || postRollback.data.status !== 'COMMITTED') {
    throw new Error('Post-rollback steady state failed to recover');
  }

  console.log('✅ Day 5 Multi-Agent Chaos Orchestration & Emergency SLI Abort Gate verified.');
}

runDay5().catch((err) => {
  console.error('❌ Day 5 Failed:', err.message);
  process.exit(1);
});

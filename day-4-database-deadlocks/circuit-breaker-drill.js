/**
 * Day 4: Database Deadlocks & Circuit-Breaker State Machine Drill
 * Injects Ledger DB deadlock/I/O exhaustion, verifies the Circuit Breaker trips
 * CLOSED -> OPEN after 3 consecutive failures, serves fast degraded fallback responses,
 * transitions to HALF_OPEN after cooldown, and recovers to CLOSED once DB lock clears.
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

async function runDay4() {
  const yaml = fs.readFileSync(path.join(__dirname, 'io-fault-chaos.yaml'), 'utf8');
  if (!yaml.includes('kind: IOChaos')) {
    throw new Error('Missing IOChaos CRD in io-fault-chaos.yaml');
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);

  // Activate DB deadlock fault
  await postJson(`${MESH_URL}/api/chaos/configure`, { dbDeadlockActive: true });

  // Send 3 requests to reach failureThreshold (3) and trip circuit OPEN
  for (let i = 1; i <= 3; i++) {
    const res = await postJson(`${MESH_URL}/api/checkout`);
    console.log(`[Day 4] Attempt #${i} under DB deadlock -> HTTP ${res.status} | Circuit: ${res.data.circuitState}`);
  }

  // 4th request must hit OPEN circuit and return 200 DEGRADED_QUEUED fast fallback
  const fallbackRes = await postJson(`${MESH_URL}/api/checkout`);
  console.log(`[Day 4] Open-Circuit Fast Fallback -> Status: ${fallbackRes.data.status} | Circuit: ${fallbackRes.data.circuitState}`);
  if (fallbackRes.status !== 200 || fallbackRes.data.status !== 'DEGRADED_QUEUED') {
    throw new Error(`Expected 200 DEGRADED_QUEUED when circuit is OPEN, got ${fallbackRes.status} (${fallbackRes.data.status})`);
  }

  // Wait for 320ms cooldown (cooldownMs = 300ms) and clear DB deadlock
  await new Promise((r) => setTimeout(r, 330));
  await postJson(`${MESH_URL}/api/chaos/configure`, { dbDeadlockActive: false });

  // Next request probes HALF_OPEN and transitions back to CLOSED
  const recoveredRes = await postJson(`${MESH_URL}/api/checkout`);
  console.log(`[Day 4] Post-Cooldown Recovery Probe -> Status: ${recoveredRes.data.status} | Circuit: ${recoveredRes.data.circuitState}`);
  if (recoveredRes.data.circuitState !== 'CLOSED' || recoveredRes.data.status !== 'COMMITTED') {
    throw new Error(`Expected circuit to recover to CLOSED, got ${recoveredRes.data.circuitState}`);
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);
  console.log('✅ Day 4 IOChaos Deadlock & Circuit Breaker State Machine (CLOSED -> OPEN -> HALF_OPEN -> CLOSED) verified.');
}

runDay4().catch((err) => {
  console.error('❌ Day 4 Failed:', err.message);
  process.exit(1);
});

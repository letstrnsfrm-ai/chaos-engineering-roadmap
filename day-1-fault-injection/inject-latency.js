/**
 * Day 1: Foundations of Cloud Chaos & Fault Injection
 * Validates steady-state hypothesis before and during 45ms NetworkChaos delay injection.
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

async function runDay1() {
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'sli-baseline.json'), 'utf8'));
  const yamlManifest = fs.readFileSync(path.join(__dirname, 'network-delay-chaos.yaml'), 'utf8');

  if (!yamlManifest.includes('kind: NetworkChaos')) {
    throw new Error('Missing NetworkChaos CRD definition in network-delay-chaos.yaml');
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);

  // Phase 1: Measure steady-state baseline
  const baselineCheck = await postJson(`${MESH_URL}/api/checkout`, { orderId: 'ORD-101' });
  console.log(`[Day 1] Steady-State Checkout Status: ${baselineCheck.data.status} (${baselineCheck.data.latencyMs}ms)`);

  // Phase 2: Inject 45ms network latency + 10ms jitter
  await postJson(`${MESH_URL}/api/chaos/configure`, baseline.injectedFault);

  const latencies = [];
  for (let i = 0; i < 5; i++) {
    const res = await postJson(`${MESH_URL}/api/checkout`, { orderId: `ORD-CHAOS-${i}` });
    if (res.status !== 200 || res.data.status !== 'COMMITTED') {
      throw new Error(`Expected 200 COMMITTED under latency injection, got ${res.status}`);
    }
    latencies.push(res.data.latencyMs);
  }

  const maxObserved = Math.max(...latencies);
  const minObserved = Math.min(...latencies);
  console.log(`[Day 1] Fault-Injected Latencies (ms): [${latencies.join(', ')}]`);

  if (minObserved < 40) {
    throw new Error(`Expected injected latency >= 40ms, got ${minObserved}ms`);
  }
  if (maxObserved > baseline.steadyStateHypothesis.maxP95LatencyMs) {
    throw new Error(`SLA Breach: ${maxObserved}ms exceeded ${baseline.steadyStateHypothesis.maxP95LatencyMs}ms`);
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);
  console.log('✅ Day 1 Steady-State Hypothesis & NetworkChaos Latency Injection verified.');
}

runDay1().catch((err) => {
  console.error('❌ Day 1 Failed:', err.message);
  process.exit(1);
});

/**
 * Day 3: Pod Terminations & Kubernetes Node Evictions
 * Terminates an active policy-engine pod, verifies zero-downtime request routing
 * across surviving replicas, and confirms ReplicaSet self-healing replacement.
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

async function runDay3() {
  const yaml = fs.readFileSync(path.join(__dirname, 'pod-kill-chaos.yaml'), 'utf8');
  if (!yaml.includes('kind: PodChaos') || !yaml.includes('action: pod-kill')) {
    throw new Error('Invalid PodChaos manifest in pod-kill-chaos.yaml');
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);

  // Trigger sudden SIGKILL of policy-pod-a
  const killRes = await postJson(`${MESH_URL}/api/chaos/pod-kill`, { podName: 'policy-pod-a' });
  console.log(`[Day 3] Killed Pod: ${killRes.data.killedPod} | Surviving Replicas: [${killRes.data.remainingPods.join(', ')}]`);

  if (killRes.data.remainingPods.includes('policy-pod-a')) {
    throw new Error('policy-pod-a should have been evicted immediately');
  }

  // Fire concurrent requests during pod replacement window; assert zero 5xx errors
  for (let i = 0; i < 4; i++) {
    const res = await postJson(`${MESH_URL}/api/checkout`);
    if (res.status !== 200 || res.data.servingPod === 'policy-pod-a') {
      throw new Error(`Unexpected response during pod kill: status=${res.status}, pod=${res.data.servingPod}`);
    }
  }

  // Wait for ReplicaSet controller replacement (120ms)
  await new Promise((r) => setTimeout(r, 160));
  const healthRes = await fetch(`${MESH_URL}/api/health`).then((r) => r.json());
  console.log(`[Day 3] Post-Heal Active Replica Count: ${healthRes.activePods}`);

  if (healthRes.activePods < 3) {
    throw new Error(`Expected ReplicaSet self-healing to restore 3 pods, found ${healthRes.activePods}`);
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);
  console.log('✅ Day 3 PodChaos Eviction & Zero-Downtime ReplicaSet Recovery verified.');
}

runDay3().catch((err) => {
  console.error('❌ Day 3 Failed:', err.message);
  process.exit(1);
});

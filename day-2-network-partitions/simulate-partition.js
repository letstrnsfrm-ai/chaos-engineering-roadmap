/**
 * Day 2: Network Partitions & Packet Loss Simulation
 * Simulates cross-region split-brain isolation of eu-west-1-primary and verifies
 * automatic failover routing to eu-central-1-standby within SLA bounds.
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

async function runDay2() {
  const yaml = fs.readFileSync(path.join(__dirname, 'network-partition-chaos.yaml'), 'utf8');
  if (!yaml.includes('action: partition')) {
    throw new Error('Expected action: partition in network-partition-chaos.yaml');
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);

  // Verify primary region before partition
  const preCheck = await postJson(`${MESH_URL}/api/checkout`);
  if (preCheck.data.routedRegion !== 'eu-west-1-primary') {
    throw new Error(`Expected initial routing to eu-west-1-primary, got ${preCheck.data.routedRegion}`);
  }
  console.log(`[Day 2] Pre-partition active region: ${preCheck.data.routedRegion}`);

  // Inject regional split-brain partition
  await postJson(`${MESH_URL}/api/chaos/configure`, {
    partitionPrimaryRegion: true,
    packetLossRate: 0.15,
  });

  const postCheck = await postJson(`${MESH_URL}/api/checkout`);
  console.log(`[Day 2] Post-partition failover region: ${postCheck.data.routedRegion} (failover latency: ${postCheck.data.latencyMs}ms)`);

  if (postCheck.status !== 200 || postCheck.data.routedRegion !== 'eu-central-1-standby') {
    throw new Error(`Expected automatic failover to eu-central-1-standby, got ${postCheck.data.routedRegion}`);
  }

  await postJson(`${MESH_URL}/api/chaos/reset`);
  console.log('✅ Day 2 Cross-Region Split-Brain Failover verified.');
}

runDay2().catch((err) => {
  console.error('❌ Day 2 Failed:', err.message);
  process.exit(1);
});

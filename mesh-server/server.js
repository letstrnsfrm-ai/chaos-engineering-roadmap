/**
 * Resilient Payment & Policy Checkout 3-Tier Microservice Mesh
 * Tiers:
 *   1. api-gateway
 *   2. policy-engine (eu-west-1 primary, eu-central-1 standby replica)
 *   3. ledger-db (with Circuit Breaker: CLOSED -> OPEN -> HALF_OPEN)
 */

const http = require('http');

const PORT = Number(process.env.CHAOS_MESH_PORT || 4100);

const meshState = {
  latencyMs: 0,
  jitterMs: 0,
  partitionPrimaryRegion: false,
  packetLossRate: 0,
  activePods: ['policy-pod-a', 'policy-pod-b', 'policy-pod-c'],
  dbDeadlockActive: false,
  circuitBreaker: {
    state: 'CLOSED', // CLOSED | OPEN | HALF_OPEN
    consecutiveFailures: 0,
    failureThreshold: 3,
    openedAt: null,
    cooldownMs: 300,
    fallbackResponses: 0,
  },
  telemetryEvents: [],
};

function recordEvent(type, details) {
  meshState.telemetryEvents.push({
    timestamp: new Date().toISOString(),
    type,
    ...details,
  });
}

function resetMeshState() {
  meshState.latencyMs = 0;
  meshState.jitterMs = 0;
  meshState.partitionPrimaryRegion = false;
  meshState.packetLossRate = 0;
  meshState.activePods = ['policy-pod-a', 'policy-pod-b', 'policy-pod-c'];
  meshState.dbDeadlockActive = false;
  meshState.circuitBreaker = {
    state: 'CLOSED',
    consecutiveFailures: 0,
    failureThreshold: 3,
    openedAt: null,
    cooldownMs: 300,
    fallbackResponses: 0,
  };
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({
      status: 'healthy',
      activePods: meshState.activePods.length,
      circuitBreaker: meshState.circuitBreaker.state,
      primaryRegionHealthy: !meshState.partitionPrimaryRegion,
    }));
  }

  if (req.method === 'POST' && req.url === '/api/chaos/reset') {
    resetMeshState();
    res.writeHead(200);
    return res.end(JSON.stringify({ reset: true, state: meshState }));
  }

  if (req.method === 'POST' && req.url === '/api/chaos/configure') {
    const config = await parseJsonBody(req);
    if (typeof config.latencyMs === 'number') meshState.latencyMs = config.latencyMs;
    if (typeof config.jitterMs === 'number') meshState.jitterMs = config.jitterMs;
    if (typeof config.partitionPrimaryRegion === 'boolean') {
      meshState.partitionPrimaryRegion = config.partitionPrimaryRegion;
    }
    if (typeof config.packetLossRate === 'number') meshState.packetLossRate = config.packetLossRate;
    if (typeof config.dbDeadlockActive === 'boolean') {
      meshState.dbDeadlockActive = config.dbDeadlockActive;
    }
    recordEvent('CHAOS_CONFIG_UPDATED', { config });
    res.writeHead(200);
    return res.end(JSON.stringify({ updated: true, state: meshState }));
  }

  if (req.method === 'POST' && req.url === '/api/chaos/pod-kill') {
    const body = await parseJsonBody(req);
    const killedPod = body.podName || meshState.activePods[0];
    meshState.activePods = meshState.activePods.filter((p) => p !== killedPod);
    recordEvent('POD_TERMINATED', { killedPod, remainingPods: meshState.activePods.length });

    // Auto-heal replacement pod after 120ms (simulating Kubernetes ReplicaSet controller)
    const replacementPod = `${killedPod}-healed`;
    setTimeout(() => {
      if (!meshState.activePods.includes(replacementPod)) {
        meshState.activePods.push(replacementPod);
        recordEvent('POD_REPLACED', { replacementPod, activePods: meshState.activePods.length });
      }
    }, 120);

    res.writeHead(200);
    return res.end(JSON.stringify({
      killedPod,
      remainingPods: meshState.activePods,
      autoHealScheduledMs: 120,
    }));
  }

  if (req.method === 'GET' && req.url === '/api/telemetry') {
    res.writeHead(200);
    return res.end(JSON.stringify({
      state: meshState,
      events: meshState.telemetryEvents,
    }));
  }

  if (req.method === 'POST' && req.url === '/api/checkout') {
    const startMs = Date.now();

    // 1. Injected network delay
    const delay = meshState.latencyMs + (meshState.jitterMs ? Math.floor(Math.random() * meshState.jitterMs) : 0);
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }

    // 2. Region selection & split-brain failover
    const routedRegion = meshState.partitionPrimaryRegion ? 'eu-central-1-standby' : 'eu-west-1-primary';
    const failoverOverheadMs = meshState.partitionPrimaryRegion ? 35 : 0;
    if (failoverOverheadMs > 0) {
      await new Promise((r) => setTimeout(r, failoverOverheadMs));
    }

    // 3. Check Pod availability
    if (meshState.activePods.length === 0) {
      res.writeHead(503);
      return res.end(JSON.stringify({ error: 'NO_ACTIVE_POLICY_PODS', routedRegion }));
    }
    const servingPod = meshState.activePods[Math.floor(Math.random() * meshState.activePods.length)];

    // 4. Circuit Breaker + Ledger DB Deadlock check
    const cb = meshState.circuitBreaker;
    if (cb.state === 'OPEN') {
      if (Date.now() - cb.openedAt >= cb.cooldownMs) {
        cb.state = 'HALF_OPEN';
        recordEvent('CIRCUIT_HALF_OPEN', { cooldownMs: cb.cooldownMs });
      } else {
        cb.fallbackResponses += 1;
        res.writeHead(200);
        return res.end(JSON.stringify({
          status: 'DEGRADED_QUEUED',
          circuitState: cb.state,
          routedRegion,
          servingPod,
          fallbackUsed: true,
          latencyMs: Date.now() - startMs,
        }));
      }
    }

    if (meshState.dbDeadlockActive) {
      cb.consecutiveFailures += 1;
      if (cb.consecutiveFailures >= cb.failureThreshold || cb.state === 'HALF_OPEN') {
        cb.state = 'OPEN';
        cb.openedAt = Date.now();
        recordEvent('CIRCUIT_TRIPPED_OPEN', { consecutiveFailures: cb.consecutiveFailures });
      }
      res.writeHead(504);
      return res.end(JSON.stringify({
        status: 'DB_DEADLOCK_TIMEOUT',
        circuitState: cb.state,
        consecutiveFailures: cb.consecutiveFailures,
        routedRegion,
        servingPod,
        latencyMs: Date.now() - startMs,
      }));
    }

    // Healthy DB write recovers HALF_OPEN -> CLOSED
    if (cb.state === 'HALF_OPEN' || cb.consecutiveFailures > 0) {
      cb.state = 'CLOSED';
      cb.consecutiveFailures = 0;
      cb.openedAt = null;
      recordEvent('CIRCUIT_CLOSED_RECOVERED', {});
    }

    res.writeHead(200);
    return res.end(JSON.stringify({
      status: 'COMMITTED',
      circuitState: cb.state,
      routedRegion,
      servingPod,
      fallbackUsed: false,
      latencyMs: Date.now() - startMs,
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🔥 Resilient Payment & Policy Checkout Mesh listening on http://localhost:${PORT}`);
  });
}

module.exports = { server, meshState, resetMeshState };

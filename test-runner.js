/**
 * Master Test Runner & Empirical Lab Verifier for chaos-engineering-roadmap (Days 1–7).
 * Automatically manages the 3-tier Resilient Payment & Policy Checkout Mesh lifecycle,
 * executes all 7 daily chaos engineering & autonomous resiliency labs, and asserts 100% pass rate.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const REPO_ROOT = __dirname;
const MESH_PORT = Number(process.env.CHAOS_MESH_PORT || 4100);
const HEALTH_URL = `http://localhost:${MESH_PORT}/api/health`;

function waitForMesh(timeoutMs = 8000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(HEALTH_URL, (res) => {
        if (res.statusCode === 200) {
          return resolve();
        }
        retry();
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        return reject(new Error(`Timed out waiting for mesh server at ${HEALTH_URL}`));
      }
      setTimeout(check, 150);
    };

    check();
  });
}

async function runChaosMasterSuite() {
  console.log('================================================================================');
  console.log('🔥 STARTING EMPIRICAL AUDIT: AI Chaos Engineering & Autonomous Resiliency (Days 1–7)');
  console.log('================================================================================\n');

  let meshProcess = null;

  try {
    try {
      await waitForMesh(800);
      console.log(`ℹ️ Resilient Checkout Mesh already active on port ${MESH_PORT}`);
    } catch {
      console.log(`🚀 Spawning 3-Tier Resilient Checkout Mesh on port ${MESH_PORT}...`);
      meshProcess = spawn('node', [path.join(REPO_ROOT, 'mesh-server', 'server.js')], {
        stdio: 'inherit',
        env: { ...process.env, CHAOS_MESH_PORT: String(MESH_PORT) },
      });
      await waitForMesh(8000);
      console.log('✅ Resilient Checkout Mesh healthy and ready for fault injection.\n');
    }

    const labs = [
      {
        day: 1,
        name: 'Foundations of Cloud Chaos & Fault Injection',
        cwd: path.join(REPO_ROOT, 'day-1-fault-injection'),
        cmd: 'node inject-latency.js',
      },
      {
        day: 2,
        name: 'Network Partitions & Packet Loss Simulation',
        cwd: path.join(REPO_ROOT, 'day-2-network-partitions'),
        cmd: 'node simulate-partition.js',
      },
      {
        day: 3,
        name: 'Pod Terminations & Kubernetes Node Evictions',
        cwd: path.join(REPO_ROOT, 'day-3-pod-terminations'),
        cmd: 'node pod-kill-drill.js',
      },
      {
        day: 4,
        name: 'Database Deadlocks & Circuit-Breaker Verification',
        cwd: path.join(REPO_ROOT, 'day-4-database-deadlocks'),
        cmd: 'node circuit-breaker-drill.js',
      },
      {
        day: 5,
        name: 'Multi-Agent Chaos Orchestration & SLI Abort Gates',
        cwd: path.join(REPO_ROOT, 'day-5-multi-agent-chaos'),
        cmd: 'node chaos-orchestrator-agent.js',
      },
      {
        day: 6,
        name: 'Automated Post-Mortem & Blast Radius Audits',
        cwd: path.join(REPO_ROOT, 'day-6-automated-postmortem'),
        cmd: 'node postmortem-auditor.js',
      },
      {
        day: 7,
        name: 'Continuous Chaos CI/CD Verification Gates',
        cwd: path.join(REPO_ROOT, 'day-7-cicd-chaos-gates'),
        cmd: 'node chaos-ci-gate.js --report ../day-6-automated-postmortem/postmortem-report.json --max-mttr-ms 3000 --max-error-budget-burn 0.02',
      },
    ];

    const results = [];

    for (const lab of labs) {
      console.log('--------------------------------------------------------------------------------');
      console.log(`▶️  Executing Day ${lab.day}: ${lab.name}`);
      console.log(`    Command: ${lab.cmd}`);
      console.log('--------------------------------------------------------------------------------');
      const start = Date.now();
      execSync(lab.cmd, {
        cwd: lab.cwd,
        stdio: 'inherit',
        env: { ...process.env, MESH_URL: `http://localhost:${MESH_PORT}` },
      });
      const durationMs = Date.now() - start;
      results.push({ day: lab.day, name: lab.name, status: 'PASSED', durationMs });
      console.log(`✅ Day ${lab.day} verified (${durationMs}ms)\n`);
    }

    console.log('================================================================================');
    console.log('🏆 CHAOS RESILIENCY AUDIT SUMMARY: ALL 7 DAYS PASSED (100% SUCCESS RATE)');
    console.log('================================================================================');
    for (const r of results) {
      console.log(`  [Day ${r.day}] ${r.status} (${r.durationMs}ms) - ${r.name}`);
    }
    console.log('================================================================================\n');
  } finally {
    if (meshProcess) {
      console.log('🛑 Stopping spawned Checkout Mesh server...');
      meshProcess.kill('SIGTERM');
    }
  }
}

if (require.main === module) {
  runChaosMasterSuite().catch((err) => {
    console.error('\n💥 Chaos suite failed:', err.message);
    process.exit(1);
  });
}

module.exports = { runChaosMasterSuite };

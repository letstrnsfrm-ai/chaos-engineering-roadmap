/**
 * Day 7: Continuous Chaos CI/CD Verification Gates
 * Evaluates the automated Chaos Post-Mortem report against production resiliency SLAs
 * (Max MTTR, Max Error Budget Burn, Circuit Breaker Containment, Steady-State Recovery).
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    report: '../day-6-automated-postmortem/postmortem-report.json',
    maxMttrMs: 3000,
    maxErrorBudgetBurn: 0.02,
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--report' && argv[i + 1]) args.report = argv[++i];
    if (argv[i] === '--max-mttr-ms' && argv[i + 1]) args.maxMttrMs = Number(argv[++i]);
    if (argv[i] === '--max-error-budget-burn' && argv[i + 1]) args.maxErrorBudgetBurn = Number(argv[++i]);
  }
  return args;
}

function runDay7() {
  const args = parseArgs(process.argv);
  const workflowYaml = fs.readFileSync(path.join(__dirname, 'chaos-workflow.yaml'), 'utf8');
  if (!workflowYaml.includes('kind: Workflow')) {
    throw new Error('Missing Chaos Mesh Workflow CRD in chaos-workflow.yaml');
  }

  const reportPath = path.resolve(__dirname, args.report);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  console.log(`[Day 7 · CI Gate] Auditing Report: ${report.incidentId}`);
  console.log(`  - Observed MTTR: ${report.metrics.mttrMs}ms (Max Allowed: ${args.maxMttrMs}ms)`);
  console.log(`  - Observed Error Budget Burn: ${report.metrics.errorBudgetBurnRatio} (Max Allowed: ${args.maxErrorBudgetBurn})`);
  console.log(`  - Steady State Restored: ${report.metrics.steadyStateRestored}`);
  console.log(`  - Circuit Breaker Contained Cascade: ${report.blastRadius.circuitBreakerContainedCascade}`);

  if (report.metrics.mttrMs > args.maxMttrMs) {
    throw new Error(`CI Gate Blocked: MTTR ${report.metrics.mttrMs}ms > ${args.maxMttrMs}ms`);
  }
  if (report.metrics.errorBudgetBurnRatio > args.maxErrorBudgetBurn) {
    throw new Error(`CI Gate Blocked: Error budget burn ${report.metrics.errorBudgetBurnRatio} > ${args.maxErrorBudgetBurn}`);
  }
  if (!report.metrics.steadyStateRestored || !report.blastRadius.circuitBreakerContainedCascade) {
    throw new Error('CI Gate Blocked: Resiliency containment assertions failed');
  }

  console.log('✅ Day 7 Continuous Chaos CI/CD Resiliency Gate PASSED. Release approved for production.');
}

try {
  runDay7();
} catch (err) {
  console.error('❌ Day 7 Failed:', err.message);
  process.exit(1);
}

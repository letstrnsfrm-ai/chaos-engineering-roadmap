# AI Chaos Engineering & Autonomous Resiliency — 7-Day Reference Repository

Welcome to the standalone reference repository for the **AI Chaos Engineering & Autonomous Resiliency** 7-Day Track in the QE Strategy Portal.

This repository provides a **zero-cost, self-contained 3-tier Resilient Payment & Policy Checkout Mesh** (`api-gateway` → `policy-engine` → `ledger-db`), paired with **Kubernetes Chaos Mesh CRD manifests** (`NetworkChaos`, `PodChaos`, `IOChaos`, `Workflow`) and executable Node.js fault-injection, circuit-breaker, multi-agent chaos orchestration, and CI/CD resiliency gate scripts.

---

## 📂 Repository Layout

| Directory | Day & Topic | Core Artifacts |
|-----------|-------------|----------------|
| `mesh-server/` | Target 3-Tier Microservice Mesh | `server.js` (HTTP fault-injection endpoints, regional failover, worker pool, circuit breaker state machine) |
| `day-1-fault-injection/` | Day 1: Foundations of Cloud Chaos & Fault Injection | `inject-latency.js`, `network-delay-chaos.yaml`, `sli-baseline.json` |
| `day-2-network-partitions/` | Day 2: Network Partitions & Packet Loss Simulation | `simulate-partition.js`, `network-partition-chaos.yaml` |
| `day-3-pod-terminations/` | Day 3: Pod Terminations & Kubernetes Node Evictions | `pod-kill-drill.js`, `pod-kill-chaos.yaml` |
| `day-4-database-deadlocks/` | Day 4: Database Deadlocks & Storage Exhaustion | `circuit-breaker-drill.js`, `io-fault-chaos.yaml` |
| `day-5-multi-agent-chaos/` | Day 5: Multi-Agent Chaos Orchestration | `chaos-orchestrator-agent.js`, `abort-policy.json` |
| `day-6-automated-postmortem/` | Day 6: Automated Post-Mortem & Blast Radius Audits | `postmortem-auditor.js`, `postmortem-report.json`, `INCIDENT_POSTMORTEM.md` |
| `day-7-cicd-chaos-gates/` | Day 7: Continuous Chaos CI/CD Verification Gates | `chaos-ci-gate.js`, `chaos-workflow.yaml` |

---

## 🚀 Quick Start (Zero-Dependency Execution)

Verify all 7 daily labs in under 5 seconds:

```bash
npm test
```

Or run an individual day's lab:

```bash
npm run test:day1
npm run test:day2
npm run test:day3
npm run test:day4
npm run test:day5
npm run test:day6
npm run test:day7
```

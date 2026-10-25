# 🔥 AI Chaos Engineering & Autonomous Resiliency — 7-Day Sprint

Welcome to the official reference codebase for the **AI Chaos Engineering & Autonomous Resiliency** course track on [letustransform.com](https://www.letustransform.com) ([All QE Roadmaps](https://www.letustransform.com/roadmaps) · [QE Strategy Docs](https://www.letustransform.com/docs)).

This repository provides a **zero-cost, self-contained 3-tier Resilient Payment & Policy Checkout Mesh** (`api-gateway` → `policy-engine` → `ledger-db`), paired with **Kubernetes Chaos Mesh CRD manifests** (`NetworkChaos`, `PodChaos`, `IOChaos`, `Workflow`) and executable Node.js fault-injection, circuit-breaker, multi-agent chaos orchestration, and CI/CD resiliency gate scripts.

---

## 🗺️ 7-Day Curriculum & Learning Matrix

| Day | Topic & Focus Area | Directory | Key Concepts & Artifacts | Interactive Playbook |
| :---: | :--- | :--- | :--- | :---: |
| **Day 1** | Foundations of Cloud Chaos & Fault Injection | [`day-1-fault-injection`](./day-1-fault-injection/) | Steady-State Hypothesis, `NetworkChaos` delay (45ms + 10ms jitter), SLO verification | [Day 1 Playbook](https://www.letustransform.com/episodes/chaos-day-1) |
| **Day 2** | Network Partitions & Packet Loss Simulation | [`day-2-network-partitions`](./day-2-network-partitions/) | `NetworkChaos` split-brain partition, automated cross-region failover (`eu-west-1` → `eu-central-1`) | [Day 2 Playbook](https://www.letustransform.com/episodes/chaos-day-2) |
| **Day 3** | Pod Terminations & Kubernetes Node Evictions | [`day-3-pod-terminations`](./day-3-pod-terminations/) | `PodChaos` SIGKILL (`gracePeriod: 0`), zero-downtime request routing, ReplicaSet self-healing | [Day 3 Playbook](https://www.letustransform.com/episodes/chaos-day-3) |
| **Day 4** | Database Deadlocks & Storage Exhaustion | [`day-4-database-deadlocks`](./day-4-database-deadlocks/) | `IOChaos` disk exhaustion (`errno: 28`), Circuit Breaker state machine (`CLOSED` → `OPEN` → `HALF_OPEN` → `CLOSED`) | [Day 4 Playbook](https://www.letustransform.com/episodes/chaos-day-4) |
| **Day 5** | Multi-Agent Chaos Orchestration | [`day-5-multi-agent-chaos`](./day-5-multi-agent-chaos/) | Adversarial Chaos Injector Agent + SRE Guardian Agent, automated SLI abort & rollback gate | [Day 5 Playbook](https://www.letustransform.com/episodes/chaos-day-5) |
| **Day 6** | Automated Post-Mortem & Blast Radius Audits | [`day-6-automated-postmortem`](./day-6-automated-postmortem/) | Telemetry synthesis, MTTD/MTTR calculation, `postmortem-report.json` & `INCIDENT_POSTMORTEM.md` | [Day 6 Playbook](https://www.letustransform.com/episodes/chaos-day-6) |
| **Day 7** | Continuous Chaos CI/CD Verification Gates | [`day-7-cicd-chaos-gates`](./day-7-cicd-chaos-gates/) | Chaos Mesh serial `Workflow` CRD, `chaos-ci-gate.js`, GitHub Actions resiliency gate | [Day 7 Playbook](https://www.letustransform.com/episodes/chaos-day-7) |

---

## 🚀 Quick Start (Zero-Dependency Execution)

### 1. Clone the Repository
```bash
git clone https://github.com/letstrnsfrm-ai/chaos-engineering-roadmap.git
cd chaos-engineering-roadmap
```

### 2. Verify All 7 Daily Labs (< 5 Seconds)
```bash
npm test
```

### 3. Run Individual Daily Labs
```bash
npm run test:day1
npm run test:day2
npm run test:day3
npm run test:day4
npm run test:day5
npm run test:day6
npm run test:day7
```

---

## 🔗 Explore More on Let's Transform QE Portal
- **[Hands-On QE Career Roadmaps](https://www.letustransform.com/roadmaps)**
- **[QE Strategy & Architecture Blueprints](https://www.letustransform.com/docs)**
- **[Executive Quality Engineering Hub](https://www.letustransform.com/lead-hub)**

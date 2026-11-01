# GraphFraud runtime verification — 1 November 2026

This document reports **actual executed checks**, not hypothetical CI, model performance, or the InterSystems contest submission.

## Test environment

- Owner-controlled machine: `hexagony-01`, Ubuntu Linux, user `daniel`.
- Node.js installed and invoked through nvm: **24.22.1**. `node --test test/*.test.mjs` completed **29 PASS / 0 FAIL**.
- Rootless Docker Engine: **24.0.7**, systemd user unit `docker.service` **active (running), enabled**, automatic user linger **yes**. No grant of membership in privileged `docker` group. Data root: `/mnt/nvme_fast/docker-rootless`.
- Docker Compose syntax validated: `docker compose config --quiet` **PASS**.
- Executed only the public, dependency-free Node `graphfraud-evidence` container (image `node:22-alpine`). No privileged host port published.

## Actual HTTP request inside the container

Fixture used: [demo_batch.json](demo_batch.json) (11 synthetic transactions only). Copied into the running disposable evidence container for the test. Requests made against its private loopback HTTP service:

```json
{
  "health": 200,
  "api": 200,
  "count": 3,
  "kinds": ["temporal_cycle", "fan_in_out", "split_payments"],
  "agent": null,
  "route": "HUMAN_REVIEW"
}
```

The result agrees with the three independent motifs in the fixture. The unrelated noise transfer remained unflagged. **`ai_decision:null` is deliberate proof the AI Hub agent did NOT run.**

The Node evidence container was restarted under the **persistent rootless Docker systemd service** after the initial disposable test; the container's health inspection returned `healthy true`.

## Public source and privacy

Public repository: **https://github.com/issueslinux/graphfraud-agent**. Published from private Hunter by isolating only `competitions/intersystems_2026/graphfraud/` via `git subtree split`; initial public HEAD `b0f7933bbc22572086d8ed866780f087871bca17`. No private project files or proprietary InterSystems EAP binaries were pushed; no API secrets committed. This file can be mirrored into the same public repository.

## Remaining independent gates

1. **InterSystems EAP authentication:** official AI Hub portal redirects to InterSystems SSO; this browser profile is **not signed in**, so the required `iris-community-2026.3.0AI.154.0-docker.tar.gz` was not downloaded. Portal: https://evaluation.intersystems.com/Eval/early-access/AIHub .
2. **IRIS integration:** ObjectScript classes and Dockerfile have not been compiled against actual EAP build 154. A working Node evidence container does not validate `Ens.BusinessProcess` or `%AI.Agent`.
3. **LLM provider:** no `OPENAI_API_KEY` set for the IRIS container, no real `AgentUsed=1` receipt.
4. **External competition:** public repository is available, but there is **no Open Exchange application entry or submission receipt** as of this report.

All observations refer to the owner's authorized environment on **2026-11-01**. Graph patterns are heuristic and cannot establish fraud or justify payment denial.

## Real InterSystems EAP 154 compilation and local AI model run (1 Nov 2026)

- The owner supplied the Community EAP build 154 archive inside /mnt/nvme_fast/hunter/data/iris/. The InterSystems proprietary archive, image and any derived layers were never pushed to GitHub. Rootless Docker imported the owner-provided image and the private GraphFraud Dockerfile created graphfraud-aihub:local.
- The first actual IRIS compile reported 11 ObjectScript errors from returning values with QUIT inside nested blocks. Corrected Router, ScoreOperation and Demo by using RETURN where required; the next build compiled **all eight classes** and produced GRAPHFRAUD_CLASS_COMPILE_OK.
- A real GraphFraud.Interop.Production started on IRIS build **2026.3.0AI.154.0com**; its Business Service -> Business Process -> HTTP Business Operation retrieved Node evidence on the private Docker network and identified all three expected synthetic motifs.
- Before an LLM was available, the real workflow returned STANDARD_REVIEW with AgentUsed=0 as designed.
- A private Ollama service pulled **qwen2.5:1.5b-instruct** (986 MB). IRIS %AI.Agent was configured with the OpenAI-compatible endpoint on the private Docker network. A real POST /v1/chat/completions returned HTTP 200 in Ollama logs.
- **Real AI Hub use confirmed:** the synthetic example emitted AgentUsed=1, GRAPHFRAUD_AI_HUB_USED and GRAPHFRAUD_DEMO_OK; first run returned HIGH_PRIORITY_REVIEW. A repeat run on identical evidence returned STANDARD_REVIEW, also with AgentUsed=1. Priority is model-dependent and cannot be construed as a fraud finding or calibrated score.
- The IRIS terminal script was fixed after a real repeat failure: Ens.Director.StartProduction reports an error when the correct production is already running. The new script checks GetProductionStatus and reuses the expected running production, refusing a different production or invalid state. The complete fail-closed helper bash scripts/run-demo.sh --require-ai then **returned exit code 0** on the real system.
- **32/32 native Node tests pass** with the additional local-model and ObjectScript contract checks. No paid provider key required; no bank data used.
- **NOT SUBMITTED TO OPEN EXCHANGE**: public code and working runtime are proven, but there is not yet a registered contest entry, external receipt, organizer acceptance or prize.

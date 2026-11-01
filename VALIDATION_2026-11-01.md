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

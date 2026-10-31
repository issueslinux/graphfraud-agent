# GraphFraud Agent — evidence-first temporal fraud graph triage

**Author:** Daniel Paluszek · **Contest target:** [InterSystems AI Agents in Interoperability Workflows 2026](https://openexchange.intersystems.com/contest/49) · **License:** MIT

> **Status (31 October 2026):** original deterministic engine implemented and 16/16 engine tests pass in isolated V8 execution; IRIS production/AI Hub integration source is present **but has not yet been compiled, installed, started or tested against the licensed EAP build**. There is no claim of contest eligibility, submitted app, a working AI Hub provider, fraud identification or a prize.

## What it does

A deterministic temporal graph engine consumes bounded batches of transaction **metadata**, not real banking credentials. It proposes traceable **investigation cases**, each listing its contributing transaction IDs, accounts, currency, time window and justification. Three independent motifs:

1. **Time-respecting multi-hop cycles:** 3–5 edges returning to the origin account, in nondecreasing timestamp order and within a configurable window, same currency.
2. **Fan-in → fan-out:** at least 3 distinct senders fund one hub, which sends at least 70% of that observed inflow onward within the configured window (no currency mixing).
3. **Split payments:** 3+ same-sender/same-recipient transfers individually below a configured minor-unit threshold but together at or above the threshold within a time window.

Unrelated transfers do not trigger cases in the demo dataset. **Patterns are not evidence of criminal intent.** The engine never executes transfers, freezes accounts, claims model-calibrated risk probabilities or asserts a legal verdict. Synthetic sample transactions only.

## Architecture

```text
IRIS Interoperability / Management Portal (AI Hub EAP build 154)
  GraphFraud.Inbound   (adapterless Business Service, manual demo ingress)
      | BatchRequest.PayloadJSON
      v
  GraphFraud.Router    (Ens.BusinessProcess)
      | SendRequestSync (40 s)
      v
  GraphFraud.Score     (Ens.BusinessOperation + HTTP OutboundAdapter)
      | private Docker network POST /assess
      v
  graphfraud-evidence  (Node.js 22, dependency-free temporal graph algorithm)
      | bounded structured evidence JSON, no transaction side effects
      v
  GraphFraud.Router    (%AI.Agent via GraphFraud.Agent.RiskReviewer)
      | agent chooses HIGH or STANDARD investigator-review priority
      v
  CaseReport           (evidence JSON, priority decision, AgentUsed)
```

**Critical design separation:** the deterministic engine only finds inspectable patterns. A **real IRIS AI Hub %AI.Agent** chooses the investigator's priority when cases exist. If model credentials are absent, the AI Hub call errors, or the answer is not precisely `PRIORITY=HIGH` / `PRIORITY=STANDARD`, the workflow retains **STANDARD_REVIEW** and `AgentUsed=0`. If there are no cases, it returns `MONITOR` with no LLM call. The model cannot authorize sanctions or rewrite the evidence.

## Offline verification — works without IRIS or model tokens

Requires Node.js 22+ (no npm dependencies).

```bash
cd competitions/intersystems_2026/graphfraud
node --test test/*.test.mjs
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {assessJSON} from './src/core.mjs'; console.log(assessJSON(readFileSync('demo_batch.json','utf8')))"
node src/server.mjs
# Different terminal:
curl -sS -H 'Content-Type: application/json' --data-binary @demo_batch.json http://127.0.0.1:8787/assess
```

Expected motif kinds (synthetic sample): `temporal_cycle` (C1,C2,C3), `fan_in_out` (M1–M4), `split_payments` (S1–S3). `N1` stays unflagged. The 16 engine tests were executed from the committed source in an isolated V8 harness (not Node's native runner); an additional Node HTTP endpoint test is included but has not been run here. Offline checks cover chronology, currency partitioning, duplicate identifiers, integer bounds and fallbacks. All amounts use **integer minor units** (e.g. cents), never floating-point amounts. Output includes `ai_decision:null` until IRIS processes a case.

HTTP evidence server is intended for a **private Docker Compose network**. On a local host it binds to 127.0.0.1. Do not expose its `/assess` endpoint publicly or pass PII. No request is written to disk by the server.

## InterSystems setup (unverified until real EAP build 154 is available)

1. Sign in to the [InterSystems AI Hub Early Access portal](https://evaluation.intersystems.com/Eval/early-access/AIHub). Download **IRIS AI Hub Community build 154**, not build 162:
   `iris-community-2026.3.0AI.154.0-docker.tar.gz` (x64) or `iris_arm64-community-2026.3.0AI.154.0-docker.tar.gz` for ARM64. This file is **not** in the repository and must not be redistributed.
2. Load and retag the image **on the same Docker host**:
   ```bash
   docker image load -i /path/to/iris-community-2026.3.0AI.154.0-docker.tar.gz
   docker images                    # find the image name Docker just loaded
   docker tag 'ACTUAL_LONG_LOADED_IMAGE_NAME' iris-community:2026.3.0AI.154.0
   ```
3. Supply an OpenAI model key to the IRIS container **only for the live AI-agent demo** (no provider credits are included in the contest); omit the key to exercise conservative fallback:
   ```bash
   export OPENAI_API_KEY='<key from your own secret store>'
   docker compose up -d
   docker compose ps
   ```
   Prefer a local `.env` excluded from Git for evaluation; use secret-management tooling in production. **Never commit API keys** or the EAP image.
4. Compile all ObjectScript classes in the **USER** namespace inside the IRIS container:
   ```bash
   docker compose exec iris iris session iris -U USER
   USER> Set sc=$SYSTEM.OBJ.LoadDir("/opt/graphfraud/iris","ck",.errors,1)
   USER> Write $SYSTEM.Status.GetErrorText(sc),!
   ```
   Require a success status and inspect compiler output before continuing. Run the production and demo **within the IRIS terminal**, still in `USER`:
   ```objectscript
   Set sc=##class(Ens.Director).StartProduction("GraphFraud.Interop.Production")
   Write $SYSTEM.Status.GetErrorText(sc),!
   Do ##class(GraphFraud.Interop.Demo).Run()
   ```
5. Verify live production messages (BS → BP → BO) in the Interoperability message viewer and compare output to offline JSON. `AgentUsed=1` and a valid `HIGH_PRIORITY_REVIEW` or `STANDARD_REVIEW` are required to claim the **AI Hub agent actually ran**. When no key is configured, `AgentUsed=0`, even if the evidence engine succeeded.

**Integration caution:** exact ObjectScript classes and provider APIs were written against official documentation and AI Hub template examples, but **could not be compiled without the licensed 154 image**. Expect to verify `%AI.Agent` and adapter configuration specifically on build 154; do not represent this as an end-to-end PASS before then. Some AI Hub EAP builds lack the private web server; this workflow uses the IRIS terminal and native Interoperability, not the management web UI as a prerequisite.

## Input/output contract

POST `/assess` (internal network only):

```json
{
  "transactions": [
    {"id":"t1","from":"acct-A","to":"acct-B","currency":"USD","amount_minor":125000,"timestamp":"2026-10-31T10:00:00Z"}
  ],
  "policy":{"window_hours":24,"threshold_minor":1000000,"fan_out_min_percent":70}
}
```

Requirements: ISO 8601 timestamps with timezone, unique safe transaction identifiers, positive safe integer minor-unit amounts, exactly one currency for each evidence pattern, at most 500 transactions per batch. Reject duplicate IDs and unknown ID syntax; output cases include `verified_fraud:false`. The service is stateless; full history, financial ledger reconciliation, identity resolution, beneficiary screening, AML/SAR reporting, real-time blocking and FPR/TPR calibration are **out of scope**.

The batch limit is intentional: larger production graphs need streaming window state, indexed lookups, persisted event identity, partitioned graph storage, RBAC, and robust deduplication before any real payment pipeline.

## Competition publication gates

The official event expects **a functioning IRIS Interoperability workflow using IRIS AI Hub agent**, the EAP Community **build 154**, a **public open-source GitHub/GitLab** repository, English README + running instructions, and a new Open Exchange project entry. Up to three entries per developer. [Official competition requirements](https://openexchange.intersystems.com/contest/49), [announcement/build 154 clarification](https://community.intersystems.com/post/intersystems-programming-contest-ai-agents-interoperability-workflows).

**As of 31 October 2026, only the source in Hunter is available; Hunter is private, so this is NOT yet a qualifying public Open Exchange submission.** Need: EAP image, successful native compilation/interop tracing/AI Hub model invocation, public repository, Open Exchange registration. Registration deadline: **8 November 2026, 23:59:59 EST**. The contest's voting/judging stage follows. No claim is made of participation or payout before an external submission receipt exists.

## References / licensing

InterSystems technologies referenced here are licensed separately. This repository contains only original MIT-licensed GraphFraud source and synthetic transactions, **no** InterSystems AI Hub image or proprietary SDK files. References: [AI Hub Dev Template](https://github.com/intersystems-community/ai-hub-dev-template), [IRIS Business Process API](https://docs.intersystems.com/irislatest/csp/documatic/%25CSP.Documatic.cls?CLASSNAME=Ens.BusinessProcess&LIBRARY=ENSLIB), [HTTP OutboundAdapter](https://docs.intersystems.com/irislatest/csp/documatic/%25CSP.Documatic.cls?CLASSNAME=EnsLib.HTTP.OutboundAdapter&LIBRARY=ENSLIB), [Business Service invocation](https://irisdocs.intersystems.com/irisforhealthlatest/csp/docbook/DocBook.UI.Page.cls?KEY=EGDV_adv).

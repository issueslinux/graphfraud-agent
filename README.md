# GraphFraud Agent — evidence-first temporal fraud graph triage

**Author:** Daniel Paluszek · **Contest target:** [InterSystems AI Agents in Interoperability Workflows 2026](https://openexchange.intersystems.com/contest/49) · **License:** MIT

> **Verified live on 1 November 2026:** InterSystems IRIS AI Hub Community 2026.3.0AI.154.0 compiled all 8 GraphFraud classes. A real Interoperability BS -> BP -> HTTP BO -> Node evidence -> native %AI.Agent -> local Ollama Qwen 2.5 1.5B demo returned 3 expected motifs, AgentUsed=1 and both GRAPHFRAUD_AI_HUB_USED and GRAPHFRAUD_DEMO_OK. 32/32 native Node tests PASS. Model priorities vary between runs and never prove fraud. See [live validation report](VALIDATION_2026-11-01.md). **Open Exchange entry NOT SUBMITTED.**

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

Expected motif kinds (synthetic sample): `temporal_cycle` (C1,C2,C3), `fan_in_out` (M1–M4), `split_payments` (S1–S3). `N1` stays unflagged. All 21 tests were executed in native Node.js v22.16.0 from byte-identical Git blobs, including the HTTP evidence server, a dense-graph search-budget regression and a static IRIS router contract check. This is **not** an IRIS runtime or AI Hub integration test. Offline checks cover chronology, currency partitioning, duplicate identifiers, integer bounds, fallback and search truncation. All amounts use **integer minor units** (e.g. cents), never floating-point amounts. Output includes `ai_decision:null` until IRIS processes a case.

HTTP evidence server is intended for a **private Docker Compose network**. On a local host it binds to 127.0.0.1. Do not expose its `/assess` endpoint publicly or pass PII. No request is written to disk by the server.

## Bounded search and honest incomplete status

The 500-transaction batch limit does **not** prevent combinatorial path explosion on dense directed graphs. To prevent resource exhaustion, the time-respecting cycle DFS now stops after **25,000 inspected candidate edges** or **40 total cases**, marking `analysis_truncated:true`; `search_limits` reports the actual budget use. The other two motif detectors still execute after the cycle budget is exhausted.

- When no cases were found **and analysis is complete**, the route is `MONITOR`.
- When no cases were found **but cycle search was truncated**, the route is `INCOMPLETE_REVIEW`, never `MONITOR`.
- When any cases were found (with or without truncation), the engine route is `HUMAN_REVIEW`. IRIS Router overrides any truncated batch to `INCOMPLETE_REVIEW` **before** calling AI Hub; `AgentUsed=0`. Thus a model never rationalizes an incomplete search into a safe-looking result.

A native regression test generates a **496-edge dense acyclic graph** and confirms that the search terminates under budget, marks the result incomplete and does not silently report safety. Another test confirms that a real split-payment indicator can still be detected when cycle search terminates early. There are **32/32 native Node tests passing**, plus genuine IRIS build 154 compilation and an actual AI Hub agent run.

## InterSystems setup (verified against real IRIS AI Hub EAP build 154)

1. Sign in to the [InterSystems AI Hub Early Access portal](https://evaluation.intersystems.com/Eval/early-access/AIHub). Download **IRIS AI Hub Community build 154**, not build 162:
   `iris-community-2026.3.0AI.154.0-docker.tar.gz` (x64) or `iris_arm64-community-2026.3.0AI.154.0-docker.tar.gz` for ARM64. This file is **not** in the repository and must not be redistributed.
2. Load and retag the image **on the same Docker host**:
   ```bash
   docker image load -i /path/to/iris-community-2026.3.0AI.154.0-docker.tar.gz
   docker images                    # find the image name Docker just loaded
   docker tag 'ACTUAL_LONG_LOADED_IMAGE_NAME' iris-community:2026.3.0AI.154.0
   ```
3. Choose a local Ollama model (see verified local model instructions below) or supply an OpenAI key to the IRIS container; omit both to exercise conservative fallback:
   ```bash
   export OPENAI_API_KEY='<key from your own secret store>'
   docker compose up -d --build
   docker compose ps
   ```
   Prefer a local `.env` excluded from Git for evaluation; use secret-management tooling in production. **Never commit API keys** or the EAP image. The **local-only** `Dockerfile.iris` derives from the image you loaded and compiles all ObjectScript classes in the USER namespace during image build. A failed compile **fails the Docker image build** instead of producing an apparently usable IRIS container. This code does not copy the proprietary EAP binary into GitHub or a public registry.
4. Start the IRIS Interoperability production and run its synthetic example **after** the evidence server passes its Docker health check:
   ```bash
   bash scripts/run-demo.sh --require-ai      # default: fails unless %AI.Agent was actually used
   # For deterministic flow checks without an LLM key:
   bash scripts/run-demo.sh --allow-fallback
   ```
   The helper invokes `docker compose up -d --build`, then executes `run-demo.script` inside a real IRIS USER terminal: `Ens.Director.StartProduction("GraphFraud.Interop.Production")` followed by `GraphFraud.Interop.Demo.Run()`. It requires the exact `GRAPHFRAUD_DEMO_OK` IRIS receipt after both returned statuses succeed; **by default it additionally requires `GRAPHFRAUD_AI_HUB_USED`**, emitted only when `CaseReport.AgentUsed=1`. A model-less `--allow-fallback` demo can confirm the deterministic workflow but does not meet the AI-agent requirement. It does not equate Docker startup with successful graph analysis. The script now uses Ens.Director.GetProductionStatus to reuse an already-running named GraphFraud production; a different, suspended or troubled production is rejected. When testing the Node evidence engine alone, use the separate offline commands above, which do not require Docker.
5. Verify live production messages (BS → BP → BO) in the Interoperability message viewer and compare output to offline JSON. `AgentUsed=1` and a valid `HIGH_PRIORITY_REVIEW` or `STANDARD_REVIEW` are required to claim the **AI Hub agent actually ran**. A successful `GRAPHFRAUD_DEMO_OK` proves only the production workflow; absence of `GRAPHFRAUD_AI_HUB_USED` means the model call remains unverified. The default `--require-ai` helper fails with exit status 3 in this situation, rather than falsely reporting a full contest-ready AI demo. **Native IRIS 154 compilation and an actual local-model AI Hub run have both been verified.**

**Packaging verification:** 32 native Node tests PASS on hexagony-01. Real rootless Docker, InterSystems EAP 154 class compilation, actual BS/BP/BO workflow, private Ollama Chat Completions HTTP 200 and AI AgentUsed=1 were additionally observed. No source code or archive of the proprietary InterSystems image was published.

**Integration status:** the eight classes compile on the actual EAP 154 image and the synthetic Interoperability + AI Hub demo runs. This is early-access software; the result is a research demonstrator, not a fraud verdict or a validated banking deployment.


### Verified private local-model path (no external API key)

The contestant-downloaded IRIS Community 2026.3.0AI.154.0 image must already be loaded and retagged locally. To reproduce the 1 November live demonstration, run the following inside the GraphFraud repository (no proprietary images or model weights are committed):

    docker compose --profile local-llm up -d ollama
    docker compose exec -T ollama ollama pull qwen2.5:1.5b-instruct
    export OLLAMA_BASE_URL=http://ollama:11434/v1
    export OLLAMA_MODEL=qwen2.5:1.5b-instruct
    docker compose --profile local-llm up -d --build iris
    bash scripts/run-demo.sh --require-ai

The private Ollama service is optional and exposes no port on the host. The Agent sets its IRIS %AI.Provider to the OpenAI-compatible local endpoint when OLLAMA_BASE_URL and OLLAMA_MODEL are configured; otherwise it supports an external OPENAI_API_KEY or returns the conservative no-AI review fallback. The model is a 986 MB Qwen2.5 instruction-tuned 1.5B parameter model. **AI priorities can differ on repeated runs; both HIGH and STANDARD are suggestions for human investigation, never evidence of fraud.**

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

**As of 1 November 2026, the original source is public at https://github.com/issueslinux/graphfraud-agent and live IRIS+AI Hub operation is verified.** Only an actual Open Exchange contest package entry and externally confirmed submission are still missing.

## References / licensing

InterSystems technologies referenced here are licensed separately. This repository contains only original MIT-licensed GraphFraud source and synthetic transactions, **no** InterSystems AI Hub image or proprietary SDK files. References: [AI Hub Dev Template](https://github.com/intersystems-community/ai-hub-dev-template), [IRIS Business Process API](https://docs.intersystems.com/irislatest/csp/documatic/%25CSP.Documatic.cls?CLASSNAME=Ens.BusinessProcess&LIBRARY=ENSLIB), [HTTP OutboundAdapter](https://docs.intersystems.com/irislatest/csp/documatic/%25CSP.Documatic.cls?CLASSNAME=EnsLib.HTTP.OutboundAdapter&LIBRARY=ENSLIB), [Business Service invocation](https://irisdocs.intersystems.com/irisforhealthlatest/csp/docbook/DocBook.UI.Page.cls?KEY=EGDV_adv).

**Build-context security:** `.dockerignore` allows only `Dockerfile.iris`, `iris/`, `iris-init.script` and the synthetic demo JSON into the local IRIS image build context. Credentials, EAP tarballs, Git metadata and unrelated files are excluded from that context.

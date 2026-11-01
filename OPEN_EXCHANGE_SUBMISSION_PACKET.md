# GraphFraud Agent — Open Exchange contest submission packet (1 November 2026)

**Status: READY FOR OWNER SSO / NOT SUBMITTED.** This packet is draft copy; it is not an InterSystems Open Exchange entry, application URL, contest receipt, acceptance, or prize. Do not change this status without reading the actual Open Exchange submission confirmation.

## Confirmed entry target

- Competition: [InterSystems Programming Contest: AI Agents in Interoperability Workflows](https://openexchange.intersystems.com/contest/49)
- **Submission cutoff: 8 November 2026, 23:59:59 EST** (the later voting period is *not* a submission extension).
- Public original source: https://github.com/issueslinux/graphfraud-agent
- Entrant: Daniel Paluszek, contact from `config/submitter.json` in the private Hunter repository.
- License: MIT (public repository).
- Platform: InterSystems IRIS AI Hub Community 2026.3.0AI.154.0 (owner-supplied Early Access image; **never redistribute**).
- Working local inference: Qwen2.5 1.5B Instruct via private Ollama OpenAI-compatible HTTP API.

The organizer requires a functional IRIS interoperability workflow in which an IRIS AI Hub agent makes a decision, public original source, English README with installation instructions, and either an explanatory demo or detailed description. The public README has the detailed description and reproduction commands. The contest listing must be created through the owner's authenticated Open Exchange account.

## Suggested Open Exchange listing copy (English)

**Application name:** GraphFraud Agent

**Subtitle / short description:** Evidence-first temporal transaction graph triage using InterSystems IRIS Interoperability, a native AI Hub agent, and a local Qwen model.

**Overview:**

GraphFraud Agent is an open-source InterSystems IRIS Interoperability demonstration for human review of unusual transaction-graph patterns. A deterministic JavaScript evidence service analyzes a bounded batch of synthetic transfer metadata and returns explainable cases for three independent motifs: time-respecting multi-hop cycles, fan-in followed by fan-out, and repeated split payments. Each case includes the contributing transaction IDs, account identifiers, time window, and the exact rule that generated the finding.

A real IRIS production orchestrates a Business Service → Business Process → HTTP Business Operation → evidence service. The Business Process then calls a native IRIS AI Hub `%AI.Agent` using a private, locally hosted Qwen2.5 instruction model to choose between HIGH and STANDARD *investigation priority*. The agent does not decide whether fraud occurred, change evidence, block payments, or take action against people. The workflow falls back to standard human review when the model is unavailable or its output cannot be validated.

The demo uses 11 wholly synthetic transfers, produces three inspectable cases, and returns an explicit AI Hub-use receipt. GraphFraud includes bounded graph search, conservative handling of truncated analysis, a containerized developer setup, and automated tests. This is an early-access research prototype for analysts, **not** a validated fraud detection system or deployable financial compliance product.

**Technical highlights:**

- Native IRIS Interoperability production (BS → BP → HTTP BO) and `%AI.Agent` invocation.
- A privacy-preserving local Qwen model through Ollama; no cloud API key needed.
- Explicit `AgentUsed=1` signal and fail-closed demo script.
- Explainable independent temporal graph motifs on synthetic metadata.
- Strict batch/search bounds, incomplete-analysis routing, and human-in-the-loop decision boundaries.
- Offline Node tests plus live IRIS EAP build 154 integration verification.

**Source and install instructions:** https://github.com/issueslinux/graphfraud-agent

**Detailed reproducibility / evidence:** https://github.com/issueslinux/graphfraud-agent/blob/main/VALIDATION_2026-11-01.md

**Keywords (use only if supported by the actual form):** InterSystems IRIS, IRIS AI Hub, Interoperability, Agentic AI, Qwen, Ollama, Graph Analytics, Fraud Triage.

## Fresh actual verification — owner host, 1 November 2026

On `hexagony-01` with real rootless Docker, the current `main` sources were rechecked as follows:

1. `node --test test/*.test.mjs`: **32 PASS / 0 FAIL**.
2. Local Ollama container running the already downloaded `qwen2.5:1.5b-instruct`; `OLLAMA_BASE_URL=http://ollama:11434/v1`, `OLLAMA_MODEL=qwen2.5:1.5b-instruct`.
3. `bash scripts/run-demo.sh --require-ai`: **exit 0** with `GRAPHFRAUD_PRODUCTION_ALREADY_RUNNING`, `GRAPHFRAUD_AI_HUB_USED`, `GRAPHFRAUD_DEMO_OK` and `IRIS AI Hub used: 1`.
4. Actual agent response this run: `STANDARD_REVIEW`. Earlier runs returned `HIGH_PRIORITY_REVIEW` on identical synthetic evidence; this is model variability, **not** measured accuracy.
5. Deterministic evidence: 11 transfers, `case_count=3`, `analysis_truncated=false`, motifs `temporal_cycle`, `fan_in_out`, `split_payments`; each case has `verified_fraud:false`.
6. The Docker image build reused an existing verified compilation layer (`CACHED`); **this rerun is not an independent clean compiler build**. The earlier 1 November clean compilation of 8 ObjectScript classes is documented in [VALIDATION_2026-11-01.md](VALIDATION_2026-11-01.md).

No private EAP archive, image, Docker layer, model weights, secret, banking data, or credential belongs in GitHub or in the Open Exchange listing.

## Actual submission gate — no invented receipts

A signed-in browser check on 1 November found the Open Exchange contest page displaying **five registered applications, none named GraphFraud Agent**, and the action reported: **“You must be logged in with an InterSystems SSO to complete this action.”** See [browser run](https://agent.tinyfish.ai/runs/df62c77d-002d-49eb-a32d-801fdb83bec0).

**Required owner-only action:** authenticate through InterSystems SSO on https://openexchange.intersystems.com/contest/49 (complete any MFA / registration / terms yourself), then make that session available for the application submission. After authentication: check for an existing GraphFraud listing to avoid duplicates; create/complete the real listing using this copy, select the contest's actual category and registration controls, submit, and save the organizer's canonical project URL and receipt/status. Do not mark `SUBMITTED` just because a draft or standalone Open Exchange app was created.

**No contest submission receipt or listing URL exists in the available evidence as of this update.**


## 1 November — authenticated browser form attempt (status still unverified)

- Owner signed in to the InterSystems Open Exchange browser context. [Form fill run 1](https://agent.tinyfish.ai/runs/65b78102-cf80-4a16-b33b-857b751c0f04) reported populated fields (name, MIT, author, public source, categories) and claimed a saved draft, but returned **no persisted product ID, canonical saved URL, or receipt**.
- [Form fill run 2](https://agent.tinyfish.ai/runs/35e8dbfb-6a8f-489c-b36f-2de694ac3beb) reported a completed form with `AI Agents` category, `Financial Services` industry, MIT, public GitHub, full description and contest 49 checkbox **selected**. However its own report simultaneously said `draft saved` and that an **unsaved changes** indicator was present and the `Save` button was available. It additionally claimed no earlier saved draft was found. **These statements do not establish persistence.**
- A third browser run aimed at independently verifying saved product ID, persisted state, and `Send for Approval` was **not started**: the TinyFish wallet returned `wallet_out_of_funds` (balance -USD 0.31). No second listing was intentionally requested.
- **Operational status as of this record:** authentication in the tool browser **confirmed**; form-entry attempt **confirmed by browser automation reports**; saved product/draft **UNVERIFIED**; contest submission **NOT CONFIRMED**; neither `SUBMITTED` nor `ACCEPTED` is justified. Avoid duplicate creation: check `My Applications` first for `GraphFraud Agent` and verify the application ID before any more `new/edit` actions.
- **Next gate:** restore authorized browser automation funds or complete manual check in the existing InterSystems signed-in browser. If the current form contains unsaved data, use its native Save control and verify a stable product URL; then send for approval / publish if allowed and verify the contest 49 entry. Legal terms and eligibility attestations are owner-only actions. Capture exact canonical product URL and contest receipt/status, not merely a form screenshot.

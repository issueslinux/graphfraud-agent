# GraphFraud Agent — Open Exchange contest submission packet (1 November 2026)

**Current status (1 November 2026): application actually saved on Open Exchange and SENT FOR APPROVAL; authenticated owner dashboard confirms PENDING APPROVAL.** The contest 49 checkbox is selected, but organizer contest acceptance/public listing and any prize are **NOT CONFIRMED**. Historical pre-login and pre-save blockers below are superseded by the final live portal receipt in the last section.

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


## 1 November — ACTUAL Open Exchange product saved and sent for approval

**This section supersedes the earlier unsaved-form reports above.** Using the owner's already signed-in Firefox desktop session through authorized Desktop Commander, we inspected the actual Open Exchange developer dashboard, filled and saved the new form, reopened it, and sent it for approval. **No TinyFish wallet/payment was required.**

- Authenticated **My Applications** initially displayed **0 Applications**, establishing that earlier browser automation had not persisted a draft. The plain public profile's zero count was insufficient evidence until this developer dashboard check.
- On the actual `/portal/products/new/edit` form we inspected HTML control names and discovered a critical constraint missed by earlier automation: **short description `maxlength=64`** (not 300). We populated a real 59-character text, the public GitHub/README, exact MIT LICENSE, `AI Agents`, `InterSystems IRIS`, `Financial Services`, GitHub CTA, `AI - Artificial Intelligence` tag, and checked `Submit to Contest`. The uploadable proprietary IRIS image was **not** used.
- Real Save action called `POST /mapi/packages/save` (200). The UI resolved to canonical signed-in edit URL **https://openexchange.intersystems.com/portal/products/GraphFraud-Agent/edit**, with title **Edit GraphFraud Agent**, initially status **Draft**. Refreshing My Applications produced **1 Applications** and a GraphFraud Agent tile, independently verifying persistence and no duplicates.
- The owner-authorized **Send for approval** action opened a real initial-release modal. New release version `1.0.0`, release date `2026-11-01` (HTML date input) and default `Initial Release` notes were accepted; no new legal/eligibility checkbox was accepted by automation.
- The actual action called `POST /mapi/packages/publish` (200), followed by the exact site confirmation **“Your application was sent for approval successfully!”**. The editor displayed `Sent for approval` and `Cancel approval`. Reopening the authenticated **My Applications** dashboard displayed the single GraphFraud Agent entry with badge **Pending approval**.
- The contest checkbox remained selected in the canonical saved product editor when it was reopened. This constitutes a **real Open Exchange product submission for organizer approval, intended for contest 49**, **not yet organizer acceptance or public contest listing**. No independent publicly visible contestant application card/receipt has been confirmed.
- Durable product edit link (owner login required): https://openexchange.intersystems.com/portal/products/GraphFraud-Agent/edit . Dashboard: https://openexchange.intersystems.com/portal/products . Public repository: https://github.com/issueslinux/graphfraud-agent .
- **Status ledger: `SAVED → SENT_FOR_APPROVAL → PENDING_APPROVAL` confirmed; `APPROVED/PUBLISHED`, `CONTEST_ACCEPTED`, `PAID` unverified.** Do not create a new listing. Monitor organizer response and confirm contest enrollment/visibility **before the November 8 deadline**.

The original cause was confusing a filled form or HTTP 200 with persistence; robust reconciliation needs an authenticated dashboard row, canonical saved URL, retained contest checkbox, actual send acknowledgement, and a second independent dashboard check after submission. New helpers: `scripts/openexchange_browser_console.js`, `scripts/openexchange_submission_guard.mjs` and `tests/test_openexchange_submission_guard.mjs` in the private Hunter root.

## Reusable submission automation (not Open Exchange-specific)

Hunter now provides shared `scripts/submissions/` with a provider-independent lifecycle controller, authenticated dashboard reconciliation, pluggable portal adapters, a generic configurable browser form driver and an offline receipt verifier. The Open Exchange profile is based on actually inspected selectors; the Devpost/Codegeist adapter fails closed until a genuine logged-in form, public real demo video and production-signed judge install URL are available. 33 Node tests (including legacy guard tests) passed on hexagony-01. Real browser read-only integration of the new driver returned one GraphFraud entry with `Pending approval` after submission (1 Nov). See `scripts/submissions/README.md`. Do not call submit again for GraphFraud.

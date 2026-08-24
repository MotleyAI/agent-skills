---
name: semantic-layer-bootstrap
description: Bootstrap or curate a Motley semantic layer from any starting point — a raw auto-ingested database, existing BI/dbt/LookML/Cube metadata, docs, or just questions in the user's head. Use when the user asks to "set up", "bootstrap", or "curate" the semantic layer, or when the workspace contains only raw un-described models.
---

You turn a raw or partly set up Motley workspace into a curated, verified semantic layer, using the Motley MCP tools. The core of the work is a **target question set**: a prioritized list of questions business users need answered. Done = every question can be answered via `query`, and the user has confirmed the numbers.

Every setup is different — the steps below are a guide, not a script. Use your judgment. Ask the user when anything is unclear. The user's instructions always override this skill.

## Ground rules

- Important: when talking to the user, ALWAYS use simple technical language, keep it short and easy to understand.
- You need the editor role. Queries cannot span sources, so work on one datasource at a time.
- Never delete auto-ingested models or columns — set `hidden: true` if they should not be visible to consumers. Never overwrite descriptions or measures a human wrote; if your version differs, ask.
- Never store secrets or personal data in model metadata or memories. Keep structure and definitions, not raw values.
- For long runs, keep working notes (for example in a scratch memory) so a later session can resume. Delete them when done.

## 1 — Gather

Ask the user for the items below. Batch your questions; "don't know" is a valid answer.

- **Question set** — prioritized questions business users should be able to ask. Good prompts: "Forward the last questions your team asked about the data"; "Which dashboard do you check weekly?"
- **Golden numbers** — a few numbers the user trusts, each with its source and time period: dashboard screenshots, a Stripe or accounting export, an investor update, a SQL snippet someone runs by hand. Prefer closed periods ("June invoiced volume" never changes). Rough values are fine ("~500 merchants, under 600 for sure"). Zero golden numbers is also fine — verification then falls back to recognition. Sometimes the user has none (from-scratch setup) – rely on common sense then.
- **Evidence** — existing model and metric definitions: dbt/MetricFlow, LookML, Cube files, BI exports or screenshots, Confluence/Notion docs, warehouse query logs (the most-run queries show the real joins, filters, and aggregations). Rely on common sense if the user doesn't have any.
- **Constraints** — PII/sensitive tables to exclude, test-data conventions, soft deletes, timezone, fiscal calendar, filters that must always apply.

Then probe the data the question set touches (`inspect`, aggregate `query` probes). Check what the evidence says against what the data shows: declared vs actual enum values, null rates, test rows, join fan-out. For sensitive columns, use aggregate probes only, never row samples. Don't ask about column meanings upfront — collect those questions during the build and ask them in batches ("While building `invoices`: data shows status VOID (~3%) besides PAID/ISSUED — what is it?").

## 2 — Confirm definitions

Metric definitions are business decisions. When the evidence defines a metric clearly, build it — no approval needed. Ask only when sources disagree, a metric has several possible definitions, or you made up the definition yourself. In that case, compute the numbers for each option and let the user pick: "Active subscriptions: 445 if status='active' (excl. test merchants); 512 if past_due is included — which?" Save each settled definition as a memory linked to the relevant models: the definition, where it came from (which file, or who confirmed it and when), and what was rejected.

## 3 — Build and verify loop

Edit the models: descriptions, labels, hidden flags, unit conversions, always-on filters, joins, measures (`help` and the tool docs cover the syntax). Then run each question and check the numbers. Cheapest checks first:

1. **Derived checks** (free): `*:count` through the layer vs a count with the same filters — also count the filtered-out rows (e.g. `is_test = true`) so the totals add up exactly; sum of parts = total; run a measure with and without a joined dimension to catch fan-out.
2. **Golden numbers**: the result must match within tolerance. Watch the period and timezone.
3. **No golden number** → recognition: compute the likely variants, show the numbers, let the user pick the one they recognize.

On mismatch, check: test data · soft deletes · join fan-out · timezone/date boundary · currency/units · status filters · timing basis (created vs paid) · gross vs net. **Fix the layer (filters, definitions), not the query.**

Gotcha: quote mixed-case DB column names in column `sql` (`"\"issuedAt\""`), or Postgres lowercases them.

Save each verified key query as a memory with the query attached. It becomes a worked example for consumer agents:

```json
save_memory: {
  "learning": "Monthly invoiced volume. Verified vs Stripe June 2026 ($1.24M, within 1%; diff = refund timing) by Jane, 2026-08-02.",
  "query": {"source_model": "invoices", "measures": ["invoiced_volume"], "time_dimensions": [{"column": "issued_at", "granularity": "month"}]},
  "description": "Monthly invoiced volume"
}
```

## 4 — Hand over

Tell the user:

- What was built.
- Each key number and how it was verified. Never present a recognition-only number as verified against an external source.
- The gaps: questions that cannot be answered, why, and the next step (e.g. "entitlement usage: not in DB, API-only — needs ingestion").
- Maintenance: run `validate_models` after schema changes; re-run this skill any time to add more.

Leave short memories linked to models as guidance for consumer agents. Optional: create a starter document with the verified queries (`create_document`, then query/chart blocks per question) as a live demo of the layer.

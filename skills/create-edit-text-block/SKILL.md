---
name: create-edit-text-block
description: Create or edit TextBlockTemplate for text content generation with variable substitution and optional LLM generation. Use when creating text blocks, slides with text content, or templates with data-driven text.
---

# Creating and Editing TextBlockTemplate

## Required Imports

```python
from storyline.domain.content.text_block import TextBlock, TextBlockTemplate
from storyline.domain.content.query_block import (
    NumericalQueryBlock,
    NumericalQueryTemplate,
    NumericalQueryMode,
)
from storyline.semantic.query import SemanticLayerQuery
```

## TextBlockTemplate Structure

A `TextBlock` consists of:
1. A `TextBlockTemplate` that defines how to generate the text content
2. An optional list of `queries` that provide data referenced in the template

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | str | Template identifier (must be unique) |
| `user_prompt` | str | Template string with `{variables}` and expressions |
| `call_llm` | bool | `False` = simple substitution, `True` = LLM generation |
| `allowed_outputs` | list[str] | Constrain LLM to specific outputs (only when `call_llm=True`) |
| `autoscale` | bool | Auto-scale text for Google Slides export |

**Do NOT set**: `used_context`, `content`, or `system_prompt` - these are managed by the system.

---

## Content Rules

When writing `user_prompt` templates, follow these rules:

1. **Valid CommonMark markdown** - `user_prompt` must always be valid CommonMark markdown, even if the user's original prompt was not.
2. **Descriptive phrasing** - Write prompts as natural sentences, e.g. `"The number of users joined this year is {new_users}"` rather than `"Show the number of users joined this year: {new_users}"`.
3. **Title preservation** - If the user's input starts with a title (`#` followed by a space, then text), your `user_prompt` must also start with a title.
4. **No tables in output** - NEVER include tables in markdown. Use bullet points instead. If tabular data is genuinely needed, set `call_llm=True` and instruct the LLM to convert the table into bullet points.
5. **No line breaks within bullet points** - Each bullet point must be a single line.
6. **No `%` after variables** - Do not include the `%` character after a `{variable}` in curly brackets. The percent sign is added automatically during variable resolution when needed.
7. **Escaped curly braces** - If the user's prompt contains multiple escaped curly brackets (e.g. `{{{{x}}}}`), convert them to regular pairs (e.g. `{{x}}`).
8. **"Naive" template = `call_llm=False`** - When the user requests a "naive" template, always set `call_llm=False`. With `call_llm=False`, the template is used directly after variable resolution with no LLM involvement.
9. **Every variable needs a query** - For EVERY `{variable}` in `user_prompt`, there MUST be a corresponding query block whose `name` matches that variable.
10. **Stay close to the user's wording** - Preserve the user's original prompt wording as much as possible while ensuring the above rules are met.

---

## Variable Reference Rules

When referencing variables in `user_prompt`, follow these rules:

1. **Same-slide block references — use bare names**: When referencing a block on the *same* slide, use the bare block name — `{Chart}`, `{ytd_budget}`, `{highlight}`. Do NOT prefix with the current slide name (e.g. do NOT write `{Slide_9::Chart}` from within Slide_9).
2. **Global/context variables — never prefix**: Variables like `{end_date}`, `{client_name}`, `{start_month}` are global context variables and never need a slide prefix.
3. **Cross-slide references — use prefix**: The `{SlideName::BlockName}` syntax is ONLY for referencing blocks on a *different* slide — e.g. `{Sales::Chart}`, `{Slide_2::Text_1}`.
4. **Strip prefixes from `get_master_variables` output**: `get_master_variables` returns fully-qualified names like `Slide_9::Chart`, but the `Slide_9::` prefix must be stripped when referencing from within Slide_9 itself.
5. **Always verify variables exist first**: Before writing any `user_prompt`, call `get_master_variables` to confirm the variable names that are actually available. Every `{variable}` in the prompt must correspond to a variable returned by `get_master_variables`. Do NOT guess or assume variable names — always verify first.

---

## Examples

### Simple Variable Substitution

```python
text_block = TextBlock(
    name="title_block",
    template=TextBlockTemplate(
        name="title",
        user_prompt="Report for {client_name}",
        call_llm=False,
    ),
)
```

### LLM-Generated Summary with Query Data

```python
text_block = TextBlock(
    name="summary_block",
    template=TextBlockTemplate(
        name="total_arr_summary",
        user_prompt="""Summarize sales performance based on the data below in one sentence.
{total_arr}
""",
        call_llm=True,
    ),
    queries=[
        NumericalQueryBlock(name="total_arr", ...),  # TABLE mode for LLM analysis
    ],
    autoscale=True,
)
```

### Multiple Metrics with Expressions

```python
text_block = TextBlock(
    name="metrics_summary",
    template=TextBlockTemplate(
        name="metrics_template",
        user_prompt="Revenue: ${revenue} | Users: {user_count} | Growth: {percent(growth_rate)}",
        call_llm=False,
    ),
    queries=[
        NumericalQueryBlock(name="revenue", ...),      # SINGLE_NUMBER mode
        NumericalQueryBlock(name="user_count", ...),
        NumericalQueryBlock(name="growth_rate", ...),
    ],
)
```

### Constrained LLM Output

```python
text_block = TextBlock(
    name="plan_assignment_block",
    template=TextBlockTemplate(
        name="plan_assignment",
        user_prompt="""Based on the monthly usage data below, recommend the appropriate plan.

Monthly usage: {monthly_usage}

Plan options:
- Plan 10: Up to 10 users
- Plan 20: Up to 20 users
- Plan 50: Up to 50 users
""",
        call_llm=True,
        allowed_outputs=[
            "# Plan 10\n10 users recommended",
            "# Plan 20\n20 users recommended",
            "# Plan 50\n50 users recommended",
        ],
    ),
    queries=[...],
)
```

---

## Query Mode Selection

| When | Use |
|------|-----|
| `call_llm=False` | `NumericalQueryMode.SINGLE_NUMBER` - inline values |
| `call_llm=True` | `NumericalQueryMode.TABLE` - data tables for LLM analysis |

---

## Best Practices

1. **Query naming**: Query `name` must exactly match `{variable_name}` in user_prompt
2. **LLM prompts**: Write clear, specific instructions when `call_llm=True`
3. **Use expressions**: For arithmetic and formatting like `{percent(a/b)}`
4. **Constrain outputs**: Use `allowed_outputs` for deterministic responses

---

## Related Documentation

- For expression syntax: see [_shared/content-block-fundamentals.md](../_shared/content-block-fundamentals.md)
- For NumericalQueryBlock: see [_shared/numerical-query-block.md](../_shared/numerical-query-block.md)
- For queries: see [_shared/query-fundamentals.md](../_shared/query-fundamentals.md)
- For filters: see [_shared/filter-reference.md](../_shared/filter-reference.md)

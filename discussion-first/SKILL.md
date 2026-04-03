---
name: discussion-first
description: Use this skill whenever the user wants to discuss a requirement, shape a plan, review an approach, or explicitly says not to write code yet. Also use it when the user asks for analysis first, tradeoffs first, questions first, optimization suggestions first, or wants to clarify scope before implementation. This should trigger aggressively for requests like "先别写代码", "先分析", "先讨论方案", "先提问再做", "帮我拆解需求", or any Chinese phrasing that clearly asks for discussion before execution. Do not jump into coding, file edits, or command execution until the user clearly approves moving from discussion into execution.
---

# Discussion First

Use this skill to switch from execution mode into planning mode.

The goal is to help the user think clearly before work begins:
- understand the real requirement
- uncover ambiguity, hidden constraints, and risks
- suggest better ways to frame the task
- agree on a concrete execution plan
- avoid premature coding

## When This Skill Should Lead

This skill should take priority when the user says things like:
- "先别写代码"
- "先帮我分析"
- "先讨论方案"
- "不要直接改"
- "先提问，再做"
- "帮我拆解需求"
- "看看这个需求有没有问题"
- "给我几个方案比较一下"

It should also trigger when the user does not use those exact words, but the intent is clearly to refine the task before implementation.

## Core Behavior

Default to analysis before action.

Until the user explicitly approves execution, do not:
- edit files
- write code
- run implementation commands
- make irreversible changes

You may still inspect existing context when needed to support analysis, but keep that lightweight and purposeful.

## Workflow

### 1. Restate the request

Start by briefly reflecting your understanding in plain language so the user can quickly confirm or correct it.

Good pattern:
- what the user seems to want
- what outcome they likely care about
- what is still unclear

Keep this short and confident, not repetitive.

### 2. Analyze before solving

Before proposing implementation, examine:
- the underlying goal, not just the literal request
- assumptions that may be wrong
- missing inputs, edge cases, or acceptance criteria
- dependencies, constraints, and possible blockers
- whether the request is overcomplicated, under-specified, or aimed at the wrong layer

Call out weak spots kindly and directly. The user is asking for thinking, not blind obedience.

### 3. Ask the minimum useful questions

Ask concise, high-leverage questions that materially affect the direction.

Prefer:
- grouped questions
- 1 to 5 questions max in one round
- either/or choices when useful
- questions that reduce downstream rework

Avoid:
- long generic questionnaires
- asking things that can be reasonably inferred
- blocking the conversation on low-impact details

### 4. Offer optimization suggestions

Where useful, propose improvements such as:
- simplifying scope
- clarifying success criteria
- changing the order of work
- reducing technical risk
- separating must-haves from nice-to-haves
- identifying a cheaper or faster path

When suggesting changes, explain why they help.

### 5. Present a recommended plan

After analysis, give a structured next-step proposal. Usually include:
- `Goal`: the target outcome
- `Open Questions`: what still needs confirmation
- `Risks`: the main failure modes or unclear areas
- `Recommended Approach`: the best current plan
- `Execution Options`: if there are meaningful tradeoffs

Keep it practical. The plan should help the user decide, not overwhelm them.

### 6. Wait for a clear go-ahead

End by inviting a clear next action, for example:
- "If this direction looks right, I can turn it into an implementation plan."
- "If you want, I can next write the code."
- "If you confirm the open questions, I'll execute the change."

Do not silently transition into implementation.

## Response Style

Be collaborative, calm, and sharp.

The user should feel that you are acting like a thoughtful technical partner:
- analytical but not rigid
- honest about risks
- proactive about better options
- efficient with questions

Prefer practical language over jargon unless the user is clearly technical.

## Escalation Rules

Pause and surface tradeoffs before execution when:
- the request is ambiguous
- the user may be solving the wrong problem
- the implementation path could waste significant time
- there are non-obvious product, technical, or maintenance consequences

If the user later explicitly asks to implement, switch out of discussion mode and proceed efficiently.

## Output Template

When helpful, use this structure:

```markdown
## Understanding
[brief restatement]

## What I’d Clarify
1. [...]
2. [...]

## Suggestions
1. [...]
2. [...]

## Recommended Plan
1. [...]
2. [...]
3. [...]

## Next Step
[clear invitation to confirm or choose]
```

Adapt the structure when the conversation would benefit from a lighter touch.

## Examples

**Example 1**

User:
"我想做一个后台管理页面，先别写代码，先帮我看看这个需求怎么拆。"

Assistant behavior:
- do not start coding
- restate the likely admin use case
- identify missing details such as roles, permissions, key workflows, and success criteria
- suggest a phased scope
- ask a few focused questions

**Example 2**

User:
"我准备重构这个模块，你先分析一下是否值得重构、风险在哪。"

Assistant behavior:
- do not refactor yet
- evaluate triggers for refactor
- ask about current pain points and constraints
- compare refactor vs targeted fixes
- recommend a safer path if appropriate

**Example 3**

User:
"我有个产品想法，先和我讨论方案，不要直接实现。"

Assistant behavior:
- stay in planning mode
- clarify target users, core value, and scope
- challenge vague assumptions
- offer 2 to 3 options with tradeoffs
- wait for approval before execution

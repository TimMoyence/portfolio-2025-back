<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **portfolio-2025-back** (7984 symbols, 16555 relationships, 241 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/portfolio-2025-back/context` | Codebase overview, check index freshness |
| `gitnexus://repo/portfolio-2025-back/clusters` | All functional areas |
| `gitnexus://repo/portfolio-2025-back/processes` | All execution flows |
| `gitnexus://repo/portfolio-2025-back/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |
| Work in the Automation area (323 symbols) | `.claude/skills/generated/automation/SKILL.md` |
| Work in the Infrastructure area (224 symbols) | `.claude/skills/generated/infrastructure/SKILL.md` |
| Work in the Domain area (117 symbols) | `.claude/skills/generated/domain/SKILL.md` |
| Work in the Application area (72 symbols) | `.claude/skills/generated/application/SKILL.md` |
| Work in the Interfaces area (65 symbols) | `.claude/skills/generated/interfaces/SKILL.md` |
| Work in the Dto area (49 symbols) | `.claude/skills/generated/dto/SKILL.md` |
| Work in the Services area (30 symbols) | `.claude/skills/generated/services/SKILL.md` |
| Work in the Badge-rules area (21 symbols) | `.claude/skills/generated/badge-rules/SKILL.md` |
| Work in the Section-generators area (16 symbols) | `.claude/skills/generated/section-generators/SKILL.md` |
| Work in the Mail area (14 symbols) | `.claude/skills/generated/mail/SKILL.md` |
| Work in the Telegram area (13 symbols) | `.claude/skills/generated/telegram/SKILL.md` |
| Work in the Security area (11 symbols) | `.claude/skills/generated/security/SKILL.md` |
| Work in the Filters area (11 symbols) | `.claude/skills/generated/filters/SKILL.md` |
| Work in the Mappers area (9 symbols) | `.claude/skills/generated/mappers/SKILL.md` |
| Work in the Test area (8 symbols) | `.claude/skills/generated/test/SKILL.md` |
| Work in the Factories area (7 symbols) | `.claude/skills/generated/factories/SKILL.md` |
| Work in the Value-objects area (7 symbols) | `.claude/skills/generated/value-objects/SKILL.md` |
| Work in the Errors area (6 symbols) | `.claude/skills/generated/errors/SKILL.md` |
| Work in the Validation area (5 symbols) | `.claude/skills/generated/validation/SKILL.md` |
| Work in the Runtime area (5 symbols) | `.claude/skills/generated/runtime/SKILL.md` |

<!-- gitnexus:end -->

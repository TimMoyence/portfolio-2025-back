<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **portfolio-2025-back** (5682 symbols, 16949 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "master"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource                                             | Use for                                  |
| ---------------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/portfolio-2025-back/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/portfolio-2025-back/clusters`       | All functional areas                     |
| `gitnexus://repo/portfolio-2025-back/processes`      | All execution flows                      |
| `gitnexus://repo/portfolio-2025-back/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                          | Read this skill file                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?"  | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"   | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"              | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor           | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference            | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands       | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |
| Work in the Automation area (308 symbols)     | `.claude/skills/generated/automation/SKILL.md`              |
| Work in the Domain area (276 symbols)         | `.claude/skills/generated/domain/SKILL.md`                  |
| Work in the Infrastructure area (188 symbols) | `.claude/skills/generated/infrastructure/SKILL.md`          |
| Work in the Application area (95 symbols)     | `.claude/skills/generated/application/SKILL.md`             |
| Work in the Interfaces area (74 symbols)      | `.claude/skills/generated/interfaces/SKILL.md`              |
| Work in the Services area (59 symbols)        | `.claude/skills/generated/services/SKILL.md`                |
| Work in the Dto area (48 symbols)             | `.claude/skills/generated/dto/SKILL.md`                     |
| Work in the V1 area (27 symbols)              | `.claude/skills/generated/v1/SKILL.md`                      |
| Work in the Scripts area (22 symbols)         | `.claude/skills/generated/scripts/SKILL.md`                 |
| Work in the Badge-rules area (21 symbols)     | `.claude/skills/generated/badge-rules/SKILL.md`             |
| Work in the Mail area (18 symbols)            | `.claude/skills/generated/mail/SKILL.md`                    |
| Work in the Config area (11 symbols)          | `.claude/skills/generated/config/SKILL.md`                  |
| Work in the Telegram area (10 symbols)        | `.claude/skills/generated/telegram/SKILL.md`                |
| Work in the Metrics area (10 symbols)         | `.claude/skills/generated/metrics/SKILL.md`                 |
| Work in the Filters area (9 symbols)          | `.claude/skills/generated/filters/SKILL.md`                 |
| Work in the Test area (8 symbols)             | `.claude/skills/generated/test/SKILL.md`                    |
| Work in the Cluster_6 area (7 symbols)        | `.claude/skills/generated/cluster-6/SKILL.md`               |
| Work in the Cluster_7 area (6 symbols)        | `.claude/skills/generated/cluster-7/SKILL.md`               |
| Work in the Llm area (6 symbols)              | `.claude/skills/generated/llm/SKILL.md`                     |
| Work in the Security area (6 symbols)         | `.claude/skills/generated/security/SKILL.md`                |

<!-- gitnexus:end -->

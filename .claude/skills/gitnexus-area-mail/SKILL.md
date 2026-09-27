---
name: gitnexus-area-mail
description: 'Skill for the Mail area of portfolio-2025-back. 24 symbols across 14 files.'
---

# Mail

24 symbols | 14 files | Cohesion: 72%

## When to Use

- Working with code in `src/`
- Understanding how createOptionalSmtpTransporter, useFactory, pillarLabel work
- Modifying mail-related functionality

## Key Files

| File                                                                           | Symbols                                                                           |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `src/modules/audit-requests/infrastructure/mail/audit-client-report.mailer.ts` | buildClientReportHtml, buildClientReportText, resolveBookingUrl, sendClientReport |
| `src/modules/audit-requests/infrastructure/mail/audit-expert-report.mailer.ts` | buildExpertReportHtml, buildExpertReportText, sendExpertReport                    |
| `src/common/infrastructure/mail/smtp-transporter.util.ts`                      | buildDkimOptions, createOptionalSmtpTransporter                                   |
| `src/modules/audit-requests/infrastructure/mail/mail-layout.util.ts`           | buildMailLayout, resolveUnsubscribeUrl                                            |
| `src/modules/audit-requests/infrastructure/mail/audit-notification.mailer.ts`  | buildNotificationHtml, sendAuditNotification                                      |
| `src/modules/audit-requests/infrastructure/mail/audit-notifier.facade.ts`      | sendAuditNotification, AuditNotifierFacade                                        |
| `src/modules/audit-requests/infrastructure/mail/mail-rendering.util.ts`        | slugify, trimDashes                                                               |
| `src/modules/audit-requests/infrastructure/mail/smtp-transporter.provider.ts`  | useFactory                                                                        |
| `src/common/infrastructure/mail/expediteur-smtp.ts`                            | constructor                                                                       |
| `src/modules/articles/infrastructure/article-broadcast.mailer.ts`              | constructor                                                                       |

## Entry Points

Start here when exploring this area:

- **`createOptionalSmtpTransporter`** (Function) — `src/common/infrastructure/mail/smtp-transporter.util.ts:4`
- **`useFactory`** (Function) — `src/modules/audit-requests/infrastructure/mail/smtp-transporter.provider.ts:10`
- **`pillarLabel`** (Function) — `src/modules/audit-requests/infrastructure/automation/shared/pillar-labels.util.ts:10`
- **`buildMailLayout`** (Function) — `src/modules/audit-requests/infrastructure/mail/mail-layout.util.ts:26`
- **`slugify`** (Function) — `src/modules/audit-requests/infrastructure/mail/mail-rendering.util.ts:15`

## Key Symbols

| Symbol                          | Type      | File                                                                                | Line |
| ------------------------------- | --------- | ----------------------------------------------------------------------------------- | ---- |
| `AuditNotifierFacade`           | Class     | `src/modules/audit-requests/infrastructure/mail/audit-notifier.facade.ts`           | 12   |
| `createOptionalSmtpTransporter` | Function  | `src/common/infrastructure/mail/smtp-transporter.util.ts`                           | 4    |
| `useFactory`                    | Function  | `src/modules/audit-requests/infrastructure/mail/smtp-transporter.provider.ts`       | 10   |
| `pillarLabel`                   | Function  | `src/modules/audit-requests/infrastructure/automation/shared/pillar-labels.util.ts` | 10   |
| `buildMailLayout`               | Function  | `src/modules/audit-requests/infrastructure/mail/mail-layout.util.ts`                | 26   |
| `slugify`                       | Function  | `src/modules/audit-requests/infrastructure/mail/mail-rendering.util.ts`             | 15   |
| `trimDashes`                    | Function  | `src/modules/audit-requests/infrastructure/mail/mail-rendering.util.ts`             | 7    |
| `IAuditNotifierPort`            | Interface | `src/modules/audit-requests/domain/IAuditNotifier.port.ts`                          | 24   |
| `constructor`                   | Method    | `src/common/infrastructure/mail/expediteur-smtp.ts`                                 | 10   |
| `constructor`                   | Method    | `src/modules/articles/infrastructure/article-broadcast.mailer.ts`                   | 114  |
| `constructor`                   | Method    | `src/modules/contacts/infrastructure/ContactMailer.service.ts`                      | 18   |
| `constructor`                   | Method    | `src/modules/newsletter/infrastructure/NewsletterMailer.service.ts`                 | 35   |
| `buildClientReportHtml`         | Method    | `src/modules/audit-requests/infrastructure/mail/audit-client-report.mailer.ts`      | 53   |
| `buildClientReportText`         | Method    | `src/modules/audit-requests/infrastructure/mail/audit-client-report.mailer.ts`      | 157  |
| `resolveBookingUrl`             | Method    | `src/modules/audit-requests/infrastructure/mail/audit-client-report.mailer.ts`      | 149  |
| `sendClientReport`              | Method    | `src/modules/audit-requests/infrastructure/mail/audit-client-report.mailer.ts`      | 22   |
| `buildNotificationHtml`         | Method    | `src/modules/audit-requests/infrastructure/mail/audit-notification.mailer.ts`       | 41   |
| `sendAuditNotification`         | Method    | `src/modules/audit-requests/infrastructure/mail/audit-notification.mailer.ts`       | 16   |
| `sendAuditNotification`         | Method    | `src/modules/audit-requests/infrastructure/mail/audit-notifier.facade.ts`           | 19   |
| `buildExpertReportHtml`         | Method    | `src/modules/audit-requests/infrastructure/mail/audit-expert-report.mailer.ts`      | 42   |

## Execution Flows

| Flow                                       | Type            | Steps |
| ------------------------------------------ | --------------- | ----- |
| `DispatchEmails → TrimDashes`              | cross_community | 5     |
| `DispatchEmails → PillarLabel`             | cross_community | 5     |
| `DispatchEmails → ResolveBookingUrl`       | cross_community | 5     |
| `SendExpertReport → AbsoluteScheme`        | cross_community | 5     |
| `DispatchEmails → SafeHtml`                | cross_community | 5     |
| `DispatchEmails → EscapeHtml`              | cross_community | 5     |
| `SendExpertReport → EscapeHtml`            | cross_community | 5     |
| `SendExpertReport → ResolveUnsubscribeUrl` | cross_community | 4     |
| `SendExpertReport → SafeHtml`              | cross_community | 4     |
| `Constructor → ServeurHttpDe`              | cross_community | 4     |

## How to Explore

1. `context({name: "createOptionalSmtpTransporter"})` — see callers and callees
2. `query({search_query: "mail"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`

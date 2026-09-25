import { Injectable, Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import {
  escapeHtml,
  escapeUrl,
  safeHtml,
  type EscapedHtml,
} from '../../../common/infrastructure/mail/html-escape.util';
import { createOptionalSmtpTransporter } from '../../../common/infrastructure/mail/smtp-transporter.util';
import type {
  ArticleBroadcastMailer,
  BroadcastRecipient,
} from '../application/article-broadcast.repository';
import { articlePageUrl, publicApiUrl } from '../application/article-settings';
import type { ArticleRecord } from '../application/articles.repository';

const ITEMS_PER_SECTION = 3;
const MAX_ITEM_TEXT = 280;
const LIST_ID = 'Veille IA <veille-ia.asilidesign.fr>';

interface EmailItem {
  entity: string;
  text: string;
  source: string;
  url: string;
}

interface EmailSection {
  title: string;
  items: EmailItem[];
}

const COPY = {
  fr: {
    greeting: 'Bonjour',
    read: 'Lire l’édition complète',
    source: 'Source',
    footer:
      'Vous recevez cet email car vous êtes inscrit à la veille IA d’asilidesign.fr.',
    unsubscribe: 'Se désabonner',
  },
  en: {
    greeting: 'Hello',
    read: 'Read the full edition',
    source: 'Source',
    footer:
      'You receive this email because you subscribed to the asilidesign.fr AI briefing.',
    unsubscribe: 'Unsubscribe',
  },
} as const;

interface ContenuDuMessage {
  greeting: string;
  article: ArticleRecord;
  sections: EmailSection[];
  articleUrl: string;
  unsubscribeUrl: string;
  copy: (typeof COPY)[keyof typeof COPY];
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function truncate(value: string, max: number): string {
  const chars = Array.from(value);
  return chars.length <= max ? value : `${chars.slice(0, max - 1).join('')}…`;
}

function emailSections(raw: unknown[]): EmailSection[] {
  return raw.flatMap((section): EmailSection[] => {
    if (!section || typeof section !== 'object') return [];
    const record = section as Record<string, unknown>;
    const title = text(record.title);
    if (!title) return [];
    const items = Array.isArray(record.items) ? record.items : [];
    return [
      {
        title,
        items: items
          .flatMap((item): EmailItem[] => {
            if (!item || typeof item !== 'object') return [];
            const fields = item as Record<string, unknown>;
            const itemText = text(fields.text);
            const url = text(fields.url);
            if (!itemText || !url) return [];
            return [
              {
                entity: text(fields.entity) ?? '',
                text: truncate(itemText, MAX_ITEM_TEXT),
                source: text(fields.source) ?? '',
                url,
              },
            ];
          })
          .slice(0, ITEMS_PER_SECTION),
      },
    ];
  });
}

function bareAddress(value: string): string {
  const open = value.indexOf('<');
  const close = value.indexOf('>', open + 1);
  return open < 0 || close < 0
    ? value.trim()
    : value.slice(open + 1, close).trim();
}

@Injectable()
export class ArticleBroadcastMailerService implements ArticleBroadcastMailer {
  private readonly logger = new Logger(ArticleBroadcastMailerService.name);
  private readonly transporter: Transporter | null;

  constructor() {
    this.transporter = createOptionalSmtpTransporter(
      this.logger,
      'Article broadcast mailer',
    );
  }

  isEnabled(): boolean {
    return this.transporter !== null;
  }

  async send(
    article: ArticleRecord,
    recipient: BroadcastRecipient,
  ): Promise<void> {
    if (!this.transporter) throw new Error('SMTP transport not configured');
    const replyTo = process.env.SMTP_REPLY_TO ?? 'contact@asilidesign.fr';
    const unsubscribeUrl = `${publicApiUrl('newsletter/unsubscribe')}?token=${encodeURIComponent(recipient.unsubscribeToken)}`;
    const articleUrl = articlePageUrl(article.locale, article.slug);
    const copy = COPY[article.locale];
    const greeting = recipient.firstName
      ? `${copy.greeting} ${recipient.firstName}`
      : copy.greeting;
    const contenu: ContenuDuMessage = {
      greeting,
      article,
      sections: emailSections(article.sections),
      articleUrl,
      unsubscribeUrl,
      copy,
    };

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipient.email,
      replyTo,
      subject: article.title,
      headers: {
        'List-Unsubscribe': `<mailto:${bareAddress(replyTo)}?subject=unsubscribe>, <${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-Id': LIST_ID,
      },
      text: this.plainText(contenu),
      html: this.html(contenu),
    });
  }

  private plainText(options: ContenuDuMessage): string {
    const sections = options.sections
      .map((section) =>
        [
          section.title.toUpperCase(),
          ...section.items.map((item) => {
            const lead = item.entity ? item.entity + ' : ' : '';
            return `- ${lead}${item.text}\n  ${options.copy.source} : ${item.url}`;
          }),
        ].join('\n'),
      )
      .join('\n\n');
    return [
      `${options.greeting},`,
      options.article.excerpt,
      sections,
      `${options.copy.read} : ${options.articleUrl}`,
      '—',
      options.copy.footer,
      `${options.copy.unsubscribe} : ${options.unsubscribeUrl}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private html(options: ContenuDuMessage): EscapedHtml {
    const itemHtml = (item: EmailSection['items'][number]): EscapedHtml => {
      const lead = item.entity
        ? safeHtml`<strong>${escapeHtml(item.entity)}</strong> — `
        : safeHtml``;
      const source = escapeHtml(item.source || options.copy.source);
      return safeHtml`<p style="margin: 0 0 12px; line-height: 1.55;">${lead}${escapeHtml(item.text)} <a href="${escapeUrl(item.url)}" style="color: #4fb3a2;">${source}</a></p>`;
    };
    const sections = options.sections.map(
      (section) =>
        safeHtml`<h2 style="font-size: 17px; color: #1f2937; margin: 28px 0 8px;">${escapeHtml(section.title)}</h2>${section.items.map(itemHtml)}`,
    );
    return safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; color: #111827;"><h1 style="margin-top: 0; font-size: 22px; color: #4fb3a2;">${escapeHtml(options.article.title)}</h1><p>${escapeHtml(options.greeting)},</p><p style="line-height: 1.55;">${escapeHtml(options.article.excerpt)}</p>${sections}<p style="margin: 28px 0;"><a href="${escapeUrl(options.articleUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #4fb3a2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">${escapeHtml(options.copy.read)}</a></p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">${escapeHtml(options.copy.footer)} <a href="${escapeUrl(options.unsubscribeUrl)}" style="color: #4fb3a2;">${escapeHtml(options.copy.unsubscribe)}</a></p></div></div>`;
  }
}

export {
  escapeHtml,
  escapeUrl,
  safeHtml,
} from '../../../../common/infrastructure/mail/html-escape.util';
export type { EscapedHtml } from '../../../../common/infrastructure/mail/html-escape.util';

function trimDashes(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === '-') start += 1;
  while (end > start && value[end - 1] === '-') end -= 1;
  return value.slice(start, end);
}

export function slugify(input: string): string {
  const normalized = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
  return trimDashes(normalized).slice(0, 60) || 'audit';
}

import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { BudgetCategory } from '../../domain/BudgetCategory';
import type { BudgetEntry } from '../../domain/BudgetEntry';
import type {
  BudgetPdfPayload,
  IBudgetPdfRenderer,
} from '../../domain/IBudgetPdfRenderer';

const MOIS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

interface CategoryRow {
  categoryName: string;
  budgetType: string;
  budgetLimit: number;
  total: number;
  remaining: number;
}

/**
 * Adapter d'infrastructure pour la generation de PDF budget via pdfkit.
 *
 * Implemente {@link IBudgetPdfRenderer}. Calcule les agregations (totaux,
 * ventilation par categorie, tri chronologique) puis construit le document
 * PDF section par section (resume, par categorie, transactions).
 */
@Injectable()
export class BudgetPdfRenderer implements IBudgetPdfRenderer {
  async render(payload: BudgetPdfPayload): Promise<Buffer> {
    const { command, entries, categories, generatedAt } = payload;

    const catMap = new Map<string | undefined, BudgetCategory>(
      categories.map((c) => [c.id, c]),
    );

    const totalExpenses = entries
      .filter((e) => Number(e.amount) < 0)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
    const totalIncoming = entries
      .filter((e) => Number(e.amount) > 0)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const solde = totalIncoming - totalExpenses;

    const byCategory = this.computeByCategory(entries, catMap);
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return this.buildPdf(
      command.month,
      command.year,
      generatedAt,
      totalExpenses,
      totalIncoming,
      solde,
      byCategory,
      sortedEntries,
      catMap,
    );
  }

  private computeByCategory(
    entries: readonly BudgetEntry[],
    catMap: Map<string | undefined, BudgetCategory>,
  ): CategoryRow[] {
    const totals = new Map<string | null, number>();

    for (const entry of entries) {
      if (Number(entry.amount) >= 0) continue;
      const key = entry.categoryId ?? null;
      totals.set(key, (totals.get(key) ?? 0) + Math.abs(Number(entry.amount)));
    }

    const result: CategoryRow[] = Array.from(totals.entries()).map(
      ([catId, total]) => {
        const cat = catId ? catMap.get(catId) : undefined;
        const budgetLimit = cat ? Number(cat.budgetLimit) : 0;
        return {
          categoryName: cat?.name ?? 'Sans catégorie',
          budgetType: cat?.budgetType ?? 'VARIABLE',
          budgetLimit,
          total,
          remaining: budgetLimit - total,
        };
      },
    );

    return result.sort((a, b) => {
      if (a.budgetType === 'FIXED' && b.budgetType !== 'FIXED') return -1;
      if (a.budgetType !== 'FIXED' && b.budgetType === 'FIXED') return 1;
      return b.total - a.total;
    });
  }

  private buildPdf(
    month: number,
    year: number,
    generatedAt: Date,
    totalExpenses: number,
    totalIncoming: number,
    solde: number,
    byCategory: CategoryRow[],
    sortedEntries: BudgetEntry[],
    catMap: Map<string | undefined, BudgetCategory>,
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const moisNom = MOIS_FR[month - 1] ?? `Mois ${month}`;
      const titre = `Budget T&M — ${moisNom} ${year}`;
      const sousTitre = `Généré le ${generatedAt.toLocaleDateString('fr-FR')}`;

      doc.fontSize(20).text(titre, { align: 'center' });
      doc.fontSize(10).text(sousTitre, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text('Résumé', { underline: true });
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .text(`Total dépenses : ${totalExpenses.toFixed(2)} €`)
        .text(`Total revenus : ${totalIncoming.toFixed(2)} €`)
        .text(`Solde : ${solde.toFixed(2)} €`);
      doc.moveDown(1.5);

      doc.fontSize(14).text('Par catégorie', { underline: true });
      doc.moveDown(0.5);

      if (byCategory.length > 0) {
        this.drawCategoryTable(doc, byCategory);
      } else {
        doc.fontSize(10).text('Aucune dépense pour ce mois.');
      }
      doc.moveDown(1.5);

      doc.fontSize(14).text('Transactions', { underline: true });
      doc.moveDown(0.5);

      if (sortedEntries.length > 0) {
        this.drawTransactionTable(doc, sortedEntries, catMap);
      } else {
        doc.fontSize(10).text('Aucune transaction pour ce mois.');
      }

      doc.end();
    });
  }

  private drawCategoryTable(
    doc: PDFKit.PDFDocument,
    byCategory: CategoryRow[],
  ): void {
    const colWidths = [150, 90, 90, 90];
    const headers = ['Catégorie', 'Budget', 'Réel', 'Restant'];
    const startX = doc.x;

    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
      doc.text(h, x, doc.y, { width: colWidths[i], continued: i < 3 });
    });
    doc.text('', startX);
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    for (const row of byCategory) {
      const y = doc.y;
      doc.text(row.categoryName, startX, y, { width: colWidths[0] });
      doc.text(`${row.budgetLimit.toFixed(2)} €`, startX + colWidths[0], y, {
        width: colWidths[1],
      });
      doc.text(
        `${row.total.toFixed(2)} €`,
        startX + colWidths[0] + colWidths[1],
        y,
        { width: colWidths[2] },
      );
      doc.text(
        `${row.remaining.toFixed(2)} €`,
        startX + colWidths[0] + colWidths[1] + colWidths[2],
        y,
        { width: colWidths[3] },
      );
      doc.moveDown(0.3);
    }
  }

  private drawTransactionTable(
    doc: PDFKit.PDFDocument,
    entries: BudgetEntry[],
    catMap: Map<string | undefined, BudgetCategory>,
  ): void {
    const colWidths = [70, 140, 80, 100, 60];
    const headers = ['Date', 'Description', 'Montant', 'Catégorie', 'État'];
    const startX = doc.x;

    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
      doc.text(h, x, doc.y, { width: colWidths[i], continued: i < 4 });
    });
    doc.text('', startX);
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    for (const entry of entries) {
      const y = doc.y;
      const dateStr = new Date(entry.date).toLocaleDateString('fr-FR');
      const catName = entry.categoryId
        ? (catMap.get(entry.categoryId)?.name ?? 'N/A')
        : 'Sans catégorie';

      doc.text(dateStr, startX, y, { width: colWidths[0] });
      doc.text(entry.description, startX + colWidths[0], y, {
        width: colWidths[1],
      });
      doc.text(
        `${Number(entry.amount).toFixed(2)} €`,
        startX + colWidths[0] + colWidths[1],
        y,
        { width: colWidths[2] },
      );
      doc.text(
        catName,
        startX + colWidths[0] + colWidths[1] + colWidths[2],
        y,
        { width: colWidths[3] },
      );
      doc.text(
        entry.state,
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        y,
        { width: colWidths[4] },
      );
      doc.moveDown(0.3);
    }
  }
}

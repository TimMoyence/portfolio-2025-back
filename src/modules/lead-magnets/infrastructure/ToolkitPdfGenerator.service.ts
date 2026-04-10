import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { IToolkitPdfGenerator } from '../domain/IToolkitPdfGenerator';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';

interface ToolEntry {
  name: string;
  price: string;
  url: string;
  usage: string;
}
interface ToolCategory {
  title: string;
  tools: ToolEntry[];
}
interface BudgetLevel {
  label: string;
  tools: string[];
}

/** Genere le PDF "Boite a outils IA" (1 page A4 portrait). */
@Injectable()
export class ToolkitPdfGeneratorService implements IToolkitPdfGenerator {
  private readonly teal = '#4fb3a2';
  private readonly darkText = '#0c0902';
  private readonly mutedText = '#54524d';

  private readonly categories: ToolCategory[] = [
    {
      title: 'CREER DU CONTENU',
      tools: [
        {
          name: 'ChatGPT',
          price: 'Gratuit',
          url: 'chat.openai.com',
          usage: 'Texte, strategie',
        },
        {
          name: 'Claude',
          price: 'Gratuit',
          url: 'claude.ai',
          usage: 'Texte, analyse, code',
        },
        {
          name: 'Gemini',
          price: 'Gratuit',
          url: 'gemini.google.com',
          usage: 'Recherche, multimodal',
        },
        {
          name: 'Ideogram',
          price: 'Gratuit',
          url: 'ideogram.ai',
          usage: 'Visuels avec texte',
        },
        {
          name: 'Gamma',
          price: 'Gratuit',
          url: 'gamma.app',
          usage: 'Presentations',
        },
        {
          name: 'Descript',
          price: 'Gratuit',
          url: 'descript.com',
          usage: 'Video, montage',
        },
        {
          name: 'ElevenLabs',
          price: '5$/mois',
          url: 'elevenlabs.io',
          usage: 'Voix IA',
        },
      ],
    },
    {
      title: 'AUTOMATISER',
      tools: [
        {
          name: 'Zapier',
          price: 'Gratuit',
          url: 'zapier.com',
          usage: 'Automatisation no-code',
        },
        {
          name: 'Make',
          price: '9$/mois',
          url: 'make.com',
          usage: 'Workflows visuels',
        },
        {
          name: 'n8n',
          price: 'Gratuit',
          url: 'n8n.io',
          usage: 'Open source, auto-heberge',
        },
      ],
    },
    {
      title: 'GERER & VENDRE',
      tools: [
        {
          name: 'Notion AI',
          price: 'Gratuit',
          url: 'notion.so',
          usage: 'Productivite, wiki',
        },
        {
          name: 'Perplexity',
          price: 'Gratuit',
          url: 'perplexity.ai',
          usage: 'Recherche IA',
        },
        {
          name: 'Lovable',
          price: 'Gratuit',
          url: 'lovable.dev',
          usage: 'Site web sans coder',
        },
        {
          name: 'NotebookLM',
          price: 'Gratuit',
          url: 'notebooklm.google',
          usage: 'Synthese, podcast IA',
        },
      ],
    },
  ];

  private readonly budgets: BudgetLevel[] = [
    {
      label: '0 EUR/mois',
      tools: [
        'ChatGPT Free',
        'Claude Free',
        'Ideogram Free',
        'Gamma Free',
        'Zapier Free',
        'Notion Free',
      ],
    },
    {
      label: '50 EUR/mois',
      tools: [
        'ChatGPT Free',
        'Claude Pro (17$)',
        'Ideogram Free',
        'Gamma Pro (15$)',
        'Zapier Free',
        'Notion Plus (10$)',
      ],
    },
    {
      label: '100 EUR/mois',
      tools: [
        'ChatGPT Plus (20$)',
        'Claude Pro (17$)',
        'Ideogram Plus (20$)',
        'Gamma Pro (15$)',
        'Make Core (9$)',
        'Notion Plus (10$)',
        'Descript (16$)',
      ],
    },
  ];

  async generate(request: LeadMagnetRequest): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      info: {
        Title: 'Boite a outils IA — Solopreneurs',
        Author: 'Asili Design — asilidesign.fr',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc, request);
      this.drawCategories(doc);
      this.drawBudgets(doc);
      this.drawFooter(doc);
      doc.end();
    });
  }

  private drawHeader(
    doc: PDFKit.PDFDocument,
    request: LeadMagnetRequest,
  ): void {
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc
      .fontSize(18)
      .fillColor(this.teal)
      .text('Boite a outils IA — Solopreneurs', { align: 'center' });
    doc
      .fontSize(10)
      .fillColor(this.mutedText)
      .text(`Prepare pour ${request.firstName} — ${date}`, {
        align: 'center',
      });
    doc.moveDown(1);
    doc
      .moveTo(36, doc.y)
      .lineTo(559, doc.y)
      .strokeColor(this.teal)
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);
  }

  private drawCategories(doc: PDFKit.PDFDocument): void {
    for (const category of this.categories) {
      doc.fontSize(10).fillColor(this.teal).text(category.title);
      doc.moveDown(0.2);
      for (const tool of category.tools) {
        doc
          .fontSize(8)
          .fillColor(this.darkText)
          .text(`${tool.name}`, 50, doc.y, { continued: true, width: 90 })
          .fillColor(this.mutedText)
          .text(`${tool.price}`, { continued: true, width: 70 })
          .text(`${tool.url}`, {
            continued: true,
            width: 150,
            link: `https://${tool.url}`,
          })
          .fillColor(this.darkText)
          .text(`${tool.usage}`, { width: 160 });
      }
      doc.moveDown(0.5);
    }
  }

  private drawBudgets(doc: PDFKit.PDFDocument): void {
    doc.moveDown(0.3);
    doc
      .moveTo(36, doc.y)
      .lineTo(559, doc.y)
      .strokeColor(this.teal)
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor(this.teal)
      .text('VOTRE BUDGET', { align: 'center' });
    doc.moveDown(0.3);

    const colWidth = 170;
    const startX = 36;
    const startY = doc.y;

    for (let i = 0; i < this.budgets.length; i++) {
      const budget = this.budgets[i];
      const x = startX + i * colWidth + (i > 0 ? 10 * i : 0);
      doc
        .fontSize(9)
        .fillColor(this.teal)
        .text(budget.label, x, startY, { width: colWidth, align: 'center' });
      let y = startY + 14;
      for (const tool of budget.tools) {
        doc
          .fontSize(7)
          .fillColor(this.darkText)
          .text(tool, x, y, { width: colWidth, align: 'center' });
        y += 10;
      }
    }
    doc.y = startY + 14 + 10 * 8;
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor(this.mutedText)
      .text(
        'asilidesign.fr/formations  •  Questions ? asilidesign.fr/contact',
        {
          align: 'center',
          link: 'https://asilidesign.fr/formations',
        },
      );
  }
}

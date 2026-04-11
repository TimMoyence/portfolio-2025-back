import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { IToolkitPdfGenerator } from '../domain/IToolkitPdfGenerator';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import type {
  CheatsheetEntry,
  PromptEntry,
  ToolkitContent,
  WorkflowEntry,
  TemplateEntry,
} from '../domain/ToolkitContent';

/** Genere le PDF multi-pages "Guide IA personnalise" pour les solopreneurs. */
@Injectable()
export class ToolkitPdfGeneratorService implements IToolkitPdfGenerator {
  private readonly teal = '#4fb3a2';
  private readonly darkText = '#0c0902';
  private readonly mutedText = '#54524d';
  private readonly lightBg = '#f0faf8';
  private readonly pageMargin = 40;

  async generate(
    request: LeadMagnetRequest,
    content: ToolkitContent,
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: this.pageMargin,
      info: {
        Title: 'Guide IA personnalise — Solopreneurs',
        Author: 'Asili Design — asilidesign.fr',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawCoverPage(doc, request, content);
      this.drawCheatsheetSection(doc, content.cheatsheet);
      this.drawPromptsSection(doc, content.prompts);
      this.drawWorkflowsSection(doc, content.workflows);
      this.drawTemplatesSection(doc, content.templates);

      if (content.generatedPrompt) {
        this.drawGeneratedPromptSection(doc, content.generatedPrompt);
      }

      doc.end();
    });
  }

  /* ------------------------------------------------------------------ */
  /*  PAGE 1 : Couverture                                                */
  /* ------------------------------------------------------------------ */

  private drawCoverPage(
    doc: PDFKit.PDFDocument,
    request: LeadMagnetRequest,
    content: ToolkitContent,
  ): void {
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.moveDown(6);
    doc
      .fontSize(28)
      .fillColor(this.teal)
      .text('Guide IA personnalise', { align: 'center' });
    doc
      .fontSize(14)
      .fillColor(this.darkText)
      .text('pour les Solopreneurs', { align: 'center' });
    doc.moveDown(2);

    // Ligne separatrice
    this.drawHorizontalLine(doc);
    doc.moveDown(1.5);

    doc
      .fontSize(12)
      .fillColor(this.darkText)
      .text(`Prepare pour ${request.firstName}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(this.mutedText).text(date, { align: 'center' });
    doc.moveDown(2);

    // Recap du profil
    const recap = content.recap;
    if (recap.aiLevel || recap.sector || recap.budgetTier) {
      doc
        .fontSize(11)
        .fillColor(this.teal)
        .text('Votre profil', { align: 'center' });
      doc.moveDown(0.5);

      const profileLines: string[] = [];
      if (recap.aiLevel) {
        const levelLabel = this.getLevelLabel(recap.aiLevel);
        profileLines.push(`Niveau IA : ${levelLabel}`);
      }
      if (recap.sector) {
        profileLines.push(`Secteur : ${recap.sector}`);
      }
      if (recap.budgetTier) {
        profileLines.push(`Budget mensuel : ${recap.budgetTier} EUR/mois`);
      }

      for (const line of profileLines) {
        doc
          .fontSize(10)
          .fillColor(this.darkText)
          .text(line, { align: 'center' });
      }
    }

    doc.moveDown(4);
    doc.fontSize(9).fillColor(this.mutedText).text('asilidesign.fr', {
      align: 'center',
      link: 'https://asilidesign.fr',
    });

    this.drawPageFooter(doc);
  }

  /* ------------------------------------------------------------------ */
  /*  SECTION : Cheatsheet                                               */
  /* ------------------------------------------------------------------ */

  private drawCheatsheetSection(
    doc: PDFKit.PDFDocument,
    cheatsheet: CheatsheetEntry[],
  ): void {
    doc.addPage();
    this.drawSectionTitle(doc, 'Cheatsheet — Vos outils IA');
    doc.moveDown(0.5);

    // Regrouper par categorie
    const byCategory = new Map<string, CheatsheetEntry[]>();
    for (const entry of cheatsheet) {
      const list = byCategory.get(entry.category) ?? [];
      list.push(entry);
      byCategory.set(entry.category, list);
    }

    for (const [category, tools] of byCategory) {
      this.ensureSpace(doc, 60);
      doc.fontSize(10).fillColor(this.teal).text(category.toUpperCase());
      doc.moveDown(0.3);

      for (const tool of tools) {
        this.ensureSpace(doc, 35);
        const marker = tool.alreadyUsed ? '\u2713' : '\u2605';
        const markerLabel = tool.alreadyUsed ? ' (deja utilise)' : '';

        doc
          .fontSize(9)
          .fillColor(this.darkText)
          .text(
            `${marker} ${tool.tool}${markerLabel}`,
            this.pageMargin + 10,
            doc.y,
            {
              continued: true,
              width: 180,
            },
          )
          .fillColor(this.mutedText)
          .text(`${tool.price}`, { continued: true, width: 80 })
          .text(tool.url, {
            width: 150,
            link: `https://${tool.url}`,
          });
        doc
          .fontSize(8)
          .fillColor(this.mutedText)
          .text(`  ${tool.tip}`, this.pageMargin + 20, doc.y, {
            width: 490,
          });
        doc.moveDown(0.3);
      }
      doc.moveDown(0.5);
    }

    this.drawPageFooter(doc);
  }

  /* ------------------------------------------------------------------ */
  /*  SECTION : Prompts                                                  */
  /* ------------------------------------------------------------------ */

  private drawPromptsSection(
    doc: PDFKit.PDFDocument,
    prompts: PromptEntry[],
  ): void {
    doc.addPage();
    this.drawSectionTitle(doc, 'Prompts personnalises');
    doc.moveDown(0.5);

    // Regrouper par categorie
    const byCategory = new Map<string, PromptEntry[]>();
    for (const entry of prompts) {
      const list = byCategory.get(entry.category) ?? [];
      list.push(entry);
      byCategory.set(entry.category, list);
    }

    for (const [category, categoryPrompts] of byCategory) {
      this.ensureSpace(doc, 80);
      doc.fontSize(10).fillColor(this.teal).text(category.toUpperCase());
      doc.moveDown(0.3);

      for (const prompt of categoryPrompts) {
        this.ensureSpace(doc, 70);

        // Boite stylisee
        const boxX = this.pageMargin + 5;
        const boxY = doc.y;
        const boxWidth = 500;

        // Fond de la boite
        doc.roundedRect(boxX, boxY, boxWidth, 2, 1).fill(this.teal);

        doc.y = boxY + 6;

        const levelLabel = this.getLevelLabel(prompt.level);
        doc
          .fontSize(9)
          .fillColor(this.darkText)
          .text(`${prompt.title}`, boxX + 5, doc.y, { width: boxWidth - 10 });
        doc
          .fontSize(8)
          .fillColor(this.mutedText)
          .text(
            `Niveau : ${levelLabel} | Outil : ${prompt.tool}`,
            boxX + 5,
            doc.y,
            {
              width: boxWidth - 10,
            },
          );
        doc.moveDown(0.2);
        doc
          .fontSize(8)
          .fillColor(this.darkText)
          .text(prompt.prompt, boxX + 5, doc.y, { width: boxWidth - 10 });
        doc.moveDown(0.8);
      }
      doc.moveDown(0.3);
    }

    this.drawPageFooter(doc);
  }

  /* ------------------------------------------------------------------ */
  /*  SECTION : Workflows                                                */
  /* ------------------------------------------------------------------ */

  private drawWorkflowsSection(
    doc: PDFKit.PDFDocument,
    workflows: WorkflowEntry[],
  ): void {
    doc.addPage();
    this.drawSectionTitle(doc, 'Workflows automatises');
    doc.moveDown(0.5);

    for (const workflow of workflows) {
      this.ensureSpace(doc, 100);

      doc.fontSize(11).fillColor(this.teal).text(workflow.title);
      doc
        .fontSize(9)
        .fillColor(this.mutedText)
        .text(workflow.description, { width: 500 });
      doc
        .fontSize(8)
        .fillColor(this.mutedText)
        .text(
          `Temps de mise en place : ${workflow.setupTime} | Cout mensuel : ${workflow.monthlyCost} EUR/mois`,
        );
      doc.moveDown(0.3);

      // Etapes numerotees
      for (const step of workflow.steps) {
        this.ensureSpace(doc, 30);
        doc
          .fontSize(9)
          .fillColor(this.darkText)
          .text(`${step.step}. ${step.action}`, this.pageMargin + 15, doc.y, {
            width: 480,
          });
        doc
          .fontSize(8)
          .fillColor(this.mutedText)
          .text(
            `   ${step.tool} — ${step.detail}`,
            this.pageMargin + 15,
            doc.y,
            { width: 480 },
          );
        doc.moveDown(0.2);
      }

      doc.moveDown(0.3);
      doc
        .fontSize(8)
        .fillColor(this.mutedText)
        .text(`Outils : ${workflow.tools.join(', ')}`, {
          width: 500,
        });
      doc.moveDown(1);
    }

    this.drawPageFooter(doc);
  }

  /* ------------------------------------------------------------------ */
  /*  SECTION : Templates                                                */
  /* ------------------------------------------------------------------ */

  private drawTemplatesSection(
    doc: PDFKit.PDFDocument,
    templates: TemplateEntry[],
  ): void {
    doc.addPage();
    this.drawSectionTitle(doc, "Templates prets a l'emploi");
    doc.moveDown(0.5);

    for (const template of templates) {
      this.ensureSpace(doc, 50);

      doc
        .fontSize(10)
        .fillColor(this.darkText)
        .text(template.name, this.pageMargin + 5, doc.y, {
          continued: true,
          width: 250,
        })
        .fillColor(this.teal)
        .text(` (${template.platform})`, { width: 200 });
      doc
        .fontSize(8)
        .fillColor(this.mutedText)
        .text(template.description, this.pageMargin + 5, doc.y, {
          width: 490,
        });
      doc
        .fontSize(8)
        .fillColor(this.teal)
        .text(template.url, this.pageMargin + 5, doc.y, {
          width: 490,
          link: template.url,
        });
      if (template.minBudget > 0) {
        doc
          .fontSize(7)
          .fillColor(this.mutedText)
          .text(
            `Budget minimum : ${template.minBudget} EUR/mois`,
            this.pageMargin + 5,
            doc.y,
          );
      }
      doc.moveDown(0.8);
    }

    this.drawPageFooter(doc);
  }

  /* ------------------------------------------------------------------ */
  /*  SECTION : Prompt genere (optionnel)                                */
  /* ------------------------------------------------------------------ */

  private drawGeneratedPromptSection(
    doc: PDFKit.PDFDocument,
    generatedPrompt: string,
  ): void {
    doc.addPage();
    this.drawSectionTitle(doc, 'Votre prompt personnalise');
    doc.moveDown(1);

    // Boite avec fond colore
    const boxX = this.pageMargin + 10;
    const boxWidth = 490;

    doc.roundedRect(boxX, doc.y, boxWidth, 3, 1).fill(this.teal);
    doc.y += 8;

    doc.rect(boxX, doc.y, boxWidth, 200).fill(this.lightBg);

    doc
      .fontSize(9)
      .fillColor(this.darkText)
      .text(generatedPrompt, boxX + 10, doc.y + 10, {
        width: boxWidth - 20,
      });

    this.drawPageFooter(doc);
  }

  /* ------------------------------------------------------------------ */
  /*  Utilitaires                                                        */
  /* ------------------------------------------------------------------ */

  /** Dessine un titre de section avec ligne decorative. */
  private drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(16).fillColor(this.teal).text(title, { align: 'left' });
    doc.moveDown(0.2);
    this.drawHorizontalLine(doc);
  }

  /** Dessine une ligne horizontale decorative. */
  private drawHorizontalLine(doc: PDFKit.PDFDocument): void {
    doc
      .moveTo(this.pageMargin, doc.y)
      .lineTo(555, doc.y)
      .strokeColor(this.teal)
      .lineWidth(1)
      .stroke();
  }

  /** Dessine le pied de page avec la mention asilidesign.fr. */
  private drawPageFooter(doc: PDFKit.PDFDocument): void {
    const bottomY = 800;
    doc
      .fontSize(7)
      .fillColor(this.mutedText)
      .text(
        'asilidesign.fr/formations  •  Guide genere avec amour par IA  •  asilidesign.fr/contact',
        this.pageMargin,
        bottomY,
        {
          align: 'center',
          width: 515,
          link: 'https://asilidesign.fr/formations',
        },
      );
  }

  /** Ajoute une nouvelle page si l'espace restant est insuffisant. */
  private ensureSpace(doc: PDFKit.PDFDocument, requiredHeight: number): void {
    if (doc.y + requiredHeight > 770) {
      this.drawPageFooter(doc);
      doc.addPage();
    }
  }

  /** Retourne le libelle francais du niveau IA. */
  private getLevelLabel(level: string): string {
    switch (level) {
      case 'debutant':
        return 'Debutant';
      case 'intermediaire':
        return 'Intermediaire';
      case 'avance':
        return 'Avance';
      default:
        return level;
    }
  }
}

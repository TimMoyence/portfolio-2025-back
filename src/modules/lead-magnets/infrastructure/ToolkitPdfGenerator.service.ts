import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import type { IToolkitPdfGenerator } from '../domain/IToolkitPdfGenerator';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import type { ToolkitContent } from '../domain/ToolkitContent';
import { ToolkitHtmlRendererService } from './ToolkitHtmlRenderer.service';

/**
 * Genere le PDF "Guide IA personnalise" via Puppeteer (Chromium headless)
 * a partir d'un template HTML+CSS construit par {@link ToolkitHtmlRendererService}.
 *
 * Avantages par rapport a l'ancienne implementation PDFKit :
 * - Pagination CSS automatique (plus de pages blanches)
 * - Mise en page declarative (grille, flex, badges, code blocks)
 * - Resultat fidele a une page web rendue dans Chrome
 *
 * Le navigateur est lance paresseusement et reutilise pour toutes les requetes
 * du processus, puis ferme proprement lors du shutdown du module.
 */
@Injectable()
export class ToolkitPdfGeneratorService
  implements IToolkitPdfGenerator, OnModuleDestroy
{
  private readonly logger = new Logger(ToolkitPdfGeneratorService.name);
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly htmlRenderer: ToolkitHtmlRendererService) {}

  /** Genere le PDF du guide pour une demande donnee. */
  async generate(
    _request: LeadMagnetRequest,
    content: ToolkitContent,
  ): Promise<Buffer> {
    const html = this.htmlRenderer.render(content);
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        // Marges physiques uniformes appliquees a TOUTES les pages physiques.
        // La cover utilise position: absolute pour deborder ces marges et
        // remplir entierement la premiere page.
        margin: {
          top: '28mm',
          bottom: '24mm',
          left: '22mm',
          right: '22mm',
        },
        preferCSSPageSize: false,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  /** Lance Chromium une seule fois et retourne l'instance partagee. */
  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    return this.browserPromise;
  }

  /** Ferme proprement Chromium lors du shutdown du module. */
  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      try {
        const browser = await this.browserPromise;
        await browser.close();
      } catch (error) {
        this.logger.warn(
          `Echec lors de la fermeture du navigateur Puppeteer: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      } finally {
        this.browserPromise = null;
      }
    }
  }
}

import { Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

// La cover du toolkit deborde ces marges par marges negatives, cf. la regle
// `.cover.page` de lead-magnets/infrastructure/toolkit-html/toolkit-html.css.ts.
const PAGE_MARGINS = {
  top: '28mm',
  bottom: '24mm',
  left: '22mm',
  right: '22mm',
} as const;

// puppeteer : Chromium ne demarre pas dans un conteneur Docker sans ces args.
const CONTAINER_SAFE_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
];

export abstract class ImprimeriePdf implements OnModuleDestroy {
  private readonly logger = new Logger(this.constructor.name);
  private browserPromise: Promise<Browser> | null = null;

  protected async imprimer(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: PAGE_MARGINS,
        preferCSSPageSize: false,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: CONTAINER_SAFE_CHROMIUM_ARGS,
      });
    }
    return this.browserPromise;
  }

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

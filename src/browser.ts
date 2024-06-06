import { LaunchedChrome, launch } from 'chrome-launcher';
import TabHandler, { TabHandlerInterface } from './tab/tabHandler';

export default class Browser implements TabHandlerInterface {
  static async create() {
    const browser = new Browser();
    await browser.init();
    return browser;
  }

  private constructor() {}

  private window!: LaunchedChrome;
  private tabHandler!: TabHandler;

  private async init() {
    this.window = await launch({
      chromeFlags: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--blink-settings=imagesEnabled=true',
      ],
    });
    this.tabHandler = await TabHandler.create(this.window.port);
  }

  private defaultTabConsumed: boolean = false;

  async newTab(options: { url: string } = { url: '' }) {
    if (!this.defaultTabConsumed) {
      this.defaultTabConsumed = true;
      return this.tabHandler.getAllTabs()[0];
    }
    return this.tabHandler.newTab(options);
  }

  close() {
    this.window.kill();
  }

  getAllOpenTabs() {
    return this.tabHandler.getAllTabs();
  }
}

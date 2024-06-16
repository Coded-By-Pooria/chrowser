import { LaunchedChrome, launch } from 'chrome-launcher';
import TabHandler, { TabHandlerInterface } from './tab/tabHandler.js';

export interface BrowserOptions {
  args?: string[];
  userDir?: string;
}

export default class Browser implements TabHandlerInterface {
  private isClosed = false;
  static async create(options?: BrowserOptions) {
    const browser = new Browser(options);
    await browser.init();
    return browser;
  }

  private constructor(private browserOptions?: BrowserOptions) {}

  private window!: LaunchedChrome;
  private tabHandler!: TabHandler;

  private async init() {
    const browserArgs = [];

    if (this.browserOptions?.userDir?.trim()) {
      browserArgs.push(
        `--user-data-directory="${this.browserOptions.userDir.trim()}"`
      );
    }

    if (this.browserOptions?.args?.length) {
      browserArgs.push(...this.browserOptions.args);
    }

    this.window = await launch({
      chromeFlags: browserArgs,
    });
    this.tabHandler = await TabHandler.create(this.window.port);
  }

  async newTab(options: { url: string } = { url: '' }) {
    this.isCloseCheck();
    return this.tabHandler.newTab(options);
  }

  close() {
    this.isClosed = true;
    this.window.kill();
  }

  private isCloseCheck() {
    if (this.isClosed) {
      throw new Error(
        'Cannot operate on closed browser. Launch another instance of chrowser and try this action.'
      );
    }
  }

  getAllOpenTabs() {
    this.isCloseCheck();
    return this.tabHandler.getAllTabs();
  }
}

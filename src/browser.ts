import { LaunchedChrome, launch } from 'chrome-launcher';
import TabHandler, { TabHandlerInterface } from './tab/tabHandler.js';
import { fetchURL } from './utils.js';

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

  protected constructor(private browserOptions?: BrowserOptions) {}

  private window!: LaunchedChrome;
  private tabHandler!: TabHandler;

  private _userAgent!: string;
  private _version!: string;
  protected async init() {
    const browserArgs = [];

    // if (this.browserOptions?.userDir?.trim()) {
    //   browserArgs.push(
    //     `--user-data-directory="${this.browserOptions.userDir.trim()}"`
    //   );
    // }

    if (this.browserOptions?.args?.length) {
      browserArgs.push(...this.browserOptions.args);
    }

    this.window = await launch({
      chromeFlags: browserArgs,
      userDataDir: this.browserOptions?.userDir,
    });

    let response = JSON.parse(
      await fetchURL('http://localhost:' + this.window.port + '/json/version')
    );

    this._userAgent = response['User-Agent'];
    this._version = response['Browser'];
    this.tabHandler = await TabHandler.create(this);
  }

  get version() {
    return this._version;
  }

  get port() {
    return this.window.port;
  }

  get pid() {
    return this.window.pid;
  }

  get userAgent() {
    return this._userAgent;
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

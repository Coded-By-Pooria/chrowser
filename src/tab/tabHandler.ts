import CDP from 'chrome-remote-interface';
import { TabHelper } from './tabHelper';
import Tab from './tab';

export interface TabHandlerInterface {
  newTab(options: { url: string }): Promise<Tab>;
}

export default class TabHandler {
  static async create(chromeSessionPort: number) {
    const { Target } = await CDP({ port: chromeSessionPort });
    const defaultTabInfo = await Target.getTargetInfo();

    const handler = new TabHandler(
      chromeSessionPort,
      defaultTabInfo.targetInfo.targetId
    );
    return handler;
  }
  private tabHelper: TabHelper;

  private constructor(private chromeSessionPort: number, defaultTabId: string) {
    this.tabHelper = new TabHelper(chromeSessionPort, this.close.bind(this));
    this.openedTabs.set(defaultTabId, new Tab(defaultTabId, this.tabHelper));
  }
  private openedTabs: Map<string, Tab> = new Map();

  async newTab(options: { url: string } = { url: '' }) {
    const newTab = await this.tabHelper.newTab(options);
    this.openedTabs.set(newTab.tabId, newTab);
    return newTab;
  }

  getAllTabs() {
    return [...this.openedTabs.values()];
  }

  async close(tabId: string): Promise<void> {
    this.openedTabs.delete(tabId);
  }
}

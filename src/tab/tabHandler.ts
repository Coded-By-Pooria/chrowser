import CDP from 'chrome-remote-interface';
import Tab, { TabImpl } from './tab';

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

  private constructor(private chromeSessionPort: number, defaultTabId: string) {
    this.openedTabs.set(defaultTabId, new TabImpl(defaultTabId, this));
  }

  provideSessionZone(tab: Tab) {
    return new SessionZoneEstablisher(
      { port: this.chromeSessionPort },
      tab.tabId
    );
  }

  private openedTabs: Map<string, Tab> = new Map();

  private defaultTabDelivered = false;
  async newTab(options: { url: string } = { url: '' }): Promise<Tab> {
    if (!this.defaultTabDelivered) {
      this.defaultTabDelivered = true;
      return this.openedTabs.values().next().value as Tab;
    }
    const newTabSession = await CDP.New({
      port: this.chromeSessionPort,
      ...options,
    });

    const newTab = new TabImpl(newTabSession.id, this);
    this.openedTabs.set(newTab.tabId, newTab);
    return newTab;
  }

  getAllTabs() {
    return [...this.openedTabs.values()];
  }

  async close(tab: Tab): Promise<void> {
    this.openedTabs.delete(tab.tabId);
    return CDP.Close({
      id: tab.tabId,
      port: this.chromeSessionPort,
    });
  }
}

export class SessionZoneEstablisher {
  constructor(
    private connectionData: { port: number; host?: string },
    private tabId: string
  ) {}
  async sessionZone<T>(callback: (session: CDP.Client) => Promise<T>) {
    const tabSession = await CDP({
      target: this.tabId,
      ...this.connectionData,
    });
    try {
      let result: T = await callback(tabSession);
      return result;
    } catch (err) {
      throw err;
    } finally {
      await tabSession.close();
    }
  }
}

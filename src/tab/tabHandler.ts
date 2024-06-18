import CDP from 'chrome-remote-interface';
import Tab, { TabImpl } from './tab';

export interface TabHandlerInterface {
  newTab(options: { url: string }): Promise<Tab>;
}

export default class TabHandler {
  static async create(chromeSessionPort: number) {
    const session = await CDP({ port: chromeSessionPort });
    const defaultTabInfo = await session.Target.getTargetInfo();

    const handler = new TabHandler(chromeSessionPort, {
      id: defaultTabInfo.targetInfo.targetId,
      session,
    });
    return handler;
  }

  private constructor(
    private chromeSessionPort: number,
    defaultTab: { session: CDP.Client; id: string }
  ) {
    this.openedTabs.set(
      defaultTab.id,
      new TabImpl(defaultTab.id, defaultTab.session, this)
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

    const session = await CDP({
      port: this.chromeSessionPort,
      target: newTabSession.id,
    });

    const newTab = new TabImpl(newTabSession.id, session, this);
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

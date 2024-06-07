import CDP from 'chrome-remote-interface';
import { TabHandlerInterface } from './tabHandler';
import TabMouseHandler from './tabMouseHandler';
import Tab, {
  WaitForSelectorOptions,
  WaitUntilNetworkIdleOptions,
  type TabEvaluateFunction,
} from './tab';
import { EvaluateException } from '../exceptions/evaluateException';
import type TabNavigationOptions from './tabNavigationOptions';
import NavigationException from '../exceptions/navigationException';
import { evaluationSctriptProvider } from './helper';
import WaitUntilNetworkIdleHandler from './tab_functionality/waitUntilNetworkIdle';
import WaitForSelectorAppearHandler from './tab_functionality/waitForSelectorAppearHandler';

export interface TabSessionZoneMaker {
  sessionZone<T>(
    tabId: string,
    callback: (session: CDP.Client) => Promise<T>
  ): Promise<T>;
}

export class TabHelper implements TabHandlerInterface, TabSessionZoneMaker {
  constructor(
    private chromeSessionPort: number,
    private onClose?: (tabId: string) => Promise<void>
  ) {}

  provideMouseHandler(tabId: string) {
    return new TabMouseHandler(tabId, this);
  }

  async newTab(options: { url: string }): Promise<Tab> {
    const newTabSession = await CDP.New({
      port: this.chromeSessionPort,
      ...options,
    });
    return new Tab(newTabSession.id, this);
  }

  async sessionZone<T>(
    tabId: string,
    callback: (session: CDP.Client) => Promise<T>
  ) {
    const tabSession = await CDP({
      port: this.chromeSessionPort,
      target: tabId,
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

  async navigate(tabId: string, options: TabNavigationOptions) {
    await this.sessionZone(tabId, async (sess) => {
      const { Page } = sess;
      await Page.enable();
      const navigateResult = await Page.navigate(options);

      if (navigateResult.errorText?.trim()) {
        throw new NavigationException(navigateResult.errorText);
      }

      const waitUntilOpt = options.waitUntil ?? 'load';

      switch (waitUntilOpt) {
        case 'documentloaded':
          {
            await Page.domContentEventFired();
          }
          break;
        case 'load':
          {
            await Page.loadEventFired();
          }
          break;
      }
    });
  }

  async addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction,
    tabId: string
  ): Promise<void> {
    return await this.sessionZone(tabId, async (sess) => {
      const { Page } = sess;

      const { serialazedFunc } = evaluationSctriptProvider(script);
      await Page.addScriptToEvaluateOnNewDocument({
        source: serialazedFunc,
      });
    });
  }

  async evaluateScriptOnTab(
    script: string | TabEvaluateFunction,
    tabId: string,
    _shouldAwait?: boolean
  ) {
    return await this.sessionZone(tabId, async (sess) => {
      const { Runtime } = sess;

      const { serialazedFunc, shouldAwait } = evaluationSctriptProvider(script);
      const result = await Runtime.evaluate({
        expression: serialazedFunc,
        awaitPromise: _shouldAwait ?? shouldAwait,
        returnByValue: true,
      });

      if (result.exceptionDetails) {
        throw new EvaluateException(result.exceptionDetails);
      }

      return result.result.value;
    });
  }

  async waitUntilNetworkIdle(
    tabId: string,
    options: WaitUntilNetworkIdleOptions
  ) {
    return this.sessionZone(tabId, ({ Network }) => {
      return WaitUntilNetworkIdleHandler.start(Network, options);
    });
  }

  async waitForSelectorAppear(
    tabId: string,
    selector: string,
    options?: WaitForSelectorOptions
  ) {
    return this.sessionZone(tabId, async ({ Runtime }) => {
      return WaitForSelectorAppearHandler.start(Runtime, selector, options);
    });
  }

  async close(tabId: string): Promise<void> {
    await CDP.Close({ id: tabId, port: this.chromeSessionPort });
    await this.onClose?.(tabId);
  }
}

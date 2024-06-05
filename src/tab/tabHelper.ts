import CDP from 'chrome-remote-interface';
import { TabHandlerInterface } from './tabHandler';
import TabMouseHandler from './tabMouseHandler';
import Tab, { type TabEvaluateFunction } from './tab';
import { EvaluateException } from '../exceptions/evaluateException';
import type TabNavigationOptions from './tabNavigationOptions';
import NavigationException from '../exceptions/navigationException';

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

  async evaluateScriptOnTab(
    script: string | TabEvaluateFunction,
    tabId: string,
    shouldAwait: boolean = false
  ) {
    let serialazedFunc: string;

    if (typeof script === 'string') {
      serialazedFunc = script.trim();
      shouldAwait = serialazedFunc.startsWith('async');
    } else {
      const tempSerialized = script.toString().trim();
      shouldAwait = tempSerialized.startsWith('async');
      serialazedFunc = `(${tempSerialized})()`;
    }

    const { Runtime } = await CDP({
      port: this.chromeSessionPort,
      target: tabId,
    });

    const result = await Runtime.evaluate({
      expression: serialazedFunc,
      awaitPromise: shouldAwait,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw new EvaluateException(result.exceptionDetails);
    }

    return result.result.value;
  }

  async close(tabId: string): Promise<void> {
    await CDP.Close({ id: tabId, port: this.chromeSessionPort });
    this.onClose?.(tabId);
  }
}

import CDP from 'chrome-remote-interface';
import { TabHandlerInterface } from './tabHandler';
import TabMouseHandler from './tabMouseHandler';
import Tab, {
  WaitUntilNetworkIdleOptions,
  type TabEvaluateFunction,
} from './tab';
import { EvaluateException } from '../exceptions/evaluateException';
import type TabNavigationOptions from './tabNavigationOptions';
import NavigationException from '../exceptions/navigationException';
import { evaluationSctriptProvider } from './helper';
import { Network } from '../types';

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

  async close(tabId: string): Promise<void> {
    await CDP.Close({ id: tabId, port: this.chromeSessionPort });
    await this.onClose?.(tabId);
  }
}

class WaitUntilNetworkIdleHandler {
  private constructor(
    private networkContext: Network,
    private idleInterval: number,
    private tolerance: number
  ) {}
  private lastIdleItem!: number;
  private isResolved = false;
  private timerId!: NodeJS.Timeout;

  private waiterResolver!: () => void;
  private waiterRejecter!: (reason?: any) => void;

  private async start() {
    await this.networkContext.enable();
    this.lastIdleItem = Date.now();
    this.networkContext.on('requestWillBeSent', (_) => {
      if (!this.isResolved) this.resetTimer();
    });
    this.networkContext.on('responseReceived', (_) => {
      if (!this.isResolved) this.resetTimer();
    });

    this.setTimer();

    return new Promise<void>((res, rej) => {
      this.waiterResolver = res;
      this.waiterRejecter = rej;
    });
  }

  private resetTimer() {
    const newIdleTime = Date.now();
    const diff = newIdleTime - this.lastIdleItem;
    const tolerancedBound =
      this.idleInterval - this.tolerance * this.idleInterval;
    if (diff >= tolerancedBound) {
      this.resolve();
      return;
    }
    this.lastIdleItem = newIdleTime;
    clearTimeout(this.timerId);
    this.setTimer();
  }
  private setTimer() {
    this.timerId = setTimeout(() => {
      this.resolve();
    }, this.idleInterval);
  }

  private async resolve() {
    this.isResolved = true;
    await this.networkContext.disable();
    this.waiterResolver();
  }

  static start(
    networkContext: Network,
    options: WaitUntilNetworkIdleOptions & { tolerance?: number }
  ) {
    const tolerance = options.tolerance ?? 0.05;
    const handler = new WaitUntilNetworkIdleHandler(
      networkContext,
      options.idleInterval,
      tolerance
    );
    return handler.start();
  }
}

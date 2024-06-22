import CDP from 'chrome-remote-interface';
import Evaluable from './evaluable';
import RemoteNodeDelegator from './js_delegator/remoteNodeDelegator';
import TabMouseHandler from './tabMouseHandler';
import type TabNavigationOptions from './tabNavigationOptions';
import TabHandler from './tabHandler';
import Frame from './frame';
import { type WaiterSignalFunc } from './tab_functionality/waitUntilReturnTrue';

export type TabEvaluateFunction<T = any, P = any> = (...args: T[]) => P;
export type TabEvaluationScriptType<T = any, P = any> =
  | string
  | TabEvaluateFunction<T, P>;

export default interface Tab extends Evaluable {
  tabId: string;
  mouseHandler: TabMouseHandler;
  navigate(options: TabNavigationOptions): Promise<void>;
  waitForSelectorAppear(
    selector: string,
    options?: PollWaitForOptions
  ): Promise<void>;
  waitUntilReturnTrue(
    script: string | TabEvaluateFunction,
    options?: PollWaitForOptions,
    ...args: any[]
  ): Promise<void>;
  addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction
  ): Promise<void>;
  waitUntilNetworkIdle(options: WaitUntilNetworkIdleOptions): Promise<void>;
  close(): Promise<void>;
}

export class TabImpl implements Tab {
  constructor(
    private _tabId: string,
    private client: CDP.Client,
    private tabsHandler: TabHandler
  ) {}

  evaluate(script: string | TabEvaluateFunction, ...args: any[]): Promise<any> {
    return this.frame.evaluate(script, ...args);
  }
  $(selector: string): Promise<RemoteNodeDelegator<HTMLElement> | null> {
    return this.frame.$(selector);
  }
  $$(selector: string): Promise<RemoteNodeDelegator[]> {
    return this.frame.$$(selector);
  }
  $evaluate(
    selector: string,
    handler: TabEvaluateFunction<HTMLElement>
  ): Promise<any> {
    return this.frame.$evaluate(selector, handler);
  }
  $$evaluate(
    selector: string,
    handler: TabEvaluateFunction<HTMLElement[]>
  ): Promise<any> {
    return this.frame.$$evaluate(selector, handler);
  }

  #frame?: Frame;

  private get frame() {
    if (!this.#frame) {
      throw new Error('Cannot access tab frame. Maybe no navigation happened.');
    }
    return this.#frame;
  }

  private async readyForFrame() {
    const { Page, Runtime, Network } = this.client;
    await Page.enable();
    await Runtime.enable();
    await Network.enable();
  }

  async navigate(options: TabNavigationOptions): Promise<void> {
    await this.readyForFrame();
    this.#frame ??= new Frame(this.client, this);

    try {
      return this.#frame!.navigate(options);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message
          .toLocaleLowerCase()
          .includes('net::ERR_EMPTY_RESPONSE'.toLocaleLowerCase())
      ) {
        throw new Error(
          'No response sent from server. Try navigation again or navigate to another url.'
        );
      }

      throw err;
    }
  }

  async waitForSelectorAppear(selector: string, options?: PollWaitForOptions) {
    return this.frame.waitForSelectorAppear(selector, options);
  }

  get tabId() {
    return this._tabId;
  }

  get mouseHandler() {
    return this.frame.mouseHandler;
  }

  close(): Promise<void> {
    return this.tabsHandler.close(this);
  }

  addScriptToRunOnNewDocument(script: string | TabEvaluateFunction) {
    return this.frame.addScriptToRunOnNewDocument(script);
  }

  async waitUntilNetworkIdle(options: WaitUntilNetworkIdleOptions) {
    return this.frame.waitUntilNetworkIdle(options);
  }

  async waitUntilReturnTrue(
    script: WaiterSignalFunc,
    options?: PollWaitForOptions,
    ...args: any[]
  ) {
    return this.frame.waitUntilReturnTrue(script, options, ...args);
  }
}

export interface WaitUntilNetworkIdleOptions {
  idleInterval: number;
  idleNumber?: number;
}

export interface PollWaitForOptions {
  pollInterval?: number;
  waitTimeOut?: number;
}

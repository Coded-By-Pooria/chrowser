import CDP from 'chrome-remote-interface';
import RemoteNodeDelegator from './js_delegator/remoteNodeDelegator';
import TabMouseHandler from './tabMouseHandler';
import type TabNavigationOptions from './tabNavigationOptions';
import TabHandler from './tabHandler';
import Frame, { FrameBase, FrameEvents } from './frame';
import { type WaiterSignalFunc } from './tab_functionality/waitUntilReturnTrue';
import Browser from '../browser';
import { EventDataType, ListenCallback } from '@pourianof/notifier';
import KeyboardHandler from './tabKeyboardHandler';

export type TabEvaluateFunction<T = any, P = any> = (...args: T[]) => P;
export type TabEvaluationScriptType<T = any, P = any> =
  | string
  | TabEvaluateFunction<T, P>;

export default interface Tab extends FrameBase {
  tabId: string;
  mouseHandler: TabMouseHandler;
  keyboardHandler: KeyboardHandler;
  close(): Promise<void>;
  bringToFront(): Promise<void>;
  screenshot(options: {
    savePath: string;
    format?: 'png' | 'webp' | 'jpeg';
    quality?: number;
    totalPage?: boolean;
  }): Promise<void>;
  browser: Browser;
}

export class TabImpl implements Tab {
  constructor(
    private _tabId: string,
    private client: CDP.Client,
    private _browser: Browser,
    private tabsHandler?: TabHandler
  ) {}
  reload(): Promise<void> {
    return this.frame.reload();
  }
  addListener<_E extends 'NavigateRequest' | 'NavigateDone'>(
    eventName: _E,
    data: ListenCallback<_E, EventDataType<FrameEvents, _E>>
  ) {
    return this.frame.addListener(eventName, data);
  }

  set handler(handler: TabHandler) {
    this.tabsHandler = handler;
  }

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

  #frame!: Frame;

  private get frame() {
    this.#frame ??= new Frame(this.client, this);

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

    try {
      return this.frame.navigate(options);
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

  get browser() {
    return this._browser;
  }

  get mouseHandler() {
    return this.frame.mouseHandler;
  }

  get keyboardHandler() {
    return this.frame.keyboardHandler;
  }

  close(): Promise<void> {
    return this.tabsHandler!.close(this);
  }

  addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction,
    ...args: any[]
  ) {
    return this.frame.addScriptToRunOnNewDocument(script, ...args);
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

  async bringToFront() {
    await this.client.Page.enable();
    await this.client.Page.bringToFront();
  }

  async screenshot(options: {
    savePath: string;
    format?: 'png' | 'webp' | 'jpeg';
    quality?: number;
    totalPage?: boolean;
  }) {
    await this.client.Page.enable();
    const imageBuffer = (
      await this.client.Page.captureScreenshot({
        format: options.format,
        captureBeyondViewport: options.totalPage,
        quality: options.quality,
      })
    ).data;

    (await import('fs')).writeFileSync(options.savePath, imageBuffer, {
      encoding: 'base64',
    });
  }

  get _session() {
    return this.client;
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

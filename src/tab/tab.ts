import CDP from 'chrome-remote-interface';
import Evaluable from './evaluable';
import RemoteNodeDelegator from './js_delegator/remoteNodeDelegator';
import TabMouseHandler from './tabMouseHandler';
import type TabNavigationOptions from './tabNavigationOptions';
import TabHandler, { SessionZoneEstablisher } from './tabHandler';
import { evaluationFunctionProvider } from './helper';
import WaitUntilNetworkIdleHandler from './tab_functionality/waitUntilNetworkIdle';
import WaitForSelectorAppearHandler from './tab_functionality/waitForSelectorAppearHandler';
import Frame from './frame';
import ExecutionContext from './session_contexts/executionContext';
import PageContext from './session_contexts/pageContext';

export type TabEvaluateFunction<T = any, P = any> = (...args: T[]) => P;
export interface TabSessionZoneMaker {
  sessionZone<T>(callback: (session: CDP.Client) => Promise<T>): Promise<T>;
}

export default interface Tab extends Evaluable {
  tabId: string;
  mouseHandler: TabMouseHandler;
  navigate(options: TabNavigationOptions): Promise<void>;
  waitForSelectorAppear(
    selector: string,
    options?: WaitForSelectorOptions
  ): Promise<void>;
  addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction
  ): Promise<void>;
  waitUntilNetworkIdle(options: WaitUntilNetworkIdleOptions): Promise<void>;
  close(): Promise<void>;
}

export class TabImpl implements Tab, TabSessionZoneMaker {
  constructor(private _tabId: string, private tabsHandler: TabHandler) {}

  evaluate(script: string | TabEvaluateFunction, ...args: any[]): Promise<any> {
    return this.frame.evaluate(script, args);
  }
  $(selector: string): Promise<RemoteNodeDelegator<HTMLElement> | null> {
    return this.frame.$(selector);
  }
  $$(selector: string): Promise<RemoteNodeDelegator[]> {
    return this.frame.$$(selector);
  }
  $evaluate(
    selector: string,
    handler: TabEvaluateFunction<RemoteNodeDelegator<HTMLElement>>
  ): Promise<any> {
    return this.frame.$evaluate(selector, handler);
  }
  $$evaluate(
    selector: string,
    handler: TabEvaluateFunction<RemoteNodeDelegator<HTMLElement>[]>
  ): Promise<any> {
    return this.frame.$$evaluate(selector, handler);
  }

  private sessionZoneEstablisher!: SessionZoneEstablisher;
  async sessionZone<T>(callback: (session: CDP.Client) => Promise<T>) {
    this.sessionZoneEstablisher ??= this.tabsHandler.provideSessionZone(this);
    return this.sessionZoneEstablisher.sessionZone(callback);
  }

  #frame?: Frame;

  private get frame() {
    if (!this.#frame) {
      throw new Error('Cannot access tab frame. Maybe no navigation happened.');
    }
    return this.#frame;
  }

  async navigate(options: TabNavigationOptions) {
    this.#frame ??= new Frame(new PageContext(this), this.executionContext);

    await this.sessionZone(async ({ Page, Runtime }) => {
      return this.#frame!.navigate(options, Runtime, Page);
    });
  }

  #executionContext!: ExecutionContext;
  private get executionContext() {
    return (this.#executionContext ??= new ExecutionContext(this));
  }

  async waitForSelectorAppear(
    selector: string,
    options?: WaitForSelectorOptions
  ) {
    return this.sessionZone(async ({ Runtime }) => {
      return WaitForSelectorAppearHandler.start(Runtime, selector, options);
    });
  }

  get tabId() {
    return this._tabId;
  }

  private _mouseHandler?: TabMouseHandler;
  get mouseHandler() {
    return (this._mouseHandler ??= new TabMouseHandler(this));
  }

  close(): Promise<void> {
    return this.tabsHandler.close(this);
  }

  addScriptToRunOnNewDocument(script: string | TabEvaluateFunction) {
    return this.sessionZone(async ({ Page }) => {
      await Page.enable();
      const serialazedFunc = evaluationFunctionProvider(script);
      await Page.addScriptToEvaluateOnNewDocument({
        source: serialazedFunc,
      });
    });
  }

  async waitUntilNetworkIdle(
    options: WaitUntilNetworkIdleOptions = { idleInterval: 500, idleNumber: 0 }
  ) {
    return this.sessionZone(({ Network }) => {
      return WaitUntilNetworkIdleHandler.start(Network, options);
    });
  }
}

export interface WaitUntilNetworkIdleOptions {
  idleInterval: number;
  idleNumber?: number;
}

export interface WaitForSelectorOptions {
  pollInterval?: number;
  waitTimeOut?: number;
}

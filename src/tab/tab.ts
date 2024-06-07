import { TabHelper } from './tabHelper';
import TabMouseHandler from './tabMouseHandler';
import type TabNavigationOptions from './tabNavigationOptions';

export type TabEvaluateFunction = (...args: any[]) => any;

export default class Tab {
  constructor(private _tabId: string, private helper: TabHelper) {}

  async navigate(options: TabNavigationOptions) {
    const navigationResult = await this.helper.navigate(this.tabId, options);
    return navigationResult;
  }

  async waitForSelectorAppear(
    selector: string,
    options?: WaitForSelectorOptions
  ) {
    return this.helper.waitForSelectorAppear(this.tabId, selector, options);
  }

  evaluate(script: TabEvaluateFunction | string) {
    return this.helper.evaluateScriptOnTab(script, this.tabId);
  }

  get tabId() {
    return this._tabId;
  }

  private _mouseHandler?: TabMouseHandler;
  get mouseHandler() {
    return (this._mouseHandler ??= this.helper.provideMouseHandler(this.tabId));
  }

  close() {
    return this.helper.close(this.tabId);
  }

  addScriptToRunOnNewDocument(script: string | TabEvaluateFunction) {
    return this.helper.addScriptToRunOnNewDocument(script, this.tabId);
  }

  async waitUntilNetworkIdle(
    options: WaitUntilNetworkIdleOptions = { idleInterval: 500, idleNumber: 0 }
  ) {
    return this.helper.waitUntilNetworkIdle(this.tabId, options);
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

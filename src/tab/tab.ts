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

  evaluate(script: TabEvaluateFunction | string) {
    return this.helper.evaluateScriptOnTab(script, this.tabId);
  }

  get tabId() {
    return this._tabId;
  }

  private _mouseHandler: TabMouseHandler;
  get mouseHandler() {
    return (this._mouseHandler ??= this.helper.provideMouseHandler(this.tabId));
  }

  close() {
    return this.helper.close(this.tabId);
  }

  addScriptToRunOnNewDocument(script: string | TabEvaluateFunction) {
    return this.helper.addScriptToRunOnNewDocument(script, this.tabId);
  }
}

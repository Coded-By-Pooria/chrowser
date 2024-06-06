import CDP from 'chrome-remote-interface';
import Protocol from 'devtools-protocol';

interface TabMouseBaseOptions {
  x: number;
  y: number;
}
declare class TabMouseHandler {
  private tabId;
  private tabHelper;
  constructor(tabId: string, tabHelper: TabSessionZoneMaker);
  move(options: TabMouseBaseOptions): Promise<void>;
  click(
    options: TabMouseBaseOptions & {
      delay?: number;
    }
  ): Promise<void>;
}

type TabNavigationOptions = Protocol.Page.NavigateRequest & {
  waitUntil?: 'documentloaded' | 'load';
};

interface TabSessionZoneMaker {
  sessionZone<T>(
    tabId: string,
    callback: (session: CDP.Client) => Promise<T>
  ): Promise<T>;
}
declare class TabHelper implements TabHandlerInterface, TabSessionZoneMaker {
  private chromeSessionPort;
  private onClose?;
  constructor(
    chromeSessionPort: number,
    onClose?: ((tabId: string) => Promise<void>) | undefined
  );
  provideMouseHandler(tabId: string): TabMouseHandler;
  newTab(options: { url: string }): Promise<Tab>;
  sessionZone<T>(
    tabId: string,
    callback: (session: CDP.Client) => Promise<T>
  ): Promise<T>;
  navigate(tabId: string, options: TabNavigationOptions): Promise<void>;
  addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction,
    tabId: string
  ): Promise<void>;
  evaluateScriptOnTab(
    script: string | TabEvaluateFunction,
    tabId: string,
    _shouldAwait?: boolean
  ): Promise<any>;
  close(tabId: string): Promise<void>;
}

type TabEvaluateFunction = (...args: any[]) => any;
declare class Tab {
  private _tabId;
  private helper;
  constructor(_tabId: string, helper: TabHelper);
  navigate(options: TabNavigationOptions): Promise<void>;
  evaluate(script: TabEvaluateFunction | string): Promise<any>;
  get tabId(): string;
  private _mouseHandler?;
  get mouseHandler(): TabMouseHandler;
  close(): Promise<void>;
  addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction
  ): Promise<void>;
}

interface TabHandlerInterface {
  newTab(options: { url: string }): Promise<Tab>;
}

declare class Browser implements TabHandlerInterface {
  static create(): Promise<Browser>;
  private constructor();
  private window;
  private tabHandler;
  private init;
  private defaultTabConsumed;
  newTab(options?: { url: string }): Promise<Tab>;
  close(): void;
  getAllOpenTabs(): Tab[];
}

export {
  Tab,
  type TabEvaluateFunction,
  type TabNavigationOptions,
  Browser as default,
};

import CDP from 'chrome-remote-interface';
import { TabHandlerInterface } from './tabHandler';
import TabMouseHandler from './tabMouseHandler';
import Tab, { WaitUntilNetworkIdleOptions, type TabEvaluateFunction } from './tab';
import type TabNavigationOptions from './tabNavigationOptions';
export interface TabSessionZoneMaker {
    sessionZone<T>(tabId: string, callback: (session: CDP.Client) => Promise<T>): Promise<T>;
}
export declare class TabHelper implements TabHandlerInterface, TabSessionZoneMaker {
    private chromeSessionPort;
    private onClose?;
    constructor(chromeSessionPort: number, onClose?: ((tabId: string) => Promise<void>) | undefined);
    provideMouseHandler(tabId: string): TabMouseHandler;
    newTab(options: {
        url: string;
    }): Promise<Tab>;
    sessionZone<T>(tabId: string, callback: (session: CDP.Client) => Promise<T>): Promise<T>;
    navigate(tabId: string, options: TabNavigationOptions): Promise<void>;
    addScriptToRunOnNewDocument(script: string | TabEvaluateFunction, tabId: string): Promise<void>;
    evaluateScriptOnTab(script: string | TabEvaluateFunction, tabId: string, _shouldAwait?: boolean): Promise<any>;
    waitUntilNetworkIdle(tabId: string, options: WaitUntilNetworkIdleOptions): Promise<void>;
    close(tabId: string): Promise<void>;
}

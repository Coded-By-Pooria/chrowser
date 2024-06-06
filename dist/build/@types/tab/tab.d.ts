import { TabHelper } from './tabHelper';
import TabMouseHandler from './tabMouseHandler';
import type TabNavigationOptions from './tabNavigationOptions';
export type TabEvaluateFunction = (...args: any[]) => any;
export default class Tab {
    private _tabId;
    private helper;
    constructor(_tabId: string, helper: TabHelper);
    navigate(options: TabNavigationOptions): Promise<void>;
    evaluate(script: TabEvaluateFunction | string): Promise<any>;
    get tabId(): string;
    private _mouseHandler?;
    get mouseHandler(): TabMouseHandler;
    close(): Promise<void>;
    addScriptToRunOnNewDocument(script: string | TabEvaluateFunction): Promise<void>;
    waitUntilNetworkIdle(options?: WaitUntilNetworkIdleOptions): Promise<void>;
}
export interface WaitUntilNetworkIdleOptions {
    idleInterval: number;
    idleNumber?: number;
}

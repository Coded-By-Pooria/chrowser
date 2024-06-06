import { TabSessionZoneMaker } from './tabHelper';
export interface TabMouseBaseOptions {
    x: number;
    y: number;
}
export default class TabMouseHandler {
    private tabId;
    private tabHelper;
    constructor(tabId: string, tabHelper: TabSessionZoneMaker);
    move(options: TabMouseBaseOptions): Promise<void>;
    click(options: TabMouseBaseOptions & {
        delay?: number;
    }): Promise<void>;
}

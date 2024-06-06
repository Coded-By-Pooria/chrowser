import Tab from './tab';
export interface TabHandlerInterface {
    newTab(options: {
        url: string;
    }): Promise<Tab>;
}
export default class TabHandler {
    private chromeSessionPort;
    static create(chromeSessionPort: number): Promise<TabHandler>;
    private tabHelper;
    private constructor();
    private openedTabs;
    newTab(options?: {
        url: string;
    }): Promise<Tab>;
    getAllTabs(): Tab[];
    close(tabId: string): Promise<void>;
}

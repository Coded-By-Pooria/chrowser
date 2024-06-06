import { TabHandlerInterface } from './tab/tabHandler';
export default class Browser implements TabHandlerInterface {
    static create(): Promise<Browser>;
    private constructor();
    private window;
    private tabHandler;
    private init;
    private defaultTabConsumed;
    newTab(options?: {
        url: string;
    }): Promise<import(".").Tab>;
    close(): void;
    getAllOpenTabs(): import(".").Tab[];
}

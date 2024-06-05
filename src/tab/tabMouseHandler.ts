import { TabSessionZoneMaker } from './tabHelper';
import { sleep } from '../utils';

export interface TabMouseBaseOptions {
  x: number;
  y: number;
}

export default class TabMouseHandler {
  constructor(private tabId: string, private tabHelper: TabSessionZoneMaker) {}

  async move(options: TabMouseBaseOptions) {
    this.tabHelper.sessionZone(this.tabId, async ({ Input }) => {
      await Input.dispatchMouseEvent({ type: 'mouseMoved', ...options });
    });
  }
  async click(options: TabMouseBaseOptions & { delay?: number }) {
    this.tabHelper.sessionZone(this.tabId, async ({ Input }) => {
      await Input.dispatchMouseEvent({
        type: 'mousePressed',
        ...options,
        clickCount: 1,
      });

      if (options.delay) {
        await sleep(options.delay);
      }

      await Input.dispatchMouseEvent({
        type: 'mouseReleased',
        ...options,
        clickCount: 1,
      });
    });
  }
}

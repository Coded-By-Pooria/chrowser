import { Input } from '../types';
import { sleep } from '../utils';

export interface TabMouseBaseOptions {
  x: number;
  y: number;
}

export default class MouseHandler {
  constructor(private inputContext: Input) {}

  async move(options: TabMouseBaseOptions) {
    await this.inputContext.dispatchMouseEvent({
      type: 'mouseMoved',
      ...options,
    });
  }
  async click(options: TabMouseBaseOptions & { delay?: number }) {
    await this.inputContext.dispatchMouseEvent({
      type: 'mousePressed',
      ...options,
      clickCount: 1,
      button: 'left',
    });

    if (options.delay) {
      await sleep(options.delay);
    }

    await this.inputContext.dispatchMouseEvent({
      type: 'mouseReleased',
      ...options,
      button: 'left',
      clickCount: 1,
    });
  }
}

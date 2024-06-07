import { Network } from '../../types';
import { WaitUntilNetworkIdleOptions } from '../tab';
import BaseWaiterMixin from './baseWaiterMixin';

export default class WaitUntilNetworkIdleHandler extends BaseWaiterMixin {
  private constructor(
    private networkContext: Network,
    private idleInterval: number,
    private tolerance: number
  ) {
    super();
  }
  private lastIdleItem!: number;
  private isResolved = false;
  private timerId!: NodeJS.Timeout;

  private async start() {
    await this.networkContext.enable();
    this.lastIdleItem = Date.now();
    this.networkContext.on('requestWillBeSent', (_) => {
      if (!this.isResolved) this.resetTimer();
    });
    this.networkContext.on('responseReceived', (_) => {
      if (!this.isResolved) this.resetTimer();
    });

    this.setTimer();

    return super.wait();
  }

  private resetTimer() {
    const newIdleTime = Date.now();
    const diff = newIdleTime - this.lastIdleItem;
    const tolerancedBound =
      this.idleInterval - this.tolerance * this.idleInterval;
    if (diff >= tolerancedBound) {
      this.resolve();
      return;
    }
    this.lastIdleItem = newIdleTime;
    clearTimeout(this.timerId);
    this.setTimer();
  }
  private setTimer() {
    this.timerId = setTimeout(() => {
      this.resolve();
    }, this.idleInterval);
  }

  private async resolve() {
    this.isResolved = true;
    await this.networkContext.disable();
    this.waiterResolver();
  }

  static start(
    networkContext: Network,
    options: WaitUntilNetworkIdleOptions & { tolerance?: number }
  ) {
    const tolerance = options.tolerance ?? 0.05;
    const handler = new WaitUntilNetworkIdleHandler(
      networkContext,
      options.idleInterval,
      tolerance
    );
    return handler.start();
  }
}

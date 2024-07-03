import WaitforSelectorAppearTimeoutException from '../../exceptions/waitForSelectorTimeoutException';
import Evaluable from '../evaluable';
import { PollWaitForOptions } from '../tab';
import BaseWaiterMixin from './baseWaiterMixin';

export default class WaitForSelectorAppearHandler extends BaseWaiterMixin {
  static async start(
    evaluateContext: Evaluable,
    selector: string,
    options?: PollWaitForOptions
  ) {
    const hadnler = new WaitForSelectorAppearHandler(
      evaluateContext,
      selector,
      options?.pollInterval,
      options?.waitTimeOut
    );
    return hadnler.start();
  }
  private constructor(
    private evaluateContext: Evaluable,
    private selector: string,
    private pollInterval: number = 100,
    private timeOut: number = 30000
  ) {
    super();
  }

  private startTime!: number;
  private async start() {
    this.startTime = Date.now();
    this.checkSelectorExistence();
    return super.wait();
  }

  private async checkSelectorExistence() {
    const result = await this.evaluateContext.evaluate((selector: string) => {
      const selectorResult = document.querySelectorAll(selector);
      if (selectorResult.length) {
        return true;
      } else {
        return false;
      }
    }, this.selector);

    if (result) {
      await this.resolve();
      return;
    }

    this.scheduleNextCheck();
  }

  private async resolve() {
    this.waiterResolver();
  }

  private scheduleNextCheck() {
    const passedTime = Date.now() - this.startTime;
    const remainToEnd = this.timeOut - passedTime;
    if (remainToEnd < 0) {
      this.waiterRejecter(
        new WaitforSelectorAppearTimeoutException(this.timeOut, this.selector)
      );
      return;
    }
    let timer: number;
    if (remainToEnd < this.pollInterval) {
      timer = this.pollInterval - remainToEnd;
    } else {
      timer = this.pollInterval;
    }
    setTimeout(() => this.checkSelectorExistence(), timer);
  }
}

import { EvaluateException } from '../../exceptions/evaluateException';
import WaitforSelectorAppearTimeoutException from '../../exceptions/waitForSelectorTimeoutException';
import { Runtime } from '../../types';
import { evaluationSctriptProvider } from '../helper';
import { WaitForSelectorOptions } from '../tab';
import BaseWaiterMixin from './baseWaiterMixin';

export default class WaitForSelectorAppearHandler extends BaseWaiterMixin {
  static async start(
    runtimeContext: Runtime,
    selector: string,
    options?: WaitForSelectorOptions
  ) {
    const hadnler = new WaitForSelectorAppearHandler(
      runtimeContext,
      selector,
      options?.pollInterval,
      options?.waitTimeOut
    );
    return hadnler.start();
  }
  private constructor(
    private runtimeContext: Runtime,
    private selector: string,
    private pollInterval: number = 100,
    private timeOut: number = 30000
  ) {
    super();
  }

  private startTime!: number;
  private async start() {
    await this.runtimeContext.enable();
    this.startTime = Date.now();
    this.checkSelectorExistence();
    return super.wait();
  }

  private async checkSelectorExistence() {
    const funcScript = evaluationSctriptProvider((selector: string) => {
      const selectorResult = document.querySelectorAll(selector);
      if (selectorResult.length) {
        return true;
      } else {
        return false;
      }
    }, this.selector);

    const result = await this.runtimeContext.evaluate({
      expression: funcScript.serialazedFunc,
      returnByValue: true,
      awaitPromise: false,
    });

    if (result.exceptionDetails) {
      throw new EvaluateException(result.exceptionDetails);
    }

    if (result.result.value === true) {
      await this.resolve();
      return;
    }

    this.scheduleNextCheck();
  }

  private async resolve() {
    await this.runtimeContext.disable();
    this.waiterResolver();
  }

  private scheduleNextCheck() {
    const passedTime = Date.now() - this.startTime;
    const remainToEnd = this.timeOut - passedTime;
    if (remainToEnd < 0) {
      throw new WaitforSelectorAppearTimeoutException(
        this.timeOut,
        this.selector
      );
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

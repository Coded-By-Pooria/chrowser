import WaitForSelector from '../../exceptions/waitForException';
import Evaluable from '../evaluable';
import { evaluationFunctionProvider } from '../helper';
import { TabEvaluateFunction } from '../tab';
import BasePollStateMixin from './basePollStateMixin';

export type WaiterSignalFunc = TabEvaluateFunction<
  any,
  boolean | Promise<boolean>
>;

export default class WaitUntilReturnTrue extends BasePollStateMixin {
  static start(
    signalFunc: WaiterSignalFunc,
    evaluateContext: Evaluable,
    pollInterval?: number,
    timeOut?: number,
    ...args: any[]
  ) {
    const handler = new WaitUntilReturnTrue(
      signalFunc,
      evaluateContext,
      pollInterval,
      timeOut,
      args
    );

    return handler.start();
  }

  private constructor(
    private signalFunc: WaiterSignalFunc,
    private evaluateContext: Evaluable,
    pollInterval: number = 100,
    timeOut: number = 30000,
    private args?: any[]
  ) {
    super(pollInterval, timeOut);
  }

  protected onTimeOut() {
    return new WaitForSelector(
      `Signal function doesn't return True value(even in implicit) for ${
        this.timeOut / 1000
      } seconds.(timeout)`
    );
  }
  protected async polling(): Promise<boolean> {
    if (this.args && this.args.length) {
      const result = await this.evaluateContext.evaluate(
        this.signalFunc,
        ...this.args
      );

      return !!result;
    } else {
      const func = evaluationFunctionProvider(this.signalFunc);
      const state = await this.evaluateContext.evaluate(
        `(async function(){const res = (${func})(); return !!res;})()`
      );

      return state;
    }
  }
}

import WaitForSelector from '../../exceptions/waitForException';
import Evaluable from '../evaluable';
import { evaluationFunctionProvider } from '../helper';
import { TabEvaluateFunction, TabEvaluationScriptType } from '../tab';
import BasePollStateMixin from './basePollStateMixin';

export default class WaitUntilReturnTrue extends BasePollStateMixin {
  static start(
    signalFunc: TabEvaluationScriptType,
    evaluateContext: Evaluable,
    pollInterval?: number,
    timeOut?: number
  ) {
    const handler = new WaitUntilReturnTrue(
      signalFunc,
      evaluateContext,
      pollInterval,
      timeOut
    );

    return handler.start();
  }

  private constructor(
    private signalFunc: TabEvaluationScriptType,
    private evaluateContext: Evaluable,
    pollInterval: number = 100,
    timeOut: number = 30000
  ) {
    super(pollInterval, timeOut);
  }

  protected onTimeOut() {
    throw new WaitForSelector(
      `Signal function doesn't return True value(even in implicit) for ${
        this.timeOut / 1000
      } seconds.(timeout)`
    );
  }
  protected async polling(): Promise<boolean> {
    const func = evaluationFunctionProvider(this.signalFunc);
    const state = await this.evaluateContext.evaluate(
      `(async function(){const res = (${func})(); return !!res;})()`
    );

    return state;
  }
}

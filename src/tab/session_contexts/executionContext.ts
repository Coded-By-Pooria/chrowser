import Protocol from 'devtools-protocol';
import CDP from 'chrome-remote-interface';
import { EvaluateException } from '../../exceptions/evaluateException';
import { evaluationFunctionProvider } from '../helper';
import RemoteNodeDelegator from '../js_delegator/remoteNodeDelegator';
import { TabEvaluateFunction } from '../tab';
import RemoteObjectDelegator from '../js_delegator/remoteObjectDelegator';

export default class ExecutionContext {
  constructor(private context: CDP.Client, private id: number) {}

  get executionContextId() {
    return this.id;
  }

  private async runExpression(
    script: string
  ): Promise<ReturnType<TabEvaluateFunction>> {
    const evalRes = await this.context.send('Runtime.evaluate', {
      expression: script,
      awaitPromise: true,
      returnByValue: true,
    });

    if (evalRes.exceptionDetails) {
      throw new EvaluateException(evalRes.exceptionDetails);
    }

    return evalRes.result;
  }

  private async runFunction(
    returnRemoteObject: boolean,
    func: TabEvaluateFunction,
    ...args: any[]
  ) {
    const serialazedFunc = evaluationFunctionProvider(func);

    const mappedArgs: Protocol.Runtime.CallArgument[] = args.length
      ? args.map<Protocol.Runtime.CallArgument>((a) => {
          if (a instanceof RemoteObjectDelegator) {
            return { objectId: a.id };
          }
          return { value: a };
        })
      : [];

    const result = await this.context.send('Runtime.callFunctionOn', {
      functionDeclaration: serialazedFunc,
      awaitPromise: true,
      returnByValue: !returnRemoteObject,
      executionContextId: this.executionContextId,
      arguments: mappedArgs,
    });

    if (result.exceptionDetails) {
      throw new EvaluateException(result.exceptionDetails);
    }

    return result.result;
  }

  private chechContext() {
    if (!Number.isInteger(this.executionContextId)) {
      throw new Error(
        'No execution context created. It happen with first navigation.'
      );
    }
  }

  async evaluate<T extends TabEvaluateFunction | string>(
    returnRemoteObject: boolean,
    script: T,
    ...args: any[]
  ): Promise<EvaledType<T>> {
    this.chechContext();
    let evaledRO: Protocol.Runtime.RemoteObject;

    if (typeof script === 'string') {
      evaledRO = await this.runExpression(script);
    } else {
      evaledRO = await this.runFunction(returnRemoteObject, script, ...args);
    }

    // To do : support unserializable (Jsonable) object handling
    return returnRemoteObject
      ? evaledRO.subtype == 'node'
        ? new RemoteNodeDelegator(this, evaledRO)
        : new RemoteObjectDelegator(evaledRO)
      : evaledRO.value!;
  }

  releaseRO(ro: RemoteNodeDelegator) {
    return this.context.send('Runtime.releaseObject', {
      objectId: ro.id,
    });
  }
}

type EvaledType<T extends TabEvaluateFunction | string> = T extends string
  ? any
  : Awaited<ReturnType<Exclude<T, string>>> extends infer X
  ? X extends Node
    ? RemoteNodeDelegator<X>
    : X extends (Node | null)[]
    ? (RemoteNodeDelegator<NonNullable<X[number]>> | null)[]
    : never
  : never;

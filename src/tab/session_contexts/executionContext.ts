import Protocol from 'devtools-protocol';
import { EvaluateException } from '../../exceptions/evaluateException';
import { evaluationFunctionProvider } from '../helper';
import RemoteNodeDelegator from '../js_delegator/remoteNodeDelegator';
import { TabEvaluateFunction, TabSessionZoneMaker } from '../tab';

export default class ExecutionContext {
  // private executionContextDescription?: Protocol.Runtime.ExecutionContextDescription;

  constructor(private context: TabSessionZoneMaker) {
    // context.sessionZone(async ({ Runtime }) => {
    //   return new Promise<void>((res) => {
    //     Runtime.on('executionContextCreated', (id) => {
    //       this.executionContextDescription = id.context;
    //       res();
    //     });
    //     Runtime.on('executionContextDestroyed', (destroyedContext) => {
    //       if (
    //         this.executionContextDescription?.id ===
    //         destroyedContext.executionContextId
    //       ) {
    //         this.executionContextDescription = undefined;
    //       }
    //       res();
    //     });
    //   });
    // });
  }

  // private get executionContextId() {
  //   if (!Number.isInteger(this.executionContextDescription?.id)) {
  //     throw new Error(
  //       'No execution context created. It happen with first navigation.'
  //     );
  //   }

  //   return this.executionContextDescription!.id;
  // }

  private runExpression(
    script: string
  ): Promise<ReturnType<TabEvaluateFunction>> {
    return this.context.sessionZone(async ({ Runtime }) => {
      await Runtime.enable();

      const evalRes = await Runtime.evaluate({
        expression: script,
        awaitPromise: true,
        returnByValue: true,
      });

      if (evalRes.exceptionDetails) {
        throw new EvaluateException(evalRes.exceptionDetails);
      }

      return evalRes.result;
    });
  }

  private _contextId?: number;
  setContextId(contextId: number) {
    this._contextId = contextId;
  }

  private get contextId() {
    if (Number.isInteger(this._contextId)) {
      return this._contextId!;
    }
    throw new Error('No context id exist. Maybe no navigation happened.');
  }

  private runFunction(
    returnRemoteObject: boolean,
    func: TabEvaluateFunction,
    ...args: any[]
  ) {
    return this.context.sessionZone(async ({ Runtime, Target }) => {
      await Runtime.enable();

      const t = await Target.getTargets();
      t.targetInfos[0].type === 'page';

      const serialazedFunc = evaluationFunctionProvider(func);

      const mappedArgs: Protocol.Runtime.CallArgument[] = args.length
        ? args.map<Protocol.Runtime.CallArgument>((a) => {
            if (a instanceof RemoteNodeDelegator) {
              return { objectId: a.objectId };
            }
            return { value: a };
          })
        : [];

      const result = await Runtime.callFunctionOn({
        functionDeclaration: serialazedFunc,
        awaitPromise: true,
        returnByValue: !returnRemoteObject,
        executionContextId: this.contextId,
        arguments: mappedArgs,
      });

      if (result.exceptionDetails) {
        throw new EvaluateException(result.exceptionDetails);
      }

      return result.result;
    });
  }

  // Todo: Change the cdp session architecture from session zone
  // to perminant session. that why we comment constructor body code
  // because the event listening ignored when session zone destroyed.

  async evaluate<T extends TabEvaluateFunction | string>(
    returnRemoteObject: boolean,
    script: T,
    ...args: any[]
  ): Promise<EvaledType<T>> {
    let evaledRO: Protocol.Runtime.RemoteObject;

    if (typeof script === 'string') {
      evaledRO = await this.runExpression(script);
    } else {
      evaledRO = await this.runFunction(returnRemoteObject, script, ...args);
    }

    // To do : support unserializable (Jsonable) object handling
    return evaledRO.subtype == 'node'
      ? new RemoteNodeDelegator(evaledRO, this)
      : evaledRO.value!;
  }

  releaseRO(ro: RemoteNodeDelegator) {
    return this.context.sessionZone(async ({ Runtime }) => {
      await Runtime.enable();
      return Runtime.releaseObject({ objectId: ro.objectId });
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

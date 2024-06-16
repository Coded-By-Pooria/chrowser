import Protocol from 'devtools-protocol';
import Evaluable from '../evaluable';
import { TabEvaluateFunction } from '../tab';
import { EvaluateException } from '../../exceptions/evaluateException';
import ExecutionContext from '../session_contexts/executionContext';

type QueryAllType<T extends TabEvaluateFunction | undefined = undefined> =
  T extends TabEvaluateFunction ? ReturnType<T>[] : RemoteNodeDelegator[];

export default class RemoteNodeDelegator<T extends Node = HTMLElement>
  implements Evaluable
{
  constructor(
    private remoteObj: Protocol.Runtime.RemoteObject,
    private context: ExecutionContext
  ) {}

  get objectId() {
    return this.remoteObj.objectId!;
  }

  evaluate(script: string | TabEvaluateFunction, ...args: any[]) {
    if (this.released) {
      throw new Error('Cannot eval on remote node which released before.');
    }
    const result = this.context.evaluate(true, script, args);

    return result;
  }
  async $(selector: string): Promise<RemoteNodeDelegator | null> {
    const evaluatedNode = await this.context.evaluate(
      true,
      function (base: HTMLElement, selector: string) {
        const queryResult = base.querySelector(selector);
        return queryResult;
      },
      this,
      selector
    );

    return evaluatedNode;
  }

  async #querySelectorAll<
    T extends TabEvaluateFunction | undefined = undefined
  >(selector: string, handler?: T): Promise<QueryAllType<T>> {
    const evaluatedNodesList = await this.context.evaluate(
      true,
      function (base: HTMLElement, selector: string) {
        const queryResult = base.querySelector(selector);
        return Array.of(queryResult);
      },
      this,
      selector
    );

    const nodeDelegators = [] as unknown as QueryAllType<T>;

    for (let index = 0; ; index++) {
      try {
        const delegator = await this.context.evaluate(
          true,
          function (nodesList: HTMLElement[], index: number) {
            if (index >= NodeList.length) {
              throw new Error('Out of bound');
            }
            return nodesList[index];
          },
          evaluatedNodesList,
          index
        );

        if (handler) {
          nodeDelegators.push(handler(delegator));
        } else {
          nodeDelegators.push(delegator);
        }
      } catch (err) {
        if (
          err instanceof EvaluateException &&
          err.message.includes('Out of bound')
        ) {
          break;
        }
        throw err;
      }
    }

    return nodeDelegators;
  }

  async $$(selector: string): Promise<RemoteNodeDelegator[]> {
    const evaluatedNodesList = await this.#querySelectorAll(selector);

    return evaluatedNodesList;
  }
  async $evaluate<T extends TabEvaluateFunction>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>> {
    const evaluatedNodesList = await this.$(selector);
    return await handler(evaluatedNodesList);
  }
  async $$evaluate<T extends TabEvaluateFunction>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>[]> {
    return await this.#querySelectorAll(selector, handler);
  }

  private released = false;

  release() {
    return this.context.releaseRO(this);
  }
}

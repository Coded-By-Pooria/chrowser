import Protocol from 'devtools-protocol';
import Evaluable from '../evaluable';
import { TabEvaluateFunction } from '../tab';
import { EvaluateException } from '../../exceptions/evaluateException';
import ExecutionContext from '../session_contexts/executionContext';
import RemoteObjectDelegator from './remoteObjectDelegator';
import { evaluationFunctionProvider } from '../helper';
import { randomBetween, randomSign } from '../../utils';
import MouseHandler from '../tabMouseHandler';

type QueryAllType<T extends TabEvaluateFunction | undefined = undefined> =
  T extends TabEvaluateFunction ? ReturnType<T>[] : RemoteNodeDelegator[];

export default class RemoteNodeDelegator<T extends Node = HTMLElement>
  extends RemoteObjectDelegator
  implements Evaluable
{
  constructor(
    private context: ExecutionContext,
    private mouseHandler: MouseHandler,
    ro: Protocol.Runtime.RemoteObject
  ) {
    super(ro);
  }

  evaluate(script: string | TabEvaluateFunction, ...args: any[]) {
    if (this.released) {
      throw new Error('Cannot eval on remote node which released before.');
    }
    const result = this.context.evaluate(false, script, ...args);

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

  async click(withMouse?: boolean): Promise<void> {
    if (!withMouse) {
      await this.evaluate(function (node) {
        node.click();
      }, this);
      return;
    }

    const position = await this.evaluate(function (node: HTMLElement) {
      const { width, height, top, left } = node.getBoundingClientRect();
      return { width, height, top, left };
    }, this);

    if (
      !(
        isFinite(position.width) &&
        isFinite(position.height) &&
        isFinite(position.top) &&
        isFinite(position.left)
      )
    ) {
      throw new Error('Cannot calculate nodes position.');
    }
    const x =
      position.left +
      position.width / 2 +
      randomBetween(position.width / 1000, position.width / 100) * randomSign();

    const y =
      position.top +
      position.height / 2 +
      randomBetween(position.height / 1000, position.height / 100) *
        randomSign();

    this.mouseHandler.click({ x, y });
  }

  async #querySelectorAll<
    T extends TabEvaluateFunction | undefined = undefined
  >(selector: string, handler?: T): Promise<QueryAllType<T>> {
    const evaluatedNodesList = await this.context.evaluate(
      true,
      function (base: HTMLElement, selector: string) {
        const queryResult = base.querySelectorAll(selector);
        return Array.from(queryResult);
      },
      this,
      selector
    );

    const nodeDelegators = [] as unknown as QueryAllType<T>;
    const nodeListLength = Number.parseInt(
      /\d+/g.exec(
        (evaluatedNodesList as never as RemoteObjectDelegator).description!
      )![0]
    );

    for (let index = 0; index < nodeListLength; index++) {
      try {
        const delegator = await this.context.evaluate(
          true,
          function (nodesList: HTMLElement[], index: number) {
            if (index >= nodesList.length) {
              throw new Error(
                `Out of bound - access ${index} of ${nodesList.length}`
              );
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
  async $evaluate<T extends TabEvaluateFunction<HTMLElement>>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>> {
    const serializedHandler = evaluationFunctionProvider(handler);
    const func = `(function e(){const result = document.querySelector('${selector}'); return (${serializedHandler})(result); })()`;

    return await this.evaluate(func);
  }
  async $$evaluate<T extends TabEvaluateFunction<HTMLElement[]>>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>> {
    const serializedHandler = evaluationFunctionProvider(handler);
    const func = `(function e(){const results = Array.from(document.querySelectorAll('${selector}')); return (${serializedHandler})(results); })()`;

    return await this.evaluate(func);
  }

  private released = false;

  release() {
    return this.context.releaseRO(this);
  }
}

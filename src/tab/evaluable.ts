import Protocol from 'devtools-protocol';
import RemoteNodeDelegator from './js_delegator/remoteNodeDelegator';
import { TabEvaluateFunction } from './tab';

export default interface Evaluable {
  evaluate<T extends TabEvaluateFunction>(
    script: T | string,
    ...args: any[]
  ): Promise<Awaited<ReturnType<T>>>;
  /**
   * Perform document.querySelector(*selector*) and return js-delegator object to handle matched queried elemnt.
   * @param selector Css felector for quering
   */
  $(selector: string): Promise<RemoteNodeDelegator | null>;
  /**
   * Perform Array.from(document.querySelectorAll(*selector*)) and return js-delegator objects to handle matched queried elemnts.
   * @param selector Css felector for quering
   */
  $$(selector: string): Promise<RemoteNodeDelegator[]>;
  /**
   * Perform document.querySelector(*selector*) and pass the matched JsDelegator to second handler function parameter.
   * @param selector Css felector for quering
   * @param handler Function to work with queried elements
   */
  $evaluate<T extends TabEvaluateFunction<HTMLElement>>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>>;
  /**
   * Perform Array.from(document.querySelectorAll(*selector*)) and pass the matched JsDelegator to second handler function parameter.
   * @param selector Css felector for quering
   * @param handler Function to work with queried elements
   */
  $$evaluate<T extends TabEvaluateFunction<HTMLElement[]>>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>[]>;
}

export class BaseEvaluable implements Evaluable {
  evaluate(script: string | TabEvaluateFunction, ...args: any[]): Promise<any> {
    throw new Error('Method not implemented.');
  }
  $(selector: string): Promise<RemoteNodeDelegator> {
    throw new Error('Method not implemented.');
  }
  $$(selector: string): Promise<RemoteNodeDelegator[]> {
    throw new Error('Method not implemented.');
  }
  $evaluate<T extends TabEvaluateFunction>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>> {
    throw new Error('Method not implemented.');
  }
  $$evaluate<T extends TabEvaluateFunction>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>[]> {
    throw new Error('Method not implemented.');
  }
}

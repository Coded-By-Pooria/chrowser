import NavigationException from '../exceptions/navigationException';
import { Page, Runtime } from '../types';
import Evaluable from './evaluable';
import ExecutionContext from './session_contexts/executionContext';
import RemoteNodeDelegator from './js_delegator/remoteNodeDelegator';
import { TabEvaluateFunction } from './tab';
import TabNavigationOptions from './tabNavigationOptions';
import PageContext from './session_contexts/pageContext';

export default class Frame implements Evaluable {
  constructor(
    private pageConext: PageContext,
    private context: ExecutionContext
  ) {}

  private framesDoc?: RemoteNodeDelegator<Document>;

  private executionContextId?: number;

  private async document() {
    if (!Number.isInteger(this.executionContextId)) {
      throw new Error(
        'No execution context created. It happen with first navigation.'
      );
    }
    return (this.framesDoc ??= await this.context.evaluate(
      true,
      function evalDoc() {
        return document;
      }
    ));
  }

  async navigate(
    navOptions: TabNavigationOptions,
    runtimeContext: Runtime,
    pageContext: Page
  ) {
    await pageContext.enable();
    await runtimeContext.enable();

    const runtimeContextIdWaiter = new Promise<number>((res) => {
      runtimeContext.on('executionContextCreated', (context) => {
        res(context.context.id);
      });
    });

    const navigateResult = await pageContext.navigate(navOptions);
    const executionContext = await runtimeContext.executionContextCreated();
    this.context.setContextId(executionContext.context.id);

    if (navigateResult.errorText?.trim()) {
      throw new NavigationException(navigateResult.errorText);
    }

    this.executionContextId = await runtimeContextIdWaiter;

    console.log(this.executionContextId, navigateResult.frameId);

    const waitUntilOpt = navOptions.waitUntil;

    switch (waitUntilOpt) {
      case 'documentloaded':
        {
          await pageContext.domContentEventFired();
        }
        break;
      case 'load':
        {
          await pageContext.loadEventFired();
        }
        break;
    }
    this.frameId ??= navigateResult.frameId;
  }

  private frameId!: string;

  async evaluate<T extends TabEvaluateFunction>(
    script: string | T,
    ...args: any[]
  ): Promise<Awaited<ReturnType<T>>> {
    const doc = await this.document();
    return doc.evaluate(script, args);
  }
  async $(selector: string): Promise<RemoteNodeDelegator<HTMLElement> | null> {
    const doc = await this.document();
    return doc.$(selector);
  }
  async $$(selector: string): Promise<RemoteNodeDelegator<HTMLElement>[]> {
    const doc = await this.document();
    return doc.$$(selector);
  }
  async $evaluate<
    T extends TabEvaluateFunction<RemoteNodeDelegator<HTMLElement>>
  >(selector: string, handler: T): Promise<ReturnType<T>> {
    const doc = await this.document();
    return doc.$evaluate(selector, handler);
  }
  async $$evaluate<
    T extends TabEvaluateFunction<RemoteNodeDelegator<HTMLElement>[]>
  >(selector: string, handler: T): Promise<ReturnType<T>[]> {
    const doc = await this.document();
    return doc.$$evaluate(selector, handler);
  }

  private released = false;
  release() {
    this.released = true;
    return this.framesDoc?.release();
  }
}

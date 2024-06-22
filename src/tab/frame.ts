import Protocol from 'devtools-protocol';
import CDP from 'chrome-remote-interface';
import NavigationException from '../exceptions/navigationException';
import Evaluable from './evaluable';
import ExecutionContext from './session_contexts/executionContext';
import RemoteNodeDelegator from './js_delegator/remoteNodeDelegator';
import Tab, {
  TabEvaluateFunction,
  PollWaitForOptions,
  WaitUntilNetworkIdleOptions,
} from './tab';
import TabNavigationOptions from './tabNavigationOptions';
import WaitForSelectorAppearHandler from './tab_functionality/waitForSelectorAppearHandler';
import WaitUntilNetworkIdleHandler from './tab_functionality/waitUntilNetworkIdle';
import { evaluationFunctionProvider } from './helper';
import WaitUntilReturnTrue from './tab_functionality/waitUntilReturnTrue';
import { Waiter } from '../utils';
import MouseHandler from './tabMouseHandler';

enum FrameNavigationState {
  NONE,
  REQUESTED_FOR_NAVIGATION,
  NAVIGATE_FIRED,
  NAVIGATE_DOC_EVENT,
  NAVIGATE_LOAD_EVENT,
}

export interface NodeROCreator {
  createRO(ro: Protocol.Runtime.RemoteObject): RemoteNodeDelegator;
}

export default class Frame implements Evaluable, NodeROCreator {
  private frameNavigationWaitUntil: 'documentloaded' | 'load' =
    'documentloaded';
  private navigationWaiter?: Waiter;
  constructor(private context: CDP.Client, private tab: Tab) {
    context.on('Page.frameNavigated', (p) => {
      if (p.frame.id === this.frameId && p.type === 'Navigation') {
        this.#executionContext = this.framesDoc = undefined;
      }
    });

    context.on('Page.frameRequestedNavigation', (p) => {
      if (p.frameId === this.frameId) {
        this.framesDoc = this.#executionContext = undefined;
        this.navigationWaiter = Waiter.start();
      }
    });

    context.on('Page.domContentEventFired', (_) => {
      if (
        this.frameNavigationWaitUntil == 'documentloaded' &&
        this.navigationWaiter
      ) {
        this.navigationWaiter.complete();
      }
    });
    context.on('Page.domContentEventFired', (_) => {
      if (this.frameNavigationWaitUntil == 'load' && this.navigationWaiter) {
        this.navigationWaiter.complete();
      }
    });

    context.on('Runtime.executionContextDestroyed', (p) => {
      if (p.executionContextId === this.#executionContext?.executionContextId) {
        this.#executionContext = undefined;
      }
    });

    context.on('Runtime.executionContextsCleared', () => {
      this.#executionContext = undefined;
    });

    context.Runtime.on(
      'executionContextCreated',
      this.contextCreationHandler.bind(this)
    );
  }

  private async waitForNavigationComplete() {
    if (this.navigationWaiter) {
      await this.navigationWaiter;
      this.navigationWaiter = undefined;
    }
  }

  #executionContext?: ExecutionContext;

  private executionContextWaiterResolver?: () => any;
  private contextCreationHandler(
    contextInfo: Protocol.Runtime.ExecutionContextCreatedEvent
  ) {
    const aux = contextInfo.context.auxData as
      | {
          isDefault: boolean;
          type: 'default' | 'isolated' | 'worker';
          frameId: string;
        }
      | undefined;

    if (aux && aux.isDefault && aux.frameId === this.frameId) {
      this.#executionContext = new ExecutionContext(
        this.context,
        this,
        contextInfo.context.id
      );
      this.executionContextWaiterResolver?.();
    }
  }

  private _mouseHandler?: MouseHandler;
  get mouseHandler() {
    return (this._mouseHandler ??= new MouseHandler(this.context.Input));
  }

  createRO(ro: Protocol.Runtime.RemoteObject): RemoteNodeDelegator {
    return new RemoteNodeDelegator(
      this.executionContext,
      this.mouseHandler,
      ro
    );
  }

  private framesDoc?: RemoteNodeDelegator<Document>;

  async addScriptToRunOnNewDocument(script: string | TabEvaluateFunction) {
    const serialazedFunc = evaluationFunctionProvider(script);
    await this.context.send('Page.addScriptToEvaluateOnNewDocument', {
      source: serialazedFunc,
    });

    return;
  }

  async waitForSelectorAppear(selector: string, options?: PollWaitForOptions) {
    return WaitForSelectorAppearHandler.start(this, selector, options);
  }

  async waitUntilNetworkIdle(
    options: WaitUntilNetworkIdleOptions = { idleInterval: 500, idleNumber: 0 }
  ) {
    return WaitUntilNetworkIdleHandler.start(this.context.Network, options);
  }

  async waitUntilReturnTrue(
    script: string | TabEvaluateFunction,
    options?: PollWaitForOptions
  ) {
    return WaitUntilReturnTrue.start(
      script,
      this,
      options?.pollInterval,
      options?.waitTimeOut
    );
  }

  private get executionContext() {
    if (!this.#executionContext) {
      throw new Error(
        'No execution context exists. Maybe no navigation happened.'
      );
    }
    return this.#executionContext;
  }

  waitForContext() {
    return new Promise<void>((res) => {
      this.executionContextWaiterResolver = res;
    });
  }

  private async document() {
    await this.waitForNavigationComplete();
    if (!this.#executionContext) {
      await this.waitForContext();
    }
    return (this.framesDoc ??= await this.executionContext.evaluate(
      true,
      function evalDoc() {
        return document;
      }
    ));
  }

  async navigate(navOptions: TabNavigationOptions) {
    const pageContext = this.context.Page;

    const navigateResult = await pageContext.navigate(navOptions);
    this.#executionContext = this.framesDoc = undefined;

    if (this.frameId !== navigateResult.frameId) {
      this.frameId = navigateResult.frameId;
    }

    if (navigateResult.errorText?.trim()) {
      throw new NavigationException(navigateResult.errorText);
    }

    const waitUntilOpt = navOptions.waitUntil ?? 'documentloaded';

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
  }

  private frameId!: string;

  async evaluate<T extends TabEvaluateFunction>(
    script: string | T,
    ...args: any[]
  ): Promise<Awaited<ReturnType<T>>> {
    const doc = await this.document();
    return doc.evaluate(script, ...args);
  }
  async $(selector: string): Promise<RemoteNodeDelegator<HTMLElement> | null> {
    const doc = await this.document();
    return doc.$(selector);
  }
  async $$(selector: string): Promise<RemoteNodeDelegator<HTMLElement>[]> {
    const doc = await this.document();
    return doc.$$(selector);
  }
  async $evaluate<T extends TabEvaluateFunction<HTMLElement>>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>> {
    const doc = await this.document();
    return doc.$evaluate(selector, handler);
  }
  async $$evaluate<T extends TabEvaluateFunction<HTMLElement[]>>(
    selector: string,
    handler: T
  ): Promise<ReturnType<T>> {
    const doc = await this.document();
    return doc.$$evaluate(selector, handler);
  }

  private released = false;
  release() {
    this.released = true;
    return this.framesDoc?.release();
  }
}

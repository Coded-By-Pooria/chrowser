import Protocol from 'devtools-protocol';
import CDP from 'chrome-remote-interface';
import Notifier, {
  BaseNotifier,
  EventDataType,
  ListenCallback,
  Listener,
} from '@pourianof/notifier';
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
import { serializeFunctionWithSerializableArgs } from './helper';
import WaitUntilReturnTrue, {
  type WaiterSignalFunc,
} from './tab_functionality/waitUntilReturnTrue';
import MouseHandler from './tabMouseHandler';
import KeyboardHandler from './tabKeyboardHandler';
import FrameNavigationHandler, {
  Navigatable,
  NavigationEvents,
  WaitForPossibleNavigationOptions,
} from './frameNavigationHandler';

export interface NodeROCreator {
  createRO(ro: Protocol.Runtime.RemoteObject): RemoteNodeDelegator;
}

export type FrameEvents = NavigationEvents;

export interface FrameBase
  extends Evaluable,
    BaseNotifier<FrameEvents>,
    Navigatable {
  navigate(options: TabNavigationOptions): Promise<void>;
  waitForSelectorAppear(
    selector: string,
    options?: PollWaitForOptions
  ): Promise<void>;
  reload(): Promise<void>;
  waitUntilReturnTrue(
    script: WaiterSignalFunc,
    options?: PollWaitForOptions,
    ...args: any[]
  ): Promise<void>;
  addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction,
    ...args: any[]
  ): Promise<string>;
  waitUntilNetworkIdle(options: WaitUntilNetworkIdleOptions): Promise<void>;
}

export default class Frame
  extends Notifier<FrameEvents>
  implements Evaluable, NodeROCreator, FrameBase
{
  constructor(private context: CDP.Client, private tab: Tab) {
    super();
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
  waitForPossibleNavigation(
    options?: WaitForPossibleNavigationOptions
  ): Promise<void> {
    return this.navigationHandler.waitForPossibleNavigation(options);
  }

  private _navigationHandler!: FrameNavigationHandler;

  get navigationHandler() {
    if (!this._navigationHandler) {
      this._navigationHandler = new FrameNavigationHandler(
        this.context,
        this.frameId
      );

      this._navigationHandler.addListener('NavigateRequest', (d) => {
        d.data.whenComplete().then(() => {
          this.framesDoc = undefined;
        });
      });
    }

    return this._navigationHandler;
  }

  addListener<E extends 'NavigateRequest'>(
    eventName: E,
    data: ListenCallback<E, EventDataType<FrameEvents, E>>
  ): Listener {
    return this.navigationHandler.addListener(eventName, data);
  }

  reload(): Promise<void> {
    return this.context.Page.reload();
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

  private _keyboardHandler?: KeyboardHandler;
  get keyboardHandler() {
    return (this._keyboardHandler ??= new KeyboardHandler(this.context.Input));
  }

  createRO(ro: Protocol.Runtime.RemoteObject): RemoteNodeDelegator {
    return new RemoteNodeDelegator(
      this.executionContext,
      this.mouseHandler,
      ro
    );
  }

  private framesDoc?: RemoteNodeDelegator<Document>;

  async addScriptToRunOnNewDocument(
    script: string | TabEvaluateFunction,
    ...args: any[]
  ) {
    const serialazedFunc = serializeFunctionWithSerializableArgs(
      script,
      ...args
    );

    const result = await this.context.send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source: serialazedFunc,
      }
    );

    return result.identifier;
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
    script: WaiterSignalFunc,
    options?: PollWaitForOptions,
    ...args: any[]
  ) {
    return WaitUntilReturnTrue.start(
      script,
      this,
      options?.pollInterval,
      options?.waitTimeOut,
      ...args
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
    await this.navigationHandler.waitForNavigationComplete();
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

  private async evaluateFrameId() {
    const frame = await this.context.Page.getFrameTree();
    this.frameId = frame.frameTree.frame.id;
  }

  async navigate(navOptions: TabNavigationOptions) {
    if (!this.frameId) {
      await this.evaluateFrameId();
    }
    return this.navigationHandler.navigate(navOptions);
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

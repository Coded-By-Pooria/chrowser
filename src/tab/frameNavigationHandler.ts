import Protocol from 'devtools-protocol';
import { Client } from 'chrome-remote-interface';
import Notifier from '@pourianof/notifier';
import TabNavigationOptions from './tabNavigationOptions';
import NavigationException from '../exceptions/navigationException';
import { Waiter } from '../utils/waiters';
import BasePollStateMixin from './tab_functionality/basePollStateMixin';
import TimeoutException from '../exceptions/timeoutException';

export interface WaitForPossibleNavigationOptions {
  waitFor?: number;
}

export interface Navigatable {
  navigate(options: TabNavigationOptions): Promise<void>;
  /**
   *  This method waits for a possible navigation which may happen. Notice that only inner document type navigations
   *  are counts and not the navigations which occurred by "navigate" method.
   *
   *  Hint: This mehod may not needed. Because if some navigation happend the context will remove and when you wanna
   *  work with `Evaluable` methods, then wait for new context to be create and then run those methods.
   * @param options Specify how much time should wait for new navigation. After that a timeout error will be thrown
   */
  waitForPossibleNavigation(
    options?: WaitForPossibleNavigationOptions
  ): Promise<void>;
}

export type NavigationType = 'NavigationMethod' | 'DocumentInnerAction';
export interface NavigationFinishState {
  state: NavigationState;
  url: string;
  type: NavigationType;
}

export interface NavigationObj {
  isDone: boolean;

  isCanceled: boolean;

  isFinished: boolean;

  navigationType: NavigationType;

  whenComplete(): Promise<NavigationFinishState>;
  whenDocumentLoaded(): Promise<void>;
}

export type NavigationEvents = {
  NavigateRequest: NavigationObj;
};

export interface LastActiveNavigationProvider {
  getLastActiveNavigation(): Navigation | undefined;
}

class WaitForPossibleNavigation extends BasePollStateMixin {
  protected onTimeOut(): Error {
    return new TimeoutException(this.timeOut);
  }
  protected async polling(): Promise<boolean> {
    const newLast = this.navigatorContext.getLastActiveNavigation();
    if (
      newLast &&
      this.lastNav != newLast &&
      newLast!.navigationType == 'DocumentInnerAction'
    ) {
      return true;
    }
    return false;
  }
  static start(
    options: Required<WaitForPossibleNavigationOptions> & {
      pollInterval: number;
      navigationContext: LastActiveNavigationProvider;
    }
  ) {
    const waiter = new WaitForPossibleNavigation(
      options.pollInterval,
      options.waitFor,
      options.navigationContext
    );

    return waiter;
  }

  private lastNav?: Navigation;

  private constructor(
    pollInterval: number,
    timeout: number,
    private navigatorContext: LastActiveNavigationProvider
  ) {
    super(pollInterval, timeout);
    this.lastNav = navigatorContext.getLastActiveNavigation();
  }
}

export default class FrameNavigationHandler
  extends Notifier<NavigationEvents>
  implements Navigatable, LastActiveNavigationProvider
{
  private frameNavigationWaitUntil: 'documentloaded' | 'load' =
    'documentloaded';

  constructor(private context: Client, private frameId: string) {
    super();
    this.init();
  }

  private lastActiveNavigation?: Navigation;
  getLastActiveNavigation() {
    return this.lastActiveNavigation;
  }

  async waitForPossibleNavigation(
    options: WaitForPossibleNavigationOptions = { waitFor: 100 }
  ): Promise<void> {
    if (this.lastActiveNavigation) {
      // We assume the inner document navigation happen only if document has been loaded .
      if (this.lastActiveNavigation.navigationType == 'NavigationMethod') {
        // wait for new innerDocumentNavigation happen
        const waiter = WaitForPossibleNavigation.start({
          pollInterval: 10,
          waitFor: options.waitFor ?? 100,
          navigationContext: this,
        });
        await waiter;
      } else {
        // the last navigation is caused by inner document operations but its document has not loaded,
        // wait for navigation document get load
        await this.lastActiveNavigation.whenDocumentLoaded();
      }
    }

    return;
  }

  private init() {
    this.context.on('Page.frameRequestedNavigation', this.newNavigationHandler); // render-initiated navigations handler
    this.context.on('Page.frameNavigated', this.navigationDoneHandler);
    this.context.on('Page.domContentEventFired', this.onDocumentEvent);
  }

  private navigateMethodDocumentLoadWaiter?: Waiter;

  private onDocumentEvent = () => {
    if (
      this.frameNavigationWaitUntil == 'documentloaded' &&
      this.lastActiveNavigation
    ) {
      this.lastActiveNavigation?.documentLoaded();
    }
  };

  private newNavigationDispatch(url: string, type: NavigationType) {
    if (this.lastActiveNavigation) {
      // forget the last navigation if it doesn't got finished
      this.lastActiveNavigation.forget();
    }

    this.lastActiveNavigation = Navigation.run(url, type);
    this.trigger('NavigateRequest', this.lastActiveNavigation!);
  }

  private newNavigationHandler = (
    navData: Protocol.Page.FrameRequestedNavigationEvent
  ) => {
    if (navData.frameId === this.frameId) {
      this.newNavigationDispatch(navData.url, 'DocumentInnerAction');
    }
  };

  async waitForNavigationComplete() {
    await this.lastActiveNavigation?.whenDocumentLoaded();
  }

  async navigate(options: TabNavigationOptions) {
    // TODO : Fix when navigate to same url and just
    const pageContext = this.context.Page;

    this.newNavigationDispatch(options.url, 'NavigationMethod');

    const navigateResult = await pageContext.navigate(options);
    this.lastActiveNavigation?.done();

    if (this.frameId !== navigateResult.frameId) {
      this.frameId = navigateResult.frameId;
    }

    if (navigateResult.errorText?.trim()) {
      throw new NavigationException(navigateResult.errorText);
    }

    const waitUntilOpt = options.waitUntil ?? 'documentloaded';

    switch (waitUntilOpt) {
      case 'documentloaded':
        {
          await this.lastActiveNavigation!.whenDocumentLoaded();
        }
        break;
      case 'load':
        {
          await pageContext.loadEventFired();
        }
        break;
    }
  }

  private navigationDoneHandler = (
    navData: Protocol.Page.FrameNavigatedEvent
  ) => {
    if (
      navData.frame.id == this.frameId &&
      this.lastActiveNavigation &&
      !this.lastActiveNavigation.isFinished &&
      this.lastActiveNavigation.navigationType == 'DocumentInnerAction'
    ) {
      this.lastActiveNavigation.done();
    }
  };
}

export enum NavigationState {
  DONE,
  CANCELED,
  NOT_COMPLETED,
  DOCUMENT_LOADED,
  FORGOTTED, // When frame navigate to new one.
}

class Navigation implements NavigationObj {
  private state = NavigationState.NOT_COMPLETED;
  static run(url: string, type: NavigationType) {
    return new Navigation(url, type);
  }

  private constructor(private url: string, private type: NavigationType) {}

  get isDone() {
    return this.state === NavigationState.DONE;
  }

  get isCanceled() {
    return this.state === NavigationState.CANCELED;
  }

  get isDocumentLoaded() {
    return this.state === NavigationState.DOCUMENT_LOADED;
  }

  get isFinished() {
    return this.isDocumentLoaded || this.isDone || this.isCanceled;
  }

  get navigationType() {
    return this.type;
  }

  private completionWaiter = Waiter.start();
  private documentLoadingWaiter = Waiter.start();

  private completeNavigation() {
    this.completionWaiter.complete();
  }

  async whenComplete() {
    if (this.isFinished) {
      return {
        state: this.state,
        url: this.url,
        type: this.type,
      };
    }

    await this.completionWaiter;

    return {
      state: this.state,
      url: this.url,
      type: this.type,
    };
  }

  done() {
    if (this.isFinished) {
      throw new Error('Cannot done a finished navigation.');
    }

    this.state = NavigationState.DONE;
    this.completeNavigation();
  }

  cancel() {
    if (this.isFinished) {
      throw new Error('Cannot cancel a finished navigation.');
    }

    this.state = NavigationState.CANCELED;
    this.completeNavigation();
    if (!this.isDocumentLoaded) {
      this.documentLoadingWaiter.complete(
        new Error('Navigation canceled before document get loaded.')
      );
    }
  }

  async whenDocumentLoaded() {
    if (this.isDocumentLoaded) {
      return;
    }
    await this.documentLoadingWaiter;
  }

  documentLoaded() {
    this.state = NavigationState.DOCUMENT_LOADED;
    this.documentLoadingWaiter.complete();
  }

  forget() {
    if (!this.isDocumentLoaded) {
      this.documentLoadingWaiter.complete();
    } else if (!this.isFinished) {
      this.cancel();
    }
  }
}

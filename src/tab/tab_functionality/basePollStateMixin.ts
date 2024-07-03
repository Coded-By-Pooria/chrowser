import BaseWaiterMixin from './baseWaiterMixin';

export default abstract class BasePollStateMixin extends BaseWaiterMixin {
  constructor(protected pollInterval: number, protected timeOut: number) {
    super();
  }

  private startTime!: number;
  protected async start() {
    this.startTime = Date.now();
    this.poll();
    return super.wait();
  }

  private async poll() {
    const result = await this.polling();
    if (result) {
      this.waiterResolver();
    } else {
      this.scheduleNextPoll();
    }
  }

  private scheduleNextPoll() {
    const passedTime = Date.now() - this.startTime;
    const remainToEnd = this.timeOut - passedTime;
    if (remainToEnd < 0) {
      const err = this.onTimeOut();
      this.waiterRejecter(err);
      return;
    }
    let timer: number;
    if (remainToEnd < this.pollInterval) {
      timer = this.pollInterval - remainToEnd;
    } else {
      timer = this.pollInterval;
    }
    setTimeout(() => this.poll(), timer);
  }

  protected abstract onTimeOut(): Error;

  protected abstract polling(): Promise<boolean>;
}

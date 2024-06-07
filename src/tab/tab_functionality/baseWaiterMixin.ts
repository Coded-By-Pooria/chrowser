export default class BaseWaiterMixin {
  protected waiterResolver!: () => void;
  protected waiterRejecter!: (reason?: any) => void;

  protected async wait() {
    return new Promise<void>((res, rej) => {
      this.waiterResolver = res;
      this.waiterRejecter = rej;
    });
  }
}

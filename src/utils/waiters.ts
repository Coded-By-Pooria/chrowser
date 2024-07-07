export class Waiter {
  static start() {
    const waiter = new Waiter();
    waiter.start();
    return waiter;
  }
  private constructor() {}

  private waiterResolver!: () => any;
  private waiterRejecter!: (err: any) => any;
  private waiterPromise!: Promise<void>;
  private start() {
    this.waiterPromise = new Promise<void>((res, rej) => {
      this.waiterResolver = res;
      this.waiterRejecter = rej;
    });
  }

  complete(err?: any) {
    if (typeof err != 'undefined') {
      this.waiterRejecter(err);
    } else {
      this.waiterResolver();
    }
  }

  async then(callback: () => any) {
    await this.waiterPromise;
    return callback();
  }
}

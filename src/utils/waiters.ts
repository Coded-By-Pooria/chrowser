export class Waiter {
  static start() {
    const waiter = new Waiter();
    waiter.start();
    return waiter;
  }
  private constructor() {}

  private waiterResolver!: () => any;
  private waiterPromise!: Promise<void>;
  private start() {
    this.waiterPromise = new Promise<void>((res, _) => {
      this.waiterResolver = res;
    });
  }

  complete() {
    this.waiterResolver();
  }

  async then(callback: () => any) {
    await this.waiterPromise;
    return callback();
  }
}

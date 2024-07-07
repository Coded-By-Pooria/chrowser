export default class TimeoutException extends Error {
  constructor(protected timeout: number, msg?: string) {
    super(msg ?? `Process timeouted after ${timeout} miliseconds`);
  }
}

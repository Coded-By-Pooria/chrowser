export default class WaitforSelectorAppearTimeoutException extends Error {
  constructor(timeout: number, selector: string) {
    super(
      `Waiting for "${selector}" selector for "${timeout}" miliseconds has timedout.`
    );
  }
}

import Protocol from 'devtools-protocol';
import { CallSite } from './callSite';

export class EvaluateException extends Error {
  static mapToCallSite(stack: Protocol.Runtime.StackTrace) {
    return stack.callFrames.map<NodeJS.CallSite>((s) => {
      return new CallSite(
        undefined,
        '',
        undefined,
        s.functionName,
        null,
        undefined,
        s.lineNumber,
        s.columnNumber,
        s.url,
        s.scriptId
      );
    });
  }
  constructor(private error: Protocol.Runtime.ExceptionDetails) {
    super(error.text);
  }

  printEvalStackTrace() {
    if (!this.error.stackTrace) {
      return undefined;
    }
    const callStack = EvaluateException.mapToCallSite(this.error.stackTrace);
    return Error.prepareStackTrace?.(this, callStack);
  }
}

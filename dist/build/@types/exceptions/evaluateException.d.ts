/// <reference types="node" />
import Protocol from 'devtools-protocol';
export declare class EvaluateException extends Error {
    private error;
    static mapToCallSite(stack: Protocol.Runtime.StackTrace): NodeJS.CallSite[];
    constructor(error: Protocol.Runtime.ExceptionDetails);
    printEvalStackTrace(): any;
}

/// <reference types="node" />
export declare class CallSite implements NodeJS.CallSite {
    private _this;
    private typeName;
    private func;
    private functionName;
    private methodName;
    private fileName;
    private lineNumber;
    private columnNumber;
    private sourceURL;
    private scriptHash;
    private evalOrigion;
    private isEvalInvokation;
    constructor(_this: unknown, typeName: string, func: Function | undefined, functionName?: string | null, methodName?: string | null, fileName?: string | undefined, lineNumber?: number | null, columnNumber?: number | null, sourceURL?: string, scriptHash?: string, evalOrigion?: string | undefined, isEvalInvokation?: boolean);
    getThis(): unknown;
    getTypeName(): string | null;
    getFunction(): Function | undefined;
    getFunctionName(): string | null;
    getMethodName(): string | null;
    getFileName(): string | undefined;
    getLineNumber(): number | null;
    getColumnNumber(): number | null;
    getEvalOrigin(): string | undefined;
    isToplevel(): boolean;
    isEval(): boolean;
    isNative(): boolean;
    isConstructor(): boolean;
    isAsync(): boolean;
    isPromiseAll(): boolean;
    getPromiseIndex(): number | null;
    getScriptNameOrSourceURL(): string;
    getScriptHash(): string;
    getEnclosingColumnNumber(): number;
    getEnclosingLineNumber(): number;
    getPosition(): number;
    toString(): string;
}

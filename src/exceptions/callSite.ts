export class CallSite implements NodeJS.CallSite {
  constructor(
    private _this: unknown,
    private typeName: string,
    private func: Function | undefined,
    private functionName: string | null = null,
    private methodName: string | null = null,
    private fileName: string | undefined = undefined,
    private lineNumber: number | null = null,
    private columnNumber: number | null = null,
    private sourceURL: string = '',
    private scriptHash: string = '',
    private evalOrigion: string | undefined = undefined,
    private isEvalInvokation: boolean = false
  ) {}
  getThis(): unknown {
    return this._this;
  }
  getTypeName(): string | null {
    return this.typeName;
  }
  getFunction(): Function | undefined {
    return this.func;
  }
  getFunctionName(): string | null {
    return this.functionName;
  }
  getMethodName(): string | null {
    return this.methodName;
  }
  getFileName(): string | undefined {
    return this.fileName;
  }
  getLineNumber(): number | null {
    return this.lineNumber;
  }
  getColumnNumber(): number | null {
    return this.columnNumber;
  }
  getEvalOrigin(): string | undefined {
    return this.evalOrigion;
  }
  isToplevel(): boolean {
    return this._this === global;
  }
  isEval(): boolean {
    return this.isEvalInvokation;
  }
  isNative(): boolean {
    return false;
  }
  isConstructor(): boolean {
    return false;
  }
  isAsync(): boolean {
    return false;
  }
  isPromiseAll(): boolean {
    return false;
  }
  getPromiseIndex(): number | null {
    return -1;
  }
  getScriptNameOrSourceURL(): string {
    return this.sourceURL;
  }
  getScriptHash(): string {
    return this.scriptHash;
  }
  getEnclosingColumnNumber(): number {
    return this.columnNumber ?? -1;
  }
  getEnclosingLineNumber(): number {
    return this.lineNumber ?? -1;
  }
  getPosition(): number {
    return -1;
  }
  toString(): string {
    return `at ${this.functionName} - line ${this.lineNumber} on column ${this.columnNumber}`;
  }
}

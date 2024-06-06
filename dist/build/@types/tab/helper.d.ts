import { TabEvaluateFunction } from './tab';
export declare function evaluationSctriptProvider(script: string | TabEvaluateFunction): {
    serialazedFunc: string;
    shouldAwait: boolean;
};

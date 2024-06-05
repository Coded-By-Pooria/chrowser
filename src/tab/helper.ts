import { TabEvaluateFunction } from './tab';

export function evaluationSctriptProvider(
  script: string | TabEvaluateFunction
) {
  let serialazedFunc: string;
  let shouldAwait = false;
  if (typeof script === 'string') {
    serialazedFunc = script.trim();
    shouldAwait = serialazedFunc.startsWith('async');
  } else {
    const tempSerialized = script.toString().trim();
    shouldAwait = tempSerialized.startsWith('async');
    serialazedFunc = `(${tempSerialized})()`;
  }

  return { serialazedFunc, shouldAwait };
}

import { TabEvaluateFunction } from './tab';

export function evaluationSctriptProvider(
  script: string | TabEvaluateFunction,
  ...argumentsTobeSent: any[]
) {
  let serialazedFunc: string;
  let shouldAwait = false;
  if (typeof script === 'string') {
    serialazedFunc = script.trim();
    shouldAwait = serialazedFunc.startsWith('async');
  } else {
    const tempSerialized = script.toString().trim();
    shouldAwait = tempSerialized.startsWith('async');
    serialazedFunc = `(${tempSerialized})(
    ${argumentsTobeSent
      .map((a) => {
        if (typeof a == 'string') {
          return `"${a}"`;
        } else {
          return a;
        }
      })
      .join(',')}
    )`;
  }

  return { serialazedFunc, shouldAwait };
}

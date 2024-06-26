import { replaceAll } from '../utils';
import { TabEvaluateFunction } from './tab';

export function evaluationFunctionProvider(
  script: string | TabEvaluateFunction
) {
  const tempSerialized = script.toString().trim();

  try {
    new Function(tempSerialized);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.startsWith(
        `EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval'`
      )
    ) {
      // Assume valid func
      return tempSerialized;
    }
    // handle function in "func_name(){}" format
  }
  return tempSerialized;
}

function embededArgsConverter(args: any[]) {
  return args
    .map((arg) => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      } else if (typeof arg === 'function') {
        throw new Error(
          'Cannot pass unserializable argument of function type.'
        );
      } else if (typeof arg === 'string') {
        return `"${replaceAll(arg, '"', '\\"')}"`;
      }
      return arg;
    })
    .join(',');
}

export function serializeFunctionWithSerializableArgs(
  script: string | TabEvaluateFunction,
  ...args: any[]
) {
  if (typeof script == 'string') {
    return `(${script})(${embededArgsConverter(args)})`;
  } else {
    const func = evaluationFunctionProvider(script);
    return `(${func})(
    ${embededArgsConverter(args)})`;
  }
}

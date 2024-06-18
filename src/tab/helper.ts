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

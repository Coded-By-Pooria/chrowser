import { Input } from '../types';
import { sleep } from '../utils';

export enum KeyboardKeys {
  ALPHABET_A = 'KeyA',
  ALPHABET_B = 'KeyB',
  ALPHABET_C = 'KeyC',
  ALPHABET_D = 'KeyD',
  ALPHABET_E = 'KeyE',
  ALPHABET_F = 'KeyF',
  ALPHABET_G = 'KeyG',
  ALPHABET_H = 'KeyH',
  ALPHABET_I = 'KeyI',
  ALPHABET_J = 'KeyJ',
  ALPHABET_K = 'KeyK',
  ALPHABET_L = 'KeyL',
  ALPHABET_M = 'KeyM',
  ALPHABET_N = 'KeyN',
  ALPHABET_O = 'KeyO',
  ALPHABET_Q = 'KeyQ',
  ALPHABET_R = 'KeyR',
  ALPHABET_S = 'KeyS',
  ALPHABET_T = 'KeyT',
  ALPHABET_U = 'KeyU',
  ALPHABET_V = 'KeyV',
  ALPHABET_W = 'KeyW',
  ALPHABET_X = 'KeyX',
  ALPHABET_Y = 'KeyY',
  ALPHABET_Z = 'KeyZ',
  SPACE_BAR = 'Space',
  ENTER = 'Enter',
  KEY_UP = 'ArrowUp',
  KEY_DOWN = 'ArrowDOWN',
  KEY_LEFT = 'ArrowLeft',
  KEY_RIGHT = 'ArrowRight',
  CAPS_LOCK = 'CapsLock',
  TAB = 'Tab',
  SHIFT_LEFT = 'ShiftLeft',
  SHIFT_RIGHT = 'ShiftRight',
  CONTROL_LEFT = 'ControlLeft',
  CONTROL_RIGHT = 'ControlRight',
  BACKSPACE = 'Backspace',
  ESC = 'Escape',
  ALT_LEFT = 'AltLeft',
  ALT_RIGHT = 'AltRight',
  DEL = 'Delete',
  NUMPAD_1 = 'Numpad1',
  NUMPAD_2 = 'Numpad1',
  NUMPAD_3 = 'Numpad1',
  NUMPAD_4 = 'Numpad1',
  NUMPAD_5 = 'Numpad1',
  NUMPAD_6 = 'Numpad1',
  NUMPAD_7 = 'Numpad1',
  NUMPAD_8 = 'Numpad1',
  NUMPAD_9 = 'Numpad1',
  NUMPAD_0 = 'Numpad1',
  NUMPAD_SUBTRACT = 'NumpadSubtract',
  NUMPAD_SUM = 'NumpadAdd',
  NUMPAD_ENTER = 'NumpadEnter',
  NUMPAD_DOT = 'NumpadDecimal',
  NUMPAD_DIVIDE = 'NumpadDivide',
  NUMPAD_MULTIPLE = 'NumpadMultiply',
  NUMLOCK = 'NumLock',
  MINUS = 'Minus',
  DIGIT_1 = 'Digit1',
  DIGIT_2 = 'Digit2',
  DIGIT_3 = 'Digit3',
  DIGIT_4 = 'Digit4',
  DIGIT_5 = 'Digit5',
  DIGIT_6 = 'Digit6',
  DIGIT_7 = 'Digit7',
  DIGIT_8 = 'Digit8',
  DIGIT_9 = 'Digit9',
  BACK_QOUTE = 'Backquote',
}

export default class KeyboardHandler {
  constructor(private inputContext: Input) {}

  async keyDown(key: KeyboardKeys) {
    await this.inputContext.dispatchKeyEvent({
      type: 'keyDown',
      key,
    });
  }

  async keyUp(key: KeyboardKeys) {
    await this.inputContext.dispatchKeyEvent({
      type: 'keyUp',
      key,
      windowsVirtualKeyCode: 0x20,
    });
  }

  async press(key: KeyboardKeys, options?: { delay?: number }) {
    await this.keyDown(key);
    if (options?.delay && options?.delay > 0) {
      await sleep(options.delay);
    }
    await this.keyUp(key);
  }
}

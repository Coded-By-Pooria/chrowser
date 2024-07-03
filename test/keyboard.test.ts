import Browser from '../src/browser';
import { KeyboardKeys } from '../src/tab/tabKeyboardHandler';

(async () => {
  const browser = await Browser.create();

  const tab = await browser.newTab();

  await tab.navigate({ url: 'https://example.com/' });

  await tab.evaluate(function () {
    document.addEventListener('keydown', (e) => {
      console.log(e);
    });
    document.body.focus();
  });

  await tab.mouseHandler.click({ x: 100, y: 100 });

  await tab.keyboardHandler.press(KeyboardKeys.TAB);

  await tab.keyboardHandler.press(KeyboardKeys.ENTER);
})();

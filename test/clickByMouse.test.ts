import Browser from '../src/browser';
import chalk from 'chalk';
import { randomBetween, sleep } from '../src/utils';
import mouseCursorHelper from './mouseCursorHelper';

(async () => {
  const browser = await Browser.create();

  const tab = await browser.newTab();
  await mouseCursorHelper(tab);
  await tab.navigate({ url: 'https://example.com/' });

  await tab.evaluate(function () {
    document.addEventListener('click', (e) => console.log(e));
  });

  await tab.mouseHandler.move({
    x: randomBetween(0, 400),
    y: randomBetween(200, 500),
  });

  await sleep(200);

  await tab.mouseHandler.move({
    x: randomBetween(200, 600),
    y: randomBetween(200, 500),
  });
  await sleep(200);

  await tab.mouseHandler.move({
    x: randomBetween(0, 400),
    y: randomBetween(200, 500),
  });
  await sleep(200);

  await tab.mouseHandler.move({
    x: randomBetween(0, 400),
    y: randomBetween(200, 500),
  });
  await sleep(200);

  await tab.mouseHandler.move({
    x: randomBetween(0, 400),
    y: randomBetween(200, 500),
  });
  await sleep(200);

  const a = await tab.$('div');
  await a?.click(true);
})();

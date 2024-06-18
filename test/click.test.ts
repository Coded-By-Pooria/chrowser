import Browser from '../src/browser';
import chalk from 'chalk';
import { randomBetween, randomSign, sleep } from '../src/utils';

(async () => {
  const browser = await Browser.create();

  const tab = await browser.newTab();

  await tab.navigate({ url: 'https://example.com/' });

  const aBound = await tab.evaluate(function () {
    const a = document.querySelector('body a');
    const { width, left, top, height } = a!.getBoundingClientRect();

    return {
      width,
      left,
      top,
      height,
    };
  });

  const x = aBound.left + aBound.width / 4 + randomBetween(0, 2) * randomSign();
  const y = aBound.top + aBound.height / 4 + randomBetween(0, 2) * randomSign();

  await tab.mouseHandler.click({
    x,
    y,
  });

  const div = await tab.evaluate(function () {
    const div = document.querySelector('div');
    return div?.textContent;
  });

  console.log(chalk.blue(div));

  await tab.navigate({ url: 'https://another-site.com' });
})();

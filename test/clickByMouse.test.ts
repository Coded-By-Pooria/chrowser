import Browser from '../src/browser';
import chalk from 'chalk';
import { randomBetween, randomSign, sleep } from '../src/utils';

(async () => {
  const browser = await Browser.create();

  const tab = await browser.newTab();

  await tab.navigate({ url: 'https://example.com/' });

  const a = await tab.$('a');
  await a?.click(true);
})();

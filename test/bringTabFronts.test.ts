import Browser from '../src/browser';
import { sleep } from '../src/utils';

(async () => {
  const browser = await Browser.create();

  const tab1 = await browser.newTab();
  const tab2 = await browser.newTab();
  const tab3 = await browser.newTab();

  await tab2.bringToFront();

  await sleep(2000);

  await tab1.bringToFront();

  await sleep(2000);

  await tab3.bringToFront();
})();

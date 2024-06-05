import Browser from '../src/browser';
import { sleep } from '../src/utils';

(async function () {
  let browser: Browser;

  try {
    browser = await Browser.create();
    const tab1 = await browser.newTab();
    const tab1NavProm = tab1.navigate({
      url: 'https://bot.sannysoft.com',
      waitUntil: 'load',
    });

    await sleep(2000);

    const tab2 = await browser.newTab();
    const tab2NavProm = await tab2.navigate({
      url: 'https://blogfa.com',
      waitUntil: 'documentloaded',
    });

    await Promise.all([tab1NavProm, tab2NavProm]);
  } catch (err) {
    console.error(err);
    await browser!?.close();
  }
})();

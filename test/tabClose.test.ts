import Browser from '../src/browser';
import { sleep } from '../src/utils';

(async function () {
  const browser = await Browser.create();

  const tab1 = await browser.newTab({
    url: 'https://example.com/',
  });

  const tab2 = await browser.newTab();

  await tab2.navigate({ url: 'https://google.com' });

  await tab2.navigate({ url: 'https://example.com' });

  await sleep(2000);

  await tab2.close();

  console.log(browser.getAllOpenTabs());
})();

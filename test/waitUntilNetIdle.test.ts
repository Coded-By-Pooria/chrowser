import Browser from '../src/browser';
import { sleep } from '../src/utils';

(async function () {
  let browser: Browser;

  try {
    browser = await Browser.create();
    const tab1 = await browser.newTab();
    await tab1.navigate({
      url: 'https://example.com/',
      waitUntil: 'load',
    });

    const waitTime = 1000;
    await tab1.waitUntilNetworkIdle({ idleInterval: waitTime });

    console.log(`Idle network for ${waitTime / 1000}secs`);

    await sleep(2000);

    // const tab2 = await browser.newTab();
    // const tab2NavProm = await tab2.navigate({
    //   url: 'https://google.com',
    //   waitUntil: 'documentloaded',
    // });

    // await Promise.all([tab1NavProm, tab2NavProm]);
  } catch (err) {
    console.error(err);
    await browser!?.close();
  }
})();

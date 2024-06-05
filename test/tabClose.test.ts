import Browser from '../src/browser';

(async function () {
  const browser = await Browser.create();

  const tab1 = await browser.newTab({
    url: 'https://example.com/',
  });

  const tab2 = await browser.newTab();

  await tab2.navigate({ url: 'https://google.com' });

  await tab2.close();

  console.log(browser.getAllOpenTabs());
})();

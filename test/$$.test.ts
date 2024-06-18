import Browser from '../src/browser';

async function tabHandler(browser: Browser, url: string) {
  const tab = await browser.newTab();
  await tab.navigate({
    url,
    waitUntil: 'documentloaded',
  });

  const result = await tab.$$('div');

  console.log(result.length, '\t', result);
}

(async function () {
  const browser = await Browser.create();

  try {
    // tabHandler(browser, 'https://another-site.com');
    tabHandler(browser, 'https://example.com');
  } catch (err) {
    browser.close();
  }
})();

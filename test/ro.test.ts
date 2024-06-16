import Browser from '../src/browser';

async function tabHandler(browser: Browser, url: string) {
  const tab = await browser.newTab();
  await tab.navigate({
    url,
    waitUntil: 'documentloaded',
  });

  const result = await tab.$('div');
  console.log(result);
}

(async function () {
  const browser = await Browser.create();

  try {
    tabHandler(browser, 'https://blogfa.com');
    // tabHandler(browser, 'https://bot.sannysoft.com');
  } catch (err) {
    browser.close();
  }
})();

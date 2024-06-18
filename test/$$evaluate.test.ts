import Browser from '../src/browser';

async function tabHandler(browser: Browser, url: string) {
  const tab = await browser.newTab();
  await tab.navigate({
    url,
    waitUntil: 'documentloaded',
  });

  const res1 = await tab.$$evaluate('a', (a_s) => {
    return a_s.map((a) => {
      return (a as HTMLAnchorElement).href;
    });
  });

  console.log(res1.length, '\t', res1);

  const res2 = await tab.$evaluate('a', (a) => {
    return (a as HTMLAnchorElement).href;
  });

  console.log(res2);
}

(async function () {
  const browser = await Browser.create();

  try {
    tabHandler(browser, 'https://another-site.com');
    // tabHandler(browser, 'https://example.com');
  } catch (err) {
    browser.close();
  }
})();

import Browser from '../src/browser';

async function tabHandler(browser: Browser, url: string) {
  const tab = await browser.newTab();
  await tab.navigate({
    url,
    waitUntil: 'documentloaded',
  });

  const result = await tab.evaluate(async function () {
    return new Promise((res, rej) =>
      setTimeout(() => res('Resolve after 3 seconds.\n'), 3000)
    );
  });

  console.log(`{
    \turl: "${url}",
    \tresult: "${result}"
  }`);
}

(async function () {
  const browser = await Browser.create();

  try {
    tabHandler(browser, 'https://blogfa.com');
    tabHandler(browser, 'https://bot.sannysoft.com');
  } catch (err) {
    browser.close();
  }
})();

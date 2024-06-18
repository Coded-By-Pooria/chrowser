import Browser from '../src/browser';

async function tabHandler(browser: Browser, url: string) {
  const tab = await browser.newTab();
  await tab.navigate({
    url,
    waitUntil: 'documentloaded',
  });

  const result = await tab.evaluate(async function () {
    return new Promise((res, rej) =>
      setTimeout(
        () => res(`Resolve after 3 seconds. ${document.location.href}\n`),
        3000
      )
    );
  });

  console.log(`{
    \turl: "${url}",
    \tresult: "${result}"
  }`);

  await tab.navigate({
    url: 'https://www.google.com/',
    waitUntil: 'documentloaded',
  });

  console.log('second nav: GOOGLE');

  await tab.navigate({
    url: 'https://www.amazon.com/',
    waitUntil: 'documentloaded',
  });

  console.log('second nav: AMAZON');
}

(async function () {
  const browser = await Browser.create();

  try {
    tabHandler(browser, 'https://another-site.com');
    tabHandler(browser, 'https://example.com');
  } catch (err) {
    browser.close();
  }
})();

import Browser from '../src/browser';
import chalk from 'chalk';

async function tabHandler(browser: Browser, url: string) {
  const tab = await browser.newTab();
  await tab.navigate({
    url,
    waitUntil: 'documentloaded',
  });

  const result = await tab.$('div'); // first div
  const child = await result?.$('div'); // null
  const text = await tab.evaluate(
    function (res, ch) {
      return `type of res is : ${
        res.textContent
      }\ntype of ch is : ${typeof ch}`;
    },
    result,
    child
  );
  console.log(typeof child, chalk.red(text));

  await tab.navigate({ url: 'https://another-site.com/' });
  await tab.waitForSelectorAppear('.hfeed');
  const text2 = await tab.evaluate(function () {
    return `type of res is : ${
      document.querySelector('.hfeed')?.textContent
    }\n`;
  });
  console.log(typeof child, chalk.yellow(text2));
}

(async function () {
  const browser = await Browser.create();

  try {
    tabHandler(browser, 'https://example.com');
    // tabHandler(browser, 'https://www.google.com');
  } catch (err) {
    browser.close();
  }
})();

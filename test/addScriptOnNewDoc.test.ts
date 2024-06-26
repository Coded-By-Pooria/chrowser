import Browser from '../src/browser';
import Tab from '../src/tab/tab';

(async function () {
  const browser = await Browser.create();
  const tab = await browser.newTab();
  await tab.addScriptToRunOnNewDocument(function (ua) {
    Object.defineProperty(window, 'ua', { value: ua });
  }, `--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`);

  await nav(tab, 'https://example.com');
  await nav(tab, 'https://another-site.com');
})();

async function nav(tab: Tab, url: string) {
  await tab.navigate({ url: url });

  const ua1 = await tab.evaluate(function () {
    // @ts-ignore
    return window.ua;
  });

  console.log(ua1);
}

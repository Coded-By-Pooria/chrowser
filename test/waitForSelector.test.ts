import Browser from '../src/browser';

(async function () {
  const browser = await Browser.create();

  const tab = await browser.newTab();

  await tab.navigate({ url: 'https://nopecha.com/demo/cloudflare' });
  await tab.waitForSelectorAppear('iframe');
  console.log('iframe appeared');
})();

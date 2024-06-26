import Browser from '../src/browser';

(async function () {
  const browser = await Browser.create();
  console.log(browser.userAgent);
})();

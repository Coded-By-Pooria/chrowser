import Browser from '../src/browser';
import path from 'path';

(async function () {
  const browser = await Browser.create({});

  const tab = await browser.newTab();

  await tab.navigate({ url: 'https://example.com' });

  await tab.screenshot({
    savePath: path.join(__dirname, 'test_dir', 'screenshots', 'example.png'),
    format: 'png',
    quality: 50,
  });
})();

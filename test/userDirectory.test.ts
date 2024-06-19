import path from 'path';
import Browser from '../src/index';
import Server from './helper/counterServer';

const test_dir = path.join(__dirname, 'test_dir');

(async () => {
  const server = await Server.run();

  const browser = await Browser.create({
    userDir: path.join(test_dir, 'userDir'),
  });

  const tab = await browser.newTab();
  await tab.navigate({ url: server.url });

  const tab2 = await browser.newTab();
  await tab2.navigate({ url: server.url });

  const tab3 = await browser.newTab();
  await tab3.navigate({ url: server.url });
})();

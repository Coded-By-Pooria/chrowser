import Browser, { Tab } from '../src/index';

(async function () {
  const browser = await Browser.create();

  const tab = await browser.newTab();

  await getTitle(tab);

  await tab.navigate({ url: 'https://www.example.com' });

  await getTitle(tab);

  await tab.navigate({ url: 'https://www.another-site.com' });

  await getTitle(tab);
})();

async function getTitle(tab: Tab) {
  const t1 = await tab.getTabTitle();
  console.log('title : ', t1);
}

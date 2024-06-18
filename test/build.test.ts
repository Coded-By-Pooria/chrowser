import chrowser from '../dist/chrowser_module';

(async function () {
  console.log('chrowser: ', chrowser);
  const browser = await chrowser.create();
  const tab = await browser.newTab();
  tab.navigate({ url: '' });
})();

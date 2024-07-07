import Browser, { Tab } from '../src/index';
(async function () {
  const browser = await Browser.create();

  const tab1 = await browser.newTab();
  const tab2 = await browser.newTab();

  errorProneNavigation(tab1);
  // See Navigatable.waitForPossibleNavigation method doc
  secureNavigation(tab2);
})();

async function errorProneNavigation(tab: Tab) {
  try {
    await tab.navigate({ url: 'https://www.example.com' });
    const anchor = await tab.$('a');
    await anchor?.click();

    const div = await tab.$('div');
    console.log(`ERR_PRONE : Is Div evaluated : `, !!div);
  } catch (err) {
    console.error(err);
  }
}

async function secureNavigation(tab: Tab) {
  try {
    await tab.navigate({ url: 'https://www.example.com' });
    await (await tab.$('a'))?.click();

    await tab.waitForPossibleNavigation();

    const div = await tab.$('div');
    console.log(`SECURE : Is Div evaluated : `, !!div);
  } catch (err) {
    console.error(err);
  }
}

import Browser from '../src';
(async function () {
  const browser = await Browser.create();

  const tab = await browser.newTab();

  tab.addListener('NavigateRequest', (d) => {
    console.log('Request Navigation: ', d);
  });

  tab.addListener('NavigateDone', (d) => {
    console.log('Navigation Done: ', d);
  });

  await tab.navigate({ url: 'https://www.example.com' });
})();

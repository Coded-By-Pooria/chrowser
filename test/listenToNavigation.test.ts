import Browser from '../src/index';
(async function () {
  const browser = await Browser.create();

  const tab = await browser.newTab();

  tab.addListener('NavigateRequest', (d) => {
    console.log('Request Navigation: ', d);
    d.data.whenComplete().then((state) => {
      console.log('State : ', state, '\n***\n');
    });
  });

  await tab.navigate({ url: 'https://www.example.com' });

  await tab.navigate({ url: 'https://www.another-site.com' });
})();

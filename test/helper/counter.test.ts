import Server from './counterServer';

(async () => {
  const server = await Server.run();

  console.log(server.url);
})();

import http from 'http';
import fs from 'fs';
import path from 'path';

const test_dir = path.join(__dirname, '..', 'test_dir');

export default class Server {
  static COUNTER_FILE_NAME = 'counter.json';
  static COUNTER_FILE_PATH = path.join(
    test_dir,
    'logs',
    Server.COUNTER_FILE_NAME
  );
  static async run() {
    const server = new Server();
    await server.start();

    return server;
  }

  private server: http.Server;
  private async start() {
    this.server = http.createServer();

    this.server.addListener('request', this.handleRequest);

    this.initialDB();

    return new Promise<void>((res) =>
      this.server.listen(5080, () => {
        res();
      })
    );
  }

  get url() {
    const addressData: { port: number } = this.server.address() as never;
    return `http://127.0.0.1:${addressData.port}/`;
  }

  private loadJsonDB() {
    if (fs.existsSync(Server.COUNTER_FILE_PATH)) {
      return JSON.parse(
        fs.readFileSync(Server.COUNTER_FILE_PATH, { encoding: 'ascii' })
      ) as typeof this.jsonData;
    }
  }

  private initialDB() {
    const db = this.loadJsonDB();
    if (db) {
      this.jsonData = db;
    } else {
      this.jsonData = { lastId: 0, cookies: {} };
    }
  }

  private jsonData: {
    lastId: number;
    cookies: {
      [key: number]: number; // id to visit counter
    };
  };

  private writeDB() {
    fs.writeFileSync(Server.COUNTER_FILE_PATH, JSON.stringify(this.jsonData), {
      encoding: 'ascii',
    });
  }

  private get consumeId() {
    let newId: number = this.jsonData.lastId + 1;

    this.jsonData.lastId = newId;
    this.jsonData.cookies[newId] = 1;

    this.writeDB();

    return newId;
  }

  private getVisitorSessionData(id?: number) {
    if (id) {
      const visitCount = this.jsonData.cookies[id];
      if (Number.isInteger(visitCount)) {
        this.jsonData.cookies[id]++;
        this.writeDB();
        return {
          id,
          count: visitCount + 1,
        };
      }
    }

    const newId = this.consumeId;
    return {
      id: newId,
      count: 1,
    };
  }

  private handleRequest = (
    req: http.IncomingMessage,
    resp: http.ServerResponse<http.IncomingMessage> & {
      req: http.IncomingMessage;
    }
  ) => {
    if (req.method != 'GET' || req.url !== '/') {
      resp.end();
      return;
    }
    const cookies = req.headers.cookie?.trim();
    let data: ReturnType<typeof this.getVisitorSessionData>;

    if (cookies) {
      const targetCookie = /user=(\d+)/g.exec(cookies);
      const id = Number(targetCookie?.at(1));
      data = this.getVisitorSessionData(id);
    } else {
      data = this.getVisitorSessionData();
    }

    resp.setHeader('Set-Cookie', `user=${data.id}`);

    resp.write(
      `<!Doctype html>
        <html>
          <body>
            <h1>You visited this page <span style="color:red">${data.count}</span> times.</h1>
          </body>
        </html>
      `
    );
    resp.end();
  };

  async close() {
    return (await import('util')).promisify(this.server.close)();
  }
}

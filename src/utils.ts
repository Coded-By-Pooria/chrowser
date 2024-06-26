export function randomBetween(a: number, b: number) {
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);

  return (upper - lower) * Math.random() + b;
}

export function randomSign() {
  return Math.random() >= 0.5 ? 1 : -1;
}

export function awaitFor(cb: () => any, timeout: number) {
  return new Promise<void>((res, rej) => {
    setTimeout(async () => {
      await cb();
      res();
    }, timeout);
  });
}

export function sleep(timeout: number) {
  return new Promise<void>((res) => {
    setTimeout(() => res(), timeout);
  });
}

export class Waiter {
  static start() {
    const waiter = new Waiter();
    waiter.start();
    return waiter;
  }
  private constructor() {}

  private waiterResolver!: () => any;
  private waiterPromise!: Promise<void>;
  private start() {
    this.waiterPromise = new Promise<void>((res, _) => {
      this.waiterResolver = res;
    });
  }

  complete() {
    this.waiterResolver();
  }

  async then(callback: () => any) {
    await this.waiterPromise;
    return callback();
  }
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

import { PassThrough, Readable } from 'stream';
import http from 'http';
export async function fetchURL(url: string) {
  const bridge = new PassThrough();

  http
    .get(url)
    .on('response', (resp) => {
      resp.pipe(bridge);
    })
    .end();

  const result = await mergeData(bridge);
  return result;
}

function mergeData(s: Readable): Promise<string> {
  const segments: Buffer[] = [];
  return new Promise((res, rej) => {
    s.on('data', (d) => {
      segments.push(Buffer.from(d));
    })
      .on('end', () => {
        res(Buffer.concat(segments).toString('utf-8'));
      })
      .on('error', (err) => {
        rej(err);
      });
  });
}

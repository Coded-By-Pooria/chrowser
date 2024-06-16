import { Page } from '../../types';
import { TabSessionZoneMaker } from '../tab';

export default class PageContext {
  constructor(private context: TabSessionZoneMaker) {}

  runAtPageContext(callback: (context: Page) => Promise<any>) {
    return this.context.sessionZone(async ({ Page }) => {
      await Page.enable();
      return callback(Page);
    });
  }
}

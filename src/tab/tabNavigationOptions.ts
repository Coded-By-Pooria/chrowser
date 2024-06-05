import Protocol from 'devtools-protocol';

type TabNavigationOptions = Protocol.Page.NavigateRequest & {
  waitUntil?: 'documentloaded' | 'load';
};

export default TabNavigationOptions;

import CDP from 'chrome-remote-interface';
import ProtocolProxyApi from 'devtools-protocol/types/protocol-proxy-api';

export type Target = CDP.DoEventPromises<'Target'> &
  CDP.DoEventListeners<'Target'> &
  CDP.AddOptParams<CDP.OptIfParamNullable<ProtocolProxyApi.TargetApi>>;

export type Runtime = CDP.DoEventPromises<'Runtime'> &
  CDP.DoEventListeners<'Runtime'> &
  CDP.AddOptParams<CDP.OptIfParamNullable<ProtocolProxyApi.RuntimeApi>>;

export type Input = CDP.DoEventPromises<'Input'> &
  CDP.DoEventListeners<'Input'> &
  CDP.AddOptParams<CDP.OptIfParamNullable<ProtocolProxyApi.InputApi>>;

export type Page = CDP.DoEventPromises<'Page'> &
  CDP.DoEventListeners<'Page'> &
  CDP.AddOptParams<CDP.OptIfParamNullable<ProtocolProxyApi.PageApi>>;

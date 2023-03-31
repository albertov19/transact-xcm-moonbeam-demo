const { ApiPromise, WsProvider } = require('@polkadot/api');
declare let ethereum: any;

export async function polkadotProvider(wsEndpoint) {
  if (typeof ethereum !== 'undefined') {
    // Create WS Provider
    const wsProvider = new WsProvider(wsEndpoint);

    // Wait for Provider
    const api = await ApiPromise.create({
      provider: wsProvider,
    });
    await api.isReady;

    return api;
  }
}

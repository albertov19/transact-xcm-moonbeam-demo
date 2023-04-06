import { polkadotProvider } from './polkadotAPI';
import { MultiLocation } from '@polkadot/types/interfaces';
import { u8aToHex } from '@polkadot/util';

export async function calculateMLDA(contractAddress, api, accountLength) {
  // Calculate Multilocation Derivative Account
  const multilocation: MultiLocation = api.createType(
    'XcmV1MultiLocation',
    JSON.parse(
      JSON.stringify({
        parents: 1,
        interior: {
          x2: [{ parachain: JSON.parse('1000') }, { accountKey20: { network: { any: null }, key: contractAddress } }],
        },
      })
    )
  );

  const toHash = new Uint8Array([
    ...new Uint8Array([32]),
    ...new TextEncoder().encode('multiloc'),
    ...multilocation.toU8a(),
  ]);

  return u8aToHex(api.registry.hash(toHash).slice(0, accountLength));
}

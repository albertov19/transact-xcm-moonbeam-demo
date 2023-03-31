import React, { useEffect, useState } from 'react';
import { Container, Button, Menu, Icon, Input } from 'semantic-ui-react';
import Head from 'next/head';
import Link from 'next/link';
import * as ethers from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import DemoComponent from '../components/dapp-demo';

const XCMTransactorDemo = () => {
  // Initial State
  const [account, setAccount] = useState('Not Connected');
  const [connected, setConnected] = useState(false);
  const [networkName, setNetworkName] = useState('Not Connected');
  const [wsEndpoint, setWsEndpoint] = useState('');
  const [xc20Address, setXC20Address] = useState('');
  const [destAddress, setDestAddress] = useState('');

  useEffect(() => {
    async () => {
      await checkMetamask();
    };

    // Check for changes in Metamask (account and chain)
    if (window.ethereum) {
      (window as any).ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      (window as any).ethereum.on('accountsChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const checkMetamask = async () => {
    const provider = (await detectEthereumProvider({ mustBeMetaMask: true })) as any;

    if (provider) {
      const chainId = await provider.request({
        method: 'eth_chainId',
      });

      let networkName;
      switch (chainId) {
        case '0x507':
          networkName = 'Moonbase Alpha';
          break;
        default:
          networkName = '';
          setAccount('Only Moonbase Alpha Supported');
          break;
      }
      if (networkName !== '') {
        setNetworkName(networkName);
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });

        // Update State
        if (accounts) {
          setAccount(ethers.utils.getAddress(accounts[0]));
          setConnected(true);
        }
      }
    } else {
      // MetaMask not detected
      setAccount('MetaMask not Detected');
    }
  };

  const onConnect = async () => {
    await checkMetamask();
  };

  return (
    <Container>
      <Head>
        <title>XCM Transactor Demo</title>
        <link rel='icon' type='image/png' sizes='32x32' href='/favicon.png' />
        <link rel='stylesheet' href='//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css' />
      </Head>
      <div style={{ paddingTop: '10px' }} />
      <Menu>
        <Link href='/'>
          <a className='item'>XCM Transactor Demo dApp</a>
        </Link>
        <Menu.Menu position='right'>
          <a className='item'> {account} </a>
          {{ connected }.connected ? (
            <Button floated='right' icon labelPosition='left' color='green'>
              <Icon name='check'></Icon>
              {networkName}
            </Button>
          ) : (
            <Button floated='right' icon labelPosition='left' onClick={onConnect} primary>
              <Icon name='plus square'></Icon>
              Connect MetaMask
            </Button>
          )}
        </Menu.Menu>
      </Menu>
      <br />
      <h2>XCM Transactor Demo dApp</h2>
      <Input
        fluid
        label={{ content: 'Enter WS Endpoint of Target Parachain:' }}
        placeholder='WS Endpoint...'
        onChange={(input) => {
          setWsEndpoint(input.target.value);
        }}
      />
      <i>Manta endpoint for Testnet is wss://c1.manta.moonsea.systems</i>
      <br />
      <br />
      <Input
        fluid
        label={{ content: 'Enter XC-20 Address:' }}
        placeholder='XC-20 Address...'
        onChange={(input) => {
          setXC20Address(input.target.value);
        }}
      />
      <i>Manta endpoint for Testnet is 0xfFFffFFf7D3875460d4509eb8d0362c611B4E841</i>
      <br />
      <br />
      <Input
        fluid
        label={{ content: 'Enter Parachain Balance Transfer Dest Address:' }}
        placeholder='Transfer Dest Address...'
        onChange={(input) => {
          setDestAddress(input.target.value);
        }}
      />
      <i>Demo Address dfbrJKcsxJMABUnuNq5h625HJMq1WehaNxR6Hz5twJorVSWAT</i>

      <br />
      <br />
      {{ connected }.connected && wsEndpoint ? (
        <DemoComponent account={account} wsEndpoint={wsEndpoint} xc20Address={xc20Address} destAddress={destAddress} />
      ) : (
        <h3>Connect Metamask or Provide Endpoint</h3>
      )}
      <br />
    </Container>
  );
};

export default XCMTransactorDemo;

import React, { useEffect, useState } from 'react';
import { Container, Button, Menu, Icon, Input, Form, Message, Label } from 'semantic-ui-react';
import Head from 'next/head';
import Link from 'next/link';
import * as ethers from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import DemoComponent from '../components/dapp-demo';
import { polkadotProvider } from '../web3/polkadotAPI';

const XCMTransactorDemo = () => {
  // Initial State
  const [account, setAccount] = useState('Not Connected');
  const [connected, setConnected] = useState(false);
  const [connectedAPI, setConnectedAPI] = useState(false);
  const [networkName, setNetworkName] = useState('Not Connected');
  const [wsEndpoint, setWsEndpoint] = useState('');
  const [xc20Address, setXC20Address] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [amount, setAmount] = useState(BigInt(0));
  const [networkInfo, setNetworkInfo] = useState({
    name: '',
    decimals: 0,
    accountProperties: {},
    tokenSymbol: '',
    ss58Format: '',
  });

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

  const getNetworkInfo = async () => {
    setConnectedAPI(false);
    // Get Network Data
    try {
      if (wsEndpoint) {
        const api = await polkadotProvider(wsEndpoint);
        const name = (await api.rpc.system.chain()).toString();
        const decimals = (await api.registry.chainDecimals)[0];
        const tokenSymbol = (await api.registry.chainTokens)[0];
        const ss58Format = await await api.registry.chainSS58;
        let accountProperties = { accountLength: 0, accountSelector: '' };
        if (ss58Format > 1000) {
          accountProperties.accountLength = 20;
          accountProperties.accountSelector = '0x03';
        } else {
          accountProperties.accountLength = 32;
          accountProperties.accountSelector = '0x01';
        }

        setNetworkInfo({
          name: name,
          decimals: decimals,
          accountProperties: accountProperties,
          tokenSymbol: tokenSymbol,
          ss58Format: ss58Format,
        });

        setConnectedAPI(true);
      }
    } catch (err) {
      console.log(err.message);
    }
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
          setConnectedAPI(false);
        }}
      />
      {{ connectedAPI }.connectedAPI ? (
        <i>
          Network Name: {networkInfo.name} - Token Symbol: {networkInfo.tokenSymbol} - Decimals: {networkInfo.decimals}{' '}
          - SS58 Format: {networkInfo.ss58Format}
        </i>
      ) : (
        ''
      )}
      <br />
      {{ connectedAPI }.connectedAPI ? (
        <Button floated='right' icon labelPosition='left' color='green'>
          <Icon name='check'></Icon>
          Connected
        </Button>
      ) : (
        <Button icon labelPosition='left' color='orange' onClick={getNetworkInfo} floated='right'>
          <Icon name='plus square'></Icon>
          Connect WS
        </Button>
      )}
      <br />
      <br />
      <br />
      {{ connectedAPI }.connectedAPI ? (
        <Container>
          <Input
            fluid
            label={{ content: 'Enter XC-20 Address:' }}
            placeholder='XC-20 Address...'
            onChange={(input) => {
              setXC20Address(input.target.value);
            }}
          />
          <br />
          <Input
            fluid
            label={{ content: 'Enter Parachain Balance Transfer Dest Address:' }}
            placeholder='Transfer Dest Address...'
            onChange={(input) => {
              setDestAddress(input.target.value);
            }}
          />
          <br />
          <Input
            fluid
            labelPosition='right'
            type='text'
            placeholder='Transfer Amount...'
            onChange={(input) => {
              const amount = BigInt(Number(input.target.value) * 10 ** networkInfo.decimals);
              setAmount(amount);
            }}
          >
            <Label>Enter Transfer Amount:</Label>
            <input />
            <Label>{networkInfo.tokenSymbol}</Label>
          </Input>
          <br />
          {{ connected }.connected && xc20Address && destAddress ? (
            <DemoComponent
              account={account}
              wsEndpoint={wsEndpoint}
              networkInfo={networkInfo}
              xc20Address={xc20Address}
              destAddress={destAddress}
              amount={amount}
            />
          ) : (
            <h3>Connect Metamask and Provide XC-20 Address and Transfer Destination Address on Manta</h3>
          )}
        </Container>
      ) : (
        <h3>Provide WsEndpoint of Target Parachain</h3>
      )}
      <br />
      <p>
        You maybe can get XC-20s from our Uniswap V2 Fork for TestNet and swapping for DEV &nbsp;
        <a href='https://moonbeam-swap.netlify.app/#/swap'>here</a>
        <br />
        DEV Faucet &nbsp;
        <a href='https://apps.moonbeam.network/moonbase-alpha/faucet/'>here</a>
        <br />
        Don't judge the code :) as it is for demostration purposes only. You can check the source code &nbsp;
        <a href='https://github.com/albertov19/transact-xcm-moonbeam-demo'>here</a>
      </p>
      <br />
    </Container>
  );
};

export default XCMTransactorDemo;

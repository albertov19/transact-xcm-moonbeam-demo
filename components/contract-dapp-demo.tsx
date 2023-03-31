import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Icon, Message } from 'semantic-ui-react';
import { polkadotProvider } from '../web3/polkadotAPI';
import { calculateMLDA } from '../web3/calculateMLDA';
import remoteActionXCMInstance from '../web3/remoteActionXCM';
import xc20Instance from '../web3/xc-20';
import batchInstance from '../web3/batch';

const DemoComponent = ({ account, wsEndpoint }) => {
  // Variables
  const contractAddress = '0xe81f3e67d08fb9f0a09e0360a3edae3451b024b4';
  const [contractMLDA, setContractMLDA] = useState('');
  const [api, setAPI] = useState();
  const [xc20Address, setXC20Address] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenData, setTokenData] = useState({
    symbol: '',
    decimals: 0,
    allowance: 0,
  });
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Get Data
      await getTokenData();

      // Get API Provider
      const api = await polkadotProvider(wsEndpoint);
      setAPI(api);

      // Calculate Contract MLD Account
      const mldAccount = await calculateMLDA(contractAddress, api);
      setContractMLDA(mldAccount);
    };

    loadData();
  }, []);

  const getTokenData = async () => {
    setLoading(true);

    let tokenSymbol;
    let tokenDecimals;
    let tokenAllowance;
    try {
      // Create Contract Instance
      const remoteActionXM = remoteActionXCMInstance(contractAddress);

      // Create XC-20 Instance
      const xc20Address = await remoteActionXM.xc20Address();
      const xc20 = await xc20Instance(xc20Address);

      // Get Token Data
      tokenSymbol = await xc20.symbol();
      tokenDecimals = await xc20.decimals();
      tokenAllowance = BigInt(await xc20.allowance(account, contractAddress)) / BigInt(Math.pow(10, tokenDecimals));

      // Set Data
      setXC20Address(xc20Address);
      setTokenData({
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        allowance: tokenAllowance.toString(),
      });
    } catch (err) {
      setErrorMessage(err.message);
    }

    if (tokenAllowance >= BigInt(2)) {
      setButtonDisabled(true);
    } else {
      setButtonDisabled(false);
    }

    setLoading(false);
  };

  const sendApprove = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Create XC-20 Instance for Manta Token
      const xc20 = xc20Instance(xc20Address);

      // Send Allowance Tx
      let tx = await xc20.approve(contractAddress, String(2 * 10 ** tokenData.decimals));
      await tx.wait();
    } catch (err) {
      setErrorMessage(err.message);
    }

    // Load Token Data
    await getTokenData();
    setLoading(false);
  };

  const sendTransfer = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Create remoteActionXCM Instance
      const remoteActionXCM = remoteActionXCMInstance(contractAddress);

      // Get X-Tokens Calldata
      const [bytesInput] = await xTokensCalldata();

      // Send XTransfer Tx
      let tx = await remoteActionXCM.xTransfer(bytesInput);
      await tx.wait();
    } catch (err) {
      console.log(err.message);
      setErrorMessage(err.message);
    }

    // Load Token Data
    await getTokenData();
    setLoading(false);
  };

  const sendTransact = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Create remoteActionXCM Instance
      const remoteActionXCM = remoteActionXCMInstance(contractAddress);

      // Get XCM-Transactor Calldata
      const [bytesInput, transactCalldata] = await transactorCalldata();

      // Send remoteTransact Tx
      let tx = await remoteActionXCM.remoteTransact(bytesInput, transactCalldata);
      await tx.wait();
    } catch (err) {
      console.log(err.message);
      setErrorMessage(err.message);
    }

    await getTokenData();
    setLoading(false);
  };

  const batchCall = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Create Contract Instances
      const xc20 = xc20Instance(xc20Address);
      const remoteActionXCM = remoteActionXCMInstance(contractAddress);
      const batch = batchInstance();

      // Create Call Data for Batch
      const approveCallData = xc20.interface.encodeFunctionData('approve', [
        contractAddress,
        String(2 * 10 ** tokenData.decimals),
      ]);
      const xTokensBytes = await xTokensCalldata();
      const [transactorBytes, transactCalldata] = await transactorCalldata();
      const xTokensCallData = remoteActionXCM.interface.encodeFunctionData('xTransfer', [xTokensBytes]);
      const remoteTransactCallData = remoteActionXCM.interface.encodeFunctionData('remoteTransact', [
        transactorBytes,
        transactCalldata,
      ]);

      // Send Batch Transaction
      let tx = await batch.batchAll(
        [xc20Address, contractAddress, contractAddress], // Addresses to call (in order)
        [], // Value to be sent (0 DEV)
        [approveCallData, xTokensCallData, remoteTransactCallData], // Call data (in order)
        [] // Gas limit (use estimate gas)
      );
      await tx.wait();
    } catch (err) {
      setErrorMessage(err.message);
    }

    await getTokenData();
    setLoading(false);
  };

  const xTokensCalldata = async () => {
    // X-Tokens Function Input
    // Get Parachain ID for Multilocation
    const paraID = await (api as any).query.parachainInfo.parachainId();
    // Constructs Multilocation for Destination
    // Array of size 2 means it is an X2
    // For the Parachain ID
    // -> 0x00 Means we are Providing a Parachain ID
    // -> 0000 + ParachainID is Because Parachain ID is bytes4
    // For the account
    // -> 0x01 means We are Providing an AccountId32
    // -> The Next Thing is the Account without the Leading 0x
    // -> The Last 00 is Account Type Any
    return ['0x00' + '0000' + paraID.toString(16).padStart(4, '0'), '0x01' + contractMLDA.substring(2) + '00'];
  };

  const transactorCalldata = async () => {
    // XCM-Transactor Function Input
    // Get Parachain ID for Multilocation
    const paraID = await (api as any).query.parachainInfo.parachainId();
    // Constructs Multilocation for Destination
    // Array of size 1 means it is an X1
    // For the Parachain ID
    // -> 0x00 Means we are Providing a Parachain ID
    // -> 0000 + ParachainID is Because Parachain ID is bytes4
    const bytesInput = ['0x00' + '0000' + paraID.toString(16).padStart(4, '0')];

    // Get Transact Call Data
    const balanceTransferTx = await (api as any).tx.balances.transfer(
      'dfbrJKcsxJMABUnuNq5h625HJMq1WehaNxR6Hz5twJorVSWAT',
      String(1 * 10 ** tokenData.decimals)
    );
    const transactCalldata = balanceTransferTx.toHex();

    return [bytesInput, transactCalldata];
  };

  return (
    <Container>
      <Form error={!!{ errorMessage }.errorMessage}>
        <h4>XC-20 Allowance Details for Contract on Moonbeam</h4>
        <p>
          Contract Allowance is currently: {tokenData.allowance} {tokenData.symbol}
        </p>
        <Button
          icon
          labelPosition='left'
          color='orange'
          onClick={sendApprove}
          disabled={buttonDisabled}
          loading={loading}
        >
          <Icon name='plus square'></Icon>
          Approve
        </Button>
        <h4>Transfer XC-20 to Contract MLD Account on Manta</h4>
        <p>Destination Address (Contract MultiLocation Derivative on Manta): {contractMLDA}</p>
        <Button
          icon
          labelPosition='left'
          color='orange'
          onClick={sendTransfer}
          disabled={!buttonDisabled}
          loading={loading}
        >
          <Icon name='arrow alternate circle right'></Icon>
          Transfer
        </Button>
        <h4>Remote Transact on Manta</h4>
        <Button icon labelPosition='left' color='orange' onClick={sendTransact} loading={loading}>
          <Icon name='microchip'></Icon>
          Transact
        </Button>
        <h4>Batch All Actions into One Tx</h4>
        <Button icon labelPosition='left' color='orange' onClick={batchCall} loading={loading}>
          <Icon name='shipping fast'></Icon>
          Batch All!
        </Button>
        <Message error header='Oops!' content={errorMessage} />
      </Form>
    </Container>
  );
};

export default DemoComponent;

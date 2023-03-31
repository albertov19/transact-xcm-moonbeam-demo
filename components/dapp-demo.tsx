import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Icon, Message } from 'semantic-ui-react';
import { polkadotProvider } from '../web3/polkadotAPI';
import { calculateMLDA } from '../web3/calculateMLDA';
import xTokensInstance from '../web3/xTokens';
import xcmTransactorInstance from '../web3/xcmTransactor';
import xc20Instance from '../web3/xc-20';
import batchInstance from '../web3/batch';

const DemoComponent = ({ account, wsEndpoint, xc20Address, destAddress }) => {
  // Variables
  const [contractMLDA, setContractMLDA] = useState('');
  const [api, setAPI] = useState();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      // Get API Provider
      const api = await polkadotProvider(wsEndpoint);
      setAPI(api);

      // Calculate Contract MLD Account
      const mldAccount = await calculateMLDA(account, api);
      setContractMLDA(mldAccount);
    };

    loadData();
  }, []);

  const sendTransfer = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Create xTokens and XC-20 Instance
      const xTokens = xTokensInstance();

      // X-Tokens Calldata
      const [xTokensAmount, xTokensDestML, xTokensWeight] = await xTokensCalldata();

      // Send XTransfer Tx
      let tx = await xTokens.transfer(xc20Address, xTokensAmount, xTokensDestML, xTokensWeight);
      await tx.wait();
    } catch (err) {
      console.log(err.message);
      setErrorMessage(err.message);
    }

    setLoading(false);
  };

  const sendTransact = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Create remoteActionXCM Instance
      const xcmTransactor = xcmTransactorInstance();

      // Get XCM-Transactor Calldata
      const [transactDestML, transactWeight, transactCalldata, transactorFeeAmount, overallWeight] =
        await xcmTransactorCalldata();
      console.log(transactDestML, transactWeight, transactCalldata, transactorFeeAmount, overallWeight);

      // Send remoteTransact Tx
      let tx = await xcmTransactor.transactThroughSigned(
        transactDestML,
        xc20Address,
        transactWeight,
        transactCalldata,
        transactorFeeAmount,
        overallWeight
      );
      await tx.wait();
    } catch (err) {
      console.log(err.message);
      setErrorMessage(err.message);
    }

    setLoading(false);
  };

  const batchCall = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Create Contract Instances
      const xTokens = xTokensInstance();
      const xcmTransactor = xcmTransactorInstance();
      const batch = batchInstance();

      // Create Call Data for Batch
      const [xTokensAmount, xTokensDestML, xTokensWeight] = await xTokensCalldata();
      const xTokensCall = xTokens.interface.encodeFunctionData('transfer', [
        xc20Address,
        xTokensAmount,
        xTokensDestML,
        xTokensWeight,
      ]);
      const [transactDestML, transactWeight, transactCalldata, transactorFeeAmount, overallWeight] =
        await xcmTransactorCalldata();
      const xcmTransactorCall = xcmTransactor.interface.encodeFunctionData('transactThroughSigned', [
        transactDestML,
        xc20Address,
        transactWeight,
        transactCalldata,
        transactorFeeAmount,
        overallWeight,
      ]);

      // Send Batch Transaction
      let tx = await batch.batchAll(
        [xTokens.address, xcmTransactor.address], // Addresses to call (in order)
        [], // Value to be sent (0 DEV)
        [xTokensCall, xcmTransactorCall], // Call data (in order)
        [] // Gas limit (use estimate gas)
      );
      await tx.wait();
    } catch (err) {
      setErrorMessage(err.message);
    }

    setLoading(false);
  };

  const xTokensCalldata = async () => {
    // X-Tokens Function Input
    const decimals = await xc20Instance(xc20Address).decimals();
    const xTokensAmount = BigInt(1.1 * 10 ** decimals);
    const xTokensWeight = BigInt(4000000000);

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
    const xTokensDestML = {
      parents: 1,
      interior: ['0x00' + '0000' + paraID.toString(16).padStart(4, '0'), '0x01' + contractMLDA.substring(2) + '00'],
    };

    return [xTokensAmount, xTokensDestML, xTokensWeight];
  };

  const xcmTransactorCalldata = async () => {
    // Transfer Amount
    const decimals = await xc20Instance(xc20Address).decimals();
    const amount = BigInt(1 * 10 ** decimals);
    const transactWeight = BigInt(4000000000);
    const transactorFeeAmount = BigInt(0.0001 * 10 ** decimals);
    const overallWeight = BigInt(50000000000);

    // XCM-Transactor Function Input
    // Get Parachain ID for Multilocation
    const paraID = await (api as any).query.parachainInfo.parachainId();
    // Constructs Multilocation for Destination
    // Array of size 1 means it is an X1
    // For the Parachain ID
    // -> 0x00 Means we are Providing a Parachain ID
    // -> 0000 + ParachainID is Because Parachain ID is bytes4
    const transactDestML = { parents: 1, interior: ['0x00' + '0000' + paraID.toString(16).padStart(4, '0')] };

    // Get Transact Call Data
    const balanceTransferTx = await (api as any).tx.balances.transfer(destAddress, amount);
    const transactCalldata = balanceTransferTx.method.toHex();

    return [transactDestML, transactWeight, transactCalldata, transactorFeeAmount, overallWeight];
  };

  return (
    <Container>
      <Form error={!!{ errorMessage }.errorMessage}>
        <h4>Transfer XC-20 to MLD Account on Manta</h4>
        <p>Destination Address (MultiLocation Derivative on Manta): {contractMLDA}</p>
        <Button icon labelPosition='left' color='orange' onClick={sendTransfer} loading={loading}>
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

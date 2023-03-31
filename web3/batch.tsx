import web3 from './web3';
const batchInterface = require('./abi/BatchInterface.json');
const ethers = require('ethers');

const batchInstance = () => {
  const address = '0x0000000000000000000000000000000000000808';
  return new ethers.Contract(address, batchInterface.abi, web3().getSigner());
};

export default batchInstance;

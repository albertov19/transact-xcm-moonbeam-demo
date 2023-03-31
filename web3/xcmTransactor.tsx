import web3 from './web3';
const xcmTransactorInterface = require('./abi/XCMTransactorInterface.json');
const ethers = require('ethers');

const xcmTransactorInstance = () => {
  const address = '0x000000000000000000000000000000000000080D';
  return new ethers.Contract(address, xcmTransactorInterface.abi, web3().getSigner());
};

export default xcmTransactorInstance;

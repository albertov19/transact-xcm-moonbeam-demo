import web3 from './web3';
const xTokensInterface = require('./abi/XTokensInterface.json');
const ethers = require('ethers');

const xTokensInstance = () => {
  const address = '0x0000000000000000000000000000000000000804';
  return new ethers.Contract(address, xTokensInterface.abi, web3().getSigner());
};

export default xTokensInstance;

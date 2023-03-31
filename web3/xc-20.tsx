import web3 from './web3';
const xc20Interface = require('./abi/XC20Interface.json');
const ethers = require('ethers');

const xc20Instance = (address) => {
  return new ethers.Contract(address, xc20Interface.abi, web3().getSigner());
};

export default xc20Instance;

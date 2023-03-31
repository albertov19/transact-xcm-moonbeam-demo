import web3 from './web3';
const remoteActionXCMInterface = require('./abi/RemoteActionsXCMInterface.json');
const ethers = require('ethers');

const remoteActionXCMInstance = (address) => {
  return new ethers.Contract(address, remoteActionXCMInterface.abi, web3().getSigner());
};

export default remoteActionXCMInstance;

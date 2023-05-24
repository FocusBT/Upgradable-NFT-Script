// hardhat.config.js
require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-ethers");
require('dotenv').config()
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.12"
      }
    ]
  },
  defaultNetwork: 'mumbai',
  networks: {
    
    mumbai: {
      url: process.env.QUICKNODE_HTTP_URL,
      accounts: [process.env.PRIVATE_KEY],
    }
  },
  namedAccounts: {
    account0: 0 
  },
  etherscan: {
    apiKey: "ZYPHBGSE2PDD3R9QXKPSF45C45S2K136BA"
  }
};
// 0x28FeA719D7114cE383Ee22daA3d8a03f45Ea6A97
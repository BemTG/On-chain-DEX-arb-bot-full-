require("@nomiclabs/hardhat-waffle");
require("dotenv").config();


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 
//  https://rpc.xdaichain.com

module.exports = {
  networks: {
    aurora: {
      url: "https://gnosischain-rpc.gateway.pokt.network",
      accounts: ["0x96a141256ff130af9d"],
    },
    // fantom: {
    //   url: `https://rpc.ftm.tools/`,
    //   accounts: [process.env.privateKey],
    // },
    // 0x96a1410bfff130af9d
  },
  solidity: {
    compilers: [
      { version: "0.8.7" },
      { version: "0.7.6" },
      { version: "0.6.6" }
    ]
  },
};

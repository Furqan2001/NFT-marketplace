require("@nomiclabs/hardhat-waffle");
const fs = require("fs");
// const privateKey = fs.readFileSync(".secret").toString();

module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: "https://rpc-mumbai.matic.today",
      accounts: [process.env.NEXT_PUBLIC_PRIVATE_KEY]
    },
    mainnet: {
      url: "https://polygon-rpc.com/",
      accounts: [process.env.NEXT_PUBLIC_PRIVATE_KEY]
    }
  }
};

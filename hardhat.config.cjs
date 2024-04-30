/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");
// require("@nomicfoundation/hardhat-toolbox");
// require("@nomicfoundation/hardhat-ignition-ethers");

module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        url: process.env.RPC_URL,
      },
      accounts: [
        {
          privateKey: process.env.PRIVATE_KEY,
          balance: "1000000000000000000000000",
        },
      ],
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    baseTest: {
      chainId: 84532,
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
    },
    lineaTest: {
      chainId: 59140,
      url: "https://rpc.goerli.linea.build",
      accounts: [process.env.PRIVATE_KEY],
    },
    arbitrumTest: {
      chainId: 421614,
      url: "https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
      accounts: [process.env.PRIVATE_KEY],
    },
    auroraTest: {
      chainId: 1313161555,
      url: "https://testnet.aurora.dev",
      accounts: [process.env.PRIVATE_KEY],
    },
    bnbTest: {
      chainId: 97,
      url: "https://bsc-testnet.public.blastapi.io",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API,
    },
  },
};

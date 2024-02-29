const { ethers } = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

// Replace these with your contract's ABI and bytecode
// read from file 'hardhat-boilerplate/artifacts/contracts/AIGC_NFT_noOAO.sol/AIGC_NFT_noOAO.json'
const artifact = require("../hardhat-boilerplate/artifacts/contracts/AIGC_NFT_noOAO.sol/AIGC_NFT_noOAO.json");
const contractABI = artifact.abi;
const contractBytecode = artifact.bytecode;

// Provider and signer
// console.log(ethers);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract factory
const contractFactory = new ethers.ContractFactory(
  contractABI,
  contractBytecode,
  signer
);

async function deployContract() {
  try {
    // Deploy contract
    const contract = await contractFactory.deploy(
      // Constructor arguments
      "AIGC NFT", // _name
      "AIGCNFT", // _symbol
      0, // _mintPrice
      5, // _maxMintLimitPerAddr
      1000, // _maxSupply
      0, // _mintStartTime
      0 // _aiModelId
    );
    // console.log(contract);

    // Wait for deployment to finish
    // await contract.deployed();

    console.log(`Contract deployed to address: ${contract.target}`);
  } catch (error) {
    console.error("An error occurred during contract deployment:", error);
  }
}

deployContract();

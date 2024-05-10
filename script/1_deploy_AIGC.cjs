const { ethers } = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

// Replace these with your contract's ABI and bytecode
// read from file 'hardhat-boilerplate/artifacts/contracts/AIGC_NFT_noOAO.sol/AIGC_NFT_noOAO.json'
const artifact = require("../artifacts/contracts/AIGC_NFT.sol/AIGC_NFT.json");
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

console.log(signer.address);

async function deployContract() {
  try {
    // Deploy contract
    const contract = await contractFactory.deploy(
      // Constructor arguments
      "0x0A0f4321214BB6C7811dD8a71cF587bdaF03f0A0",
      "Stable Diffusion", // _name
      "SD", // _symbol
      // _mintPrice 0.002 ether,
      // ethers.parseEther("0.002"),
      0,
      7007 // _aiModelId: SD, in docs.ora.io);
    );

    // Wait for deployment to finish
    // await contract.deployed();

    console.log(`Contract deployed to address: ${contract.target}`);
  } catch (error) {
    console.error("An error occurred during contract deployment:", error);
  }
}

deployContract();

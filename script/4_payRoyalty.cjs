const { ethers } = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const IPAssetRegistryAddr = "0xBD2780F291588C8bDDf7F5874988fA9d3179d560";
const WETHAddr = "0x7b79995e5f793a07bc00c21412e50ecae098e7f9";
const RoyaltyPolicyLAP = "0x16eF58e959522727588921A92e9084d36E5d3855";
const licenseModule = "0x950d766A1a0afDc33c3e653C861A8765cb42DbdC";

// Contract factory
const contractFactory = new ethers.ContractFactory(
  require("./abi/RoyaltyModule.json"),
  require("./bytecode/RoyaltyModuleByte.json").bytecode,
  signer
);

const ipAssetRegis = new ethers.ContractFactory(
  require("./abi/IPAsset.json"),
  require("./bytecode/IPAsset.json").bytecode,
  signer
);

const WETH = new ethers.ContractFactory(
  require("./abi/WETH.json"),
  require("./bytecode/WETH.json").bytecode,
  signer
);
const License = new ethers.ContractFactory(
  require("./abi/license.json"),
  require("./bytecode/license.json").bytecode,
  signer
);

async function deployContract() {
  const contract = await contractFactory.attach(
    "0xA6bEf9CC650A16939566c1da5d5088f3F028a865"
  );
  const ipAsset = await ipAssetRegis.attach(IPAssetRegistryAddr);
  const weth = await WETH.attach(WETHAddr);
  const ipId = await ipAsset.ipAccount(
    11155111,
    "0x0B89f60136A91f3B36557F9414cbd157d0ada7bc",
    80
  );
  // console.log(ipId);
  const license = await License.attach(licenseModule);

  // await license.addPolicyToIp(ipId, 4);

  const policyId = await contract.royaltyPolicies(ipId);
  console.log(policyId);

  // wrap weth first
  // await weth.deposit({ value: ethers.parseEther("0.5") });
  const wethBal = await weth.balanceOf(signer);
  console.log(wethBal);

  // approve weth first
  // await weth.approve(RoyaltyPolicyLAP, ethers.parseEther("0.5"));

  await contract.payRoyaltyOnBehalf(ipId, ipId, WETHAddr, 1);
}

deployContract();

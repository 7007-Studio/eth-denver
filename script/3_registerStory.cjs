const dotenv = require("dotenv");
const { StoryClient, StoryConfig } = require("@story-protocol/core-sdk");
const { ethers } = require("ethers");

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(signer);
  // const config = {
  //   transport: http(process.env.TRANSPORT_RPC),
  //   account: account,
  // };
  // const client = StoryClient.newClient(config);
  // console.log(client);
}
main();

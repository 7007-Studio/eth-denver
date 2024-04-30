const { ethers } = require("ethers");
const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const ccipAddr = "0x0Cb620DD13478ce259705A79e4166a3ab02a3Bbd";

const app = express();
const port = 7000;
app.use(bodyParser.json());

// Contract factory
const contractFactory = new ethers.ContractFactory(
  require("./abi/ccip.json"),
  require("./bytecode/ccip.json").bytecode,
  signer
);
app.post("/registerPrompt", async (req, res) => {
  const { prompt, tokenId } = req.body;

  if (!prompt || !tokenId) {
    return res.status(400).send("Missing prompt or tokenId");
  }

  try {
    const contract = await contractFactory.attach(ccipAddr);
    await contract.registerPrompt(
      12532609583862916517, // Assuming this is a constant value needed for the contract call
      "0x54f4ada25fa21ac2f4c5a63aa692bb1b8cc00952", // Assuming this is a constant value needed for the contract call
      prompt,
      tokenId
    );
    res.send("Prompt registered successfully");
  } catch (error) {
    console.error("Error registering prompt:", error);
    res.status(500).send("Failed to register prompt");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

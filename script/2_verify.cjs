const { ethers } = require("ethers");

async function main() {
  // verify contracts
  await hre.run("verify:verify", {
    address: "0x069B0DFB9618f3b7fcCB0055589dB98139489de5",
    constructorArguments: [
      // Constructor arguments
      // AI oracle addr on sepolia
      "0x0A0f4321214BB6C7811dD8a71cF587bdaF03f0A0",
      "Stable Diffusion", // _name
      "SD", // _symbol
      // _mintPrice 0.002 ether,
      // ethers.parseEther("0.002"),
      0,
      7007, // _aiModelId: SD, in docs.ora.io
    ],
  });
}

main();

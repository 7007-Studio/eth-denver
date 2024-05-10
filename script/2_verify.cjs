const { ethers } = require("ethers");

async function main() {
  // verify contracts
  await hre.run("verify:verify", {
    address: "0x32088Be31D2403db83bC2de80Ba244455a34f4c3",
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

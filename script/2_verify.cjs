const { ethers } = require("ethers");

async function main() {
  // verify contracts
  await hre.run("verify:verify", {
    address: "0x491fA4D0B6eDdE8EC8252a32367093C25a9fd14b",
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

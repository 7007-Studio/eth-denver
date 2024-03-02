async function main() {
  // verify contracts
  await hre.run("verify:verify", {
    address: "0xEBFE3C2704b0248453c5dd4BF2435b4061B80711",
    constructorArguments: [
      "AIGC NFT", // _name
      "AIGCNFT", // _symbol
      0, // _mintPrice
      5, // _maxMintLimitPerAddr
      1000, // _maxSupply
      0, // _mintStartTime
      0,
    ],
  });
}

main();

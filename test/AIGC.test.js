import { expect } from "chai";
import hre from "hardhat";
// import "@nomiclabs/hardhat-ethers";

describe("Deploy", function () {
  it("Should deploy", async function () {
    console.log(hre);
    // deploy a lock contract where funds can be withdrawn
    // one year in the future
    const aigc = await ethers.deployContract("AIGC_NFT_noOAO", [
      "AIGC NFT", // _name
      "AIGCNFT", // _symbol
      0, // _mintPrice
      5, // _maxMintLimitPerAddr
      1000, // _maxSupply
      0, // _mintStartTime
      0,
    ]);

    console.log(aigc.address);
  });
});

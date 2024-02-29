// write a hardhat test
import { expect } from "chai";
import hre from "hardhat";
// import "@nomicfoundation/hardhat-toolbox";

describe("AIGC_NFT Contract Tests", function () {
  let AIGC_NFT;
  let aigcNft;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    AIGC_NFT = await ethers.getContractFactory("AIGC_NFT");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    aigcNft = await AIGC_NFT.deploy(
      "AIGC NFT",
      "AIGCNFT",
      ethers.utils.parseEther("0.01"), // mintPrice
      5, // maxMintLimitPerAddr
      1000, // maxSupply
      Math.floor(Date.now() / 1000), // mintStartTime
      0 // aiModelId
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await aigcNft.owner()).to.equal(owner.address);
    });

    it("Has a correct mint price", async function () {
      expect(await aigcNft.mintPrice()).to.equal(
        ethers.utils.parseEther("0.01")
      );
    });
  });

  describe("Minting", function () {
    it("Allows user to mint an NFT if they pay enough", async function () {
      await expect(
        aigcNft.connect(addr1).mint(addr1.address, "test prompt", 123, {
          value: ethers.utils.parseEther("0.01"),
        })
      )
        .to.emit(aigcNft, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, 1);

      expect(await aigcNft.totalSupply()).to.equal(1);
    });

    it("Fails if mint price is not met", async function () {
      await expect(
        aigcNft.connect(addr1).mint(addr1.address, "test prompt", 123, {
          value: ethers.utils.parseEther("0.005"),
        })
      ).to.be.revertedWith("Not enough fund to mint NFT");
    });

    it("Updates mint count for address after minting", async function () {
      await aigcNft.connect(addr1).mint(addr1.address, "test prompt", 123, {
        value: ethers.utils.parseEther("0.01"),
      });
      expect(await aigcNft._mintedCounts(addr1.address)).to.equal(1);
    });
  });

  describe("AI Result Storage", function () {
    it("Stores AI result for a prompt", async function () {
      const prompt = "test prompt";
      const modelId = 0;
      const output = ethers.utils.formatBytes32String("test output");

      // Assuming the storeAIResult function is updated to be public for testing or called by an AI Oracle mock
      await aigcNft.storeAIResult(
        modelId,
        ethers.utils.formatBytes32String(prompt),
        output
      );

      expect(await aigcNft.prompts(modelId, prompt)).to.equal(output);
    });
  });

  describe("Token URI", function () {
    it("Generates correct token URI after minting", async function () {
      await aigcNft.connect(addr1).mint(addr1.address, "test prompt", 123, {
        value: ethers.utils.parseEther("0.01"),
      });
      const tokenId = 1;
      const tokenURI = await aigcNft.tokenURI(tokenId);

      // This assertion depends on the actual implementation of getAIResultFromTokenId and tokenURI
      // You should replace the expected URI part with the correct expected result based on your contract logic
      expect(tokenURI).to.include("data:application/json;base64,");
    });
  });
});

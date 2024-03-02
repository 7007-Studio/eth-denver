// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IERC7007.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import { StoryProtocolGateway } from "@story-protocol/protocol-periphery/contracts/StoryProtocolGateway.sol";
import { Metadata } from "@story-protocol/protocol-periphery/contracts/lib/Metadata.sol";
import { SPG } from "./SPG.sol";

contract AIGC_NFT_noOAO is Ownable, ERC721Enumerable {

    using Address for address;
    string private baseTokenURI;
    uint256 public mintPrice;
    uint256 public maxMintLimitPerAddr;
    uint256 public maxSupply;
    uint256 public mintStartTime;
    uint256 public aiModelId;

    StoryProtocolGateway public immutable spg;

    mapping(address => uint256) public _mintedCounts;

    struct AIGC_Token {
        string prompt;
        uint256 seed;
    }

    mapping(uint256 => AIGC_Token) public AIGC_tokens; // token ID => xx
    mapping(bytes => uint256) public promptSeedToTokenId;
    mapping(bytes => uint256) public promptToTokenId;

    event promptsUpdated(
        uint256 modelId,
        string input,
        string output
    );

    event promptRequest(
        address sender,
        uint256 modelId,
        string prompt
    );

    /// @notice Initialize the contract, binding it to a specified AIOracle.
    constructor(
      string memory _name,
      string memory _symbol,
      uint256 _mintPrice,
      uint256 _maxMintLimitPerAddr,
      uint256 _maxSupply,
      uint256 _mintStartTime,
      uint256 _aiModelId,
      address _spg
    )
      ERC721(_name, _symbol)
      Ownable(msg.sender) {
        mintPrice = _mintPrice;
        maxMintLimitPerAddr = _maxMintLimitPerAddr;
        maxSupply = _maxSupply;
        mintStartTime = _mintStartTime;
        aiModelId = _aiModelId;
        spg = StoryProtocolGateway(_spg);
      }

    // uint256: modelID, 0 for Llama, 1 for stable diffusion
    // 1.string => 2.string: 1.string: prompt,
    // 2.string: text (for llama), cid (for sd)
    mapping(uint256 => mapping(string => string)) public prompts;

    function encode(string memory prompt, uint256 seed) public pure returns (bytes memory) {
        bytes memory data = abi.encodePacked(seed, prompt);
        return data;
    } 

    function getAIResultFromTokenId(uint256 tokenId) public view returns (string memory) {
        if (AIGC_tokens[tokenId].seed == 0) {
            return prompts[aiModelId][AIGC_tokens[tokenId].prompt];
        }
        bytes memory data = abi.encodePacked(AIGC_tokens[tokenId].seed, AIGC_tokens[tokenId].prompt);
        return prompts[aiModelId][string(data)];
    }

    // only the AI Oracle can call this function
    function storeAIResult(uint256 modelId, bytes calldata input, bytes calldata output) external onlyOwner {
        prompts[modelId][string(input)] = string(output);
        emit promptsUpdated(modelId, string(input), string(output));
    }

    /// NFT related
    function mint(address to, string calldata prompt, uint256 seed, bool registerIpAsset) external payable returns (uint256 tokenId) {
        // check if already minted
        require(promptSeedToTokenId[encode(prompt, seed)] == 0, "prompt and seed has already minted");
        // check time
        require(block.timestamp >= mintStartTime, "Sale not started");
        // require(block.timestamp >= testMintStartTime, "Sale not started");
        // check if enough maxMintCount per address
        require(_mintedCounts[to] + 1 <= maxMintLimitPerAddr, "Not enough maxMintCount per address per address");
        // check if Exceed max total supply
        require(totalSupply() + 1 <= maxSupply, "Exceed max total upply");
        // check fund
        require(msg.value >= mintPrice, "Not enough fund to mint NFT");


        // calculate AI result
        AIGC_tokens[totalSupply()] = AIGC_Token(prompt, seed);
        // mint
        super._safeMint(to, 1);

        // story protocol 
        Metadata.Attribute[] memory attributes = new Metadata.Attribute[](1);
        attributes[0] = Metadata.Attribute({key: "copyrightType", value: "literaryWork"});
        Metadata.IPMetadata memory ipMetadata = Metadata.IPMetadata({
            name: "Remix",
            hash: bytes32("your IP asset content hash"),
            url:  "https://yourip.xyz/metadata-regarding-its-ip",
            customMetadata: attributes
        });

        // check if is derivative
        uint256[] memory policies = new uint256[](1);

        if(promptToTokenId[bytes(prompt)] != 0) {
            SPG.Signature memory signature = SPG.Signature({
                signer: address(this),
                deadline: block.timestamp + 1000,
                signature: ""
            });
            spg.registerDerivativeIpWithSig(
                policies,
                bytes(0x0),
                address(this),
                totalSupply(),
                ipMetadata,
                signature
            );
        }

        // register ip asset and mint 10 license
        if(registerIpAsset){
            SPG.Signature memory signature = SPG.Signature({
                signer: address(this),
                deadline: block.timestamp + 1000,
                signature: ""
            });
            address ipId = spg.registerIpWithSig(8, address(this), totalSupply(), ipMetadata, signature);
            spg.mintLicense(8, ipId, 10, bytes(0x0)); // royaltyContext is 0x0 now
        }

        // increase minted count
        _mintedCounts[to] ++;

        promptSeedToTokenId[encode(prompt, seed)] = totalSupply();
        promptToTokenId[bytes(prompt)] = totalSupply();
        
        return totalSupply();
    }

    /// @dev Withdraw. The contract owner can withdraw all ETH from the NFT sale
    function withdraw() external onlyOwner {
        Address.sendValue(payable(_msgSender()), address(this).balance);
    }

    function tokenURI(uint256 tokenId) override public view returns (string memory) {
      string memory json = Base64.encode(bytes(string(abi.encodePacked(
        '{"name": "AIGC #', toString(tokenId), '", "description": "", "image": "https://gateway.pinata.cloud/ipfs/', getAIResultFromTokenId(tokenId), '"}'))));
      string memory output = string(abi.encodePacked('data:application/json;base64,', json));

      return output;
    }

    function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT license
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

/// [MIT License]
/// @title Base64
/// @notice Provides a function for encoding some bytes in base64
/// @author Brecht Devos <brecht@loopring.org>
library Base64 {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes some bytes to the base64 representation
    function encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return "";

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);

        // Add some extra buffer at the end
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, len) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }
}
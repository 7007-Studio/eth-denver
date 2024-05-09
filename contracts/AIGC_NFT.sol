// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// ref: https://sepolia.etherscan.io/address/0xe75af5294f4CB4a8423ef8260595a54298c7a2FB#code

import "./IERC7007.sol";
import "./IAIOracle.sol";
import "./AIOracleCallbackReceiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract AIGC_NFT is AIOracleCallbackReceiver, Ownable, ERC721 {

    using Address for address;
    string private baseTokenURI;
    uint256 public mintPrice;
    uint256 public aiModelId;
    uint256 public totalSupply;
    bool public hasStartMint;

    /// @notice Gas limit set on the callback from AIOracle.
    /// @dev Should be set to the maximum amount of gas your callback might reasonably consume.
    uint64 public aiOracleCallbackGasLimit = 500000; // default sd: 500k
    // mapping(address => uint256) public _mintedCounts;

    struct AIGC_Token {
        string prompt;
        uint256 seed;
        address author;
    }

    struct AIOracleRequest {
        address sender;
        uint256 modelId;
        bytes input;
        bytes output;
    }

    mapping(uint256 => AIGC_Token) public AIGC_tokens; // token ID => xx
    mapping(uint256 => AIOracleRequest) public requests;
    mapping(bytes => uint256) public promptSeedToTokenId;

    event promptsUpdated(
        uint256 requestId,
        uint256 modelId,
        string input,
        string output,
        bytes callbackData
    );

    event promptRequest(
        uint256 requestId,
        address sender, 
        uint256 modelId,
        string prompt
    );

    /// @notice Initialize the contract, binding it to a specified AIOracle.
    constructor(
      IAIOracle _aiOracle,
      string memory _name,
      string memory _symbol,
      uint256 _mintPrice,
    //   uint256 _maxMintLimitPerAddr,
    //   uint256 _maxSupply,
    //   uint256 _mintStartTime,
      uint256 _aiModelId
    )
      AIOracleCallbackReceiver(_aiOracle)
      ERC721(_name, _symbol)
      Ownable(msg.sender) {
        mintPrice = _mintPrice;
        // maxMintLimitPerAddr = _maxMintLimitPerAddr;
        // maxSupply = _maxSupply;
        // mintStartTime = _mintStartTime;
        aiModelId = _aiModelId;
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

    function startOrStopMint() external onlyOwner {
        hasStartMint = !hasStartMint;
    }

    function updateAIOracleCallbackGasLimit(uint64 _gasLimit) external onlyOwner {
        aiOracleCallbackGasLimit = _gasLimit;
    }

    // only the AI Oracle can call this function
    function aiOracleCallback(uint256 requestId, bytes calldata output, bytes calldata callbackData) external override onlyAIOracleCallback() {
        AIOracleRequest storage request = requests[requestId];
        require(request.sender != address(0), "request not exists");
        prompts[aiModelId][string(request.input)] = string(output);
        emit promptsUpdated(requestId, request.modelId, string(request.input), string(output), callbackData);
    }

    function calculateAIResult(string calldata prompt, uint256 seed) internal {
        bytes memory input = abi.encodePacked(seed, prompt);
        // we do not need to set the callbackData in this example
        uint256 requestId = aiOracle.requestCallback{value: msg.value}(
            aiModelId, input, address(this), aiOracleCallbackGasLimit, ""
        );
        AIOracleRequest storage request = requests[requestId];
        request.input = input;
        request.sender = msg.sender;
        request.modelId = aiModelId;
        emit promptRequest(requestId, msg.sender, aiModelId, prompt);
    }

    function estimateOAOFee() public view returns (uint256) {
        return aiOracle.estimateFee(aiModelId, aiOracleCallbackGasLimit);
    }
    function estimateTotalFee() public view returns (uint256) {
        return estimateOAOFee() + mintPrice;
    }
  
    /// NFT related
    function mint(address to, string calldata prompt, uint256 seed) external payable returns (uint256 tokenId) {
        // check time
        require(hasStartMint, "Sale not started");
        require(promptSeedToTokenId[encode(prompt, seed)] == 0, "prompt and seed has already minted");
        // check fund
        require(msg.value >= estimateTotalFee(), "Not enough fund to mint NFT");
        
        // calculate AI result
        AIGC_tokens[totalSupply] = AIGC_Token(prompt, seed, to);
        calculateAIResult(prompt, seed);
        // mint
        super._safeMint(to, totalSupply);
        // increase minted count
        // _mintedCounts[to] ++;

        totalSupply ++;
        promptSeedToTokenId[encode(prompt, seed)] = totalSupply; // actual value is minus 1

        return totalSupply - 1;
    }

    /// @dev Withdraw. The contract owner can withdraw all ETH from the NFT sale
    function withdraw() external onlyOwner {
        Address.sendValue(payable(_msgSender()), address(this).balance);
    }

    function tokenURI(uint256 tokenId) override public view returns (string memory) {
      string memory json = Base64.encode(bytes(string(abi.encodePacked(
        '{"name": "AIGC #', toString(tokenId), '", "attributes": [{"trait_type": "prompt", "value": "', AIGC_tokens[tokenId].prompt, '"}, {"trait_type": "seed", "value": "', toString(AIGC_tokens[tokenId].seed), '"}, {"trait_type": "author", "value": "0x', toAsciiString(AIGC_tokens[tokenId].author), '"}, {"trait_type": "model", "value": "Stable Diffusion"}], "description": "", "image": "https://gateway.pinata.cloud/ipfs/', getAIResultFromTokenId(tokenId), '"}'))));
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

function toAsciiString(address x) pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint i = 0; i < 20; i++) {
        bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
        bytes1 hi = bytes1(uint8(b) / 16);
        bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
        s[2*i] = char(hi);
        s[2*i+1] = char(lo);            
    }
    return string(s);
}

function char(bytes1 b) pure returns (bytes1 c) {
    if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    else return bytes1(uint8(b) + 0x57);
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
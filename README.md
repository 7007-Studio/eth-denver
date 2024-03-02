# 7007 Studio at Eth Denver

## Contract Addresses

- Base:
  - AIGC Factory: https://sepolia.basescan.org/address/0xc2059087976C913fF09056b4a35C10d45275E023#code
  - AIGC NFT: 0x63d9560b3cDF7325B5B694e4c5379d1356E355c1
- Linea:
  - AIGC Factory: https://explorer.goerli.linea.build/address/0xDF3379d2C03941CA3D915c275791025F0eE9B4cc/contracts#address-tabs
  - AIGC NFT: 0x442543261D084D6ea3241D16B3bD3187ea4dABEf
- Arbitrum:
  - AIGC Factory: https://sepolia.arbiscan.io/address/0x42537d4E19d7888D8d5A867A51911bde569d9e9D#code
  - AIGC NFT: 0x72cD65b1061352E4Fe9e4620Ad739867e2249505
- Near Aurora:
  - AIGC Factory: https://explorer.testnet.aurora.dev/address/0x42537d4E19d7888D8d5A867A51911bde569d9e9D#code
  - AIGC NFT: 0x72cD65b1061352E4Fe9e4620Ad739867e2249505
- BSC Test:
  - AIGC Factory: https://testnet.bscscan.com/address/0x54F4Ada25fa21aC2f4C5A63aa692bb1b8CC00952#code
  - AIGC NFT: 0xE5bd52A978dF05Ed45805B90A88800d513273723

## Chainlink CCIP for Cross Chain AIGC Prompt Registry and Revenue Sharing

We create a prompt registry contract on Sepolia and Mumbai. Whenever someone register a prompt after minting a AIGC nft in the Sepolia contract, the Mumbai contract will receive the prompt and the corresponding token id for the minted AIGC nft. If the Mumbai contract receives two identical prompt, we will set the revenue sharing token Id to the first prompt's tokenId. Thus, the revenue sharing token Id will be the same for the same prompt on different chains.

### Screenshot of the first prompt being registered

![img](./img/ccip_01.jpg)

### Screenshot of the second identical prompt being registered

![img](./img/ccip_02.jpg)

## Text to Video

```bash
curl -X POST http://localhost:9000/genVideo \
-H "Content-Type: application/json" \
-d '{"text": "cat is playing ball"}'
```

## Install

```bash
yarn install
```

## Deploy contract

```
npx hardhat run script/1_deploy_AIGC.cjs --network sepolia
```

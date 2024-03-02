# 7007 Studio at Eth Denver

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

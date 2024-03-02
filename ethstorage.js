import ethfs from "ethfs-sdk";
import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// callback, can be null
const onProgress = (chunkIndex, totalChunk, fileName) => {};
const onSuccess = (fileName) => {
  console.log("success");
};
const onError = (message) => {
  // console.log("error", message);
};

const uploadFile = async (filePath, fileName) => {
  const fileStat = fs.statSync(filePath);
  const content = fs.readFileSync(filePath);
  const directoryPath = "img/" + fileName;

  const rpc = "https://galileo.web3q.io:8545";
  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const directoryAddress = await ethfs.createDirectory(signer);
  console.log(directoryAddress);

  await ethfs.upload(
    signer,
    directoryAddress,
    directoryPath,
    fileStat.size,
    content,
    onProgress,
    onSuccess,
    onError
  );
};

uploadFile("img/w644.jpeg", "file");

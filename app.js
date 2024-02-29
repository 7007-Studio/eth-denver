import { Livepeer } from "livepeer";

const apiKey = 'YOUR_API_KEY';
const fileName = 'filename.mp4';

const livepeer = new Livepeer(apiKey);

const assetData = {
  name: fileName
};

livepeer
  .requestAssetUpload(assetData)
  .then((response) => {
    console.log("Asset upload request:", response);
  })
  .catch((error) => {
    console.error("Error requesting asset upload:", error);
  });

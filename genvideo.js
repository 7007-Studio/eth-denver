import Replicate from "replicate";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
const output = await replicate.run(
  "cjwbw/damo-text-to-video:1e205ea73084bd17a0a3b43396e49ba0d6bc2e754e9283b2df49fad2dcf95755",
  {
    input: {
      fps: 8,
      prompt: "A panda eating bamboo on a rock.",
      num_frames: 50,
      num_inference_steps: 50,
    },
  }
);
// save the output to a file
console.log(output);
// use request to get the video and save it to local
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (error) => {
        fs.unlink(dest); // Delete the file if an error occurs
        reject(error);
      });
  });
};

// let output =
//   "https://replicate.delivery/pbxt/GtUHF8P0een0HETqieB8UOuKhXKfRXCSQueaIgc0tSb0eM2mE/out.mp4";
downloadFile(output, "downloaded_video.mp4")
  .then(() => console.log("Download completed successfully."))
  .catch((error) => console.error("Error downloading file:", error));

import express from "express";
import fs from "fs";
import Replicate from "replicate";
import dotenv from "dotenv";
import https from "https";

dotenv.config();
const app = express();
const port = 9000;

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/genVideo", async (req, res) => {
  const inputText = req.body.text; // Assuming the input text is in the 'text' property
  console.log("Received text:", inputText);

  // Specify the path to your video file
  const output = await replicate.run(
    "cjwbw/damo-text-to-video:1e205ea73084bd17a0a3b43396e49ba0d6bc2e754e9283b2df49fad2dcf95755",
    {
      input: {
        fps: 8,
        prompt: inputText,
        num_frames: 50,
        num_inference_steps: 50,
      },
    }
  );
  // save the output to a file
  console.log(output);
  downloadFile(output, "downloaded_video.mp4")
    .then(() => {
      const videoPath = "downloaded_video.mp4";

      // Read the video file and convert it to a base64 string
      fs.readFile(videoPath, (err, videoData) => {
        if (err) {
          console.error("Error reading the video file:", err);
          return res.status(500).send("Error processing the video file");
        }

        // Convert the video data to a base64 string
        const base64Video = videoData.toString("base64");

        // Optionally, you might want to prepend a data URL scheme to the base64 string
        // depending on how you plan to use it on the client-side
        const base64VideoDataUrl = `data:video/mp4;base64,${base64Video}`;

        // Send the base64-encoded video in the response
        res.json({ base64Video: base64VideoDataUrl });
      });
    })
    .catch((error) => console.error("Error downloading file:", error));
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

from diffusers import DiffusionPipeline
import torch

from flask import Flask, request, Response
import json

import os

from pytorch_lightning import seed_everything
from hashlib import sha256

def myhash(txt):
    return sha256(txt.encode('utf-8')).hexdigest()

PORT = 8801

# sd
pipeline = DiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4", torch_dtype=torch.float16)
pipeline.to("cuda:2")
print("load stable diffusion")

app = Flask(__name__)

ok = True

@app.route("/")
def hello_world():
    return "hello world"

def request_parse(req_data):
    if request.is_json:
        data = req_data.json
    else:
        data = req_data.args
    return data

@app.route("/txt2img", methods=['POST'])
def txt2img():
    global ok
    data = request_parse(request)
    prompt = data.get('prompt', "a cute cat")
    print("prompt: ", prompt)
    seed = int(data.get('seed', int(0x1cc)))
    seed_everything(seed)
    h = str(myhash(prompt))
    filepath = "cache/sd/" + h + ".png"
    image = None
    if os.path.isfile(filepath): 
        # in cache
        print("file exists, filepath: ", filepath)
        with open(filepath, "rb") as f:
            image = f.read()
        # ok = True
    else:
        if (not ok):
            with open("outputs/pls_wait.png", "rb") as f:
                image = f.read()
            return Response(image, content_type='image/png')
        ok = False
        image = pipeline(prompt).images[0]
        image.save(filepath)
        with open(filepath, "rb") as f:
            image = f.read()
        ok = True
    return Response(image, content_type='image/png')


if __name__ == '__main__':
    app.run(debug=True, port=PORT)
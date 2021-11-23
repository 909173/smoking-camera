<template>
  <div>
    <div class="resultFrame">
      <video ref="camera"></video>
      <canvas ref="canvas" width="640" height="480"></canvas>
    </div>
    {{ peopleNumber }}人の人が映っています。
  </div>
</template>

<script lang="ts">
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { Component, Prop, Vue } from "vue-property-decorator";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
@Component
export default class HelloWorld extends Vue {
  model: cocoSsd.ObjectDetection = {} as cocoSsd.ObjectDetection;
  videoRatio = 1;
  resultWidth = 0;
  resultHeight = 0;
  peopleNumber = 0;
  "$refs": {
    camera: HTMLVideoElement;
    canvas: HTMLCanvasElement;
  };
  async detectObjects() {
    const predirections = await this.model.detect(this.$refs.camera);
    this.renderPredictions(predirections);
  }
  renderPredictions(predictions: cocoSsd.DetectedObject[]) {
    // get the context of canvas
    const ctx = this.$refs.canvas.getContext("2d") as CanvasRenderingContext2D;
    // clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const people = predictions.filter(
      (x) => x.class === "person" && x.score > 0.6
    );
    this.peopleNumber = people.length;
    people.forEach((prediction) => {
      ctx.beginPath();
      ctx.rect(...prediction.bbox);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";
      ctx.stroke();
      ctx.shadowColor = "white";
      ctx.shadowBlur = 10;
      ctx.font = "24px Arial bold";
      ctx.fillText(
        `${(prediction.score * 100).toFixed(1)}% ${prediction.class}`,
        prediction.bbox[0],
        prediction.bbox[1] + 20
      );
    });
  }
  setResultSize() {
    // get the current browser window size
    const clientWidth = document.documentElement.clientWidth;
    // set max width as 600
    this.resultWidth = Math.min(600, clientWidth);
    // set the height according to the video ratio
    this.resultHeight = this.resultWidth * this.videoRatio;
    // set <video> width and height
    /*
        Doesn't use vue binding :width and :height,
          because the initial value of resultWidth and resultHeight
          will affect the ratio got from the initWebcamStream()
      */
    const video = this.$refs.camera;
    video.width = this.resultWidth;
    video.height = this.resultHeight;
  }
  mounted(): void {
    const video = this.$refs.camera;
    Promise.all([
      cocoSsd.load({
        base: "lite_mobilenet_v2",
      }),
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      }),
    ])
      .then(async ([detect, stream]) => {
        console.log("model, loaded");
        this.model = detect;
        video.srcObject = stream;
        await video.play();
        setInterval(this.detectObjects, 500);
        return new Promise((resolve, _) => {
          // when video is loaded
          video.onloadedmetadata = () => {
            // calculate the video ratio
            this.videoRatio = video.offsetHeight / video.offsetWidth;
            // add event listener on resize to reset the <video> and <canvas> sizes
            window.addEventListener("resize", this.setResultSize);
            // set the initial size
            this.setResultSize();
            // this.isVideoStreamReady = true;
            console.log("webcam stream initialized");
            resolve(null);
          };
        });
      })
      .catch((e) => console.log(e));
  }
}
</script>
<style scoped>
.resultFrame {
  display: grid;
}
video {
  grid-area: 1 / 1 / 2 / 2;
}
canvas {
  grid-area: 1 / 1 / 2 / 2;
}
</style>

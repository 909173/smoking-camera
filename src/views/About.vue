<template>
  <div>
    <div class="resultFrame">
      <img
        ref="liveImg"
        crossorigin="anonymous"
        :src="liveUrl"
        alt="Live映像"
      />
      <canvas ref="canvas" width="640" height="640"></canvas>
    </div>
  </div>
</template>
<script lang="ts">
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import Vue from "vue";
import Component from "vue-class-component";
@Component({
  name: "about",
})
export default class extends Vue {
  liveUrl = process.env.VUE_APP_LIVE_URL as string;
  model: cocoSsd.ObjectDetection = {} as cocoSsd.ObjectDetection;
  peopleNumber = 0;
  "$refs": {
    liveImg: HTMLImageElement;
    canvas: HTMLCanvasElement;
  };
  async detectObjects(): Promise<void> {
    const predirections = await this.model.detect(this.$refs.liveImg);
    this.renderPredictions(predirections);
  }
  renderPredictions(predictions: cocoSsd.DetectedObject[]): void {
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
  mounted() {
    Promise.all([
      cocoSsd.load({
        base: "lite_mobilenet_v2",
      }),
      fetch(this.liveUrl),
    ])
      .then(async ([detect, live]) => {
        console.log("detect", live);
        this.model = detect;
        setInterval(this.detectObjects, 500);
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
</script>
<style scoped>
.resultFrame {
  display: grid;
}
img {
  grid-area: 1 / 1 / 2 / 2;
}
canvas {
  grid-area: 1 / 1 / 2 / 2;
}
</style>

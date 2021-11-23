import * as comlink from "comlink";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { isInt } from "@tensorflow/tfjs-core/dist/util";

let net: cocoSsd.ObjectDetection | null;
let ctx: CanvasRenderingContext2D | null;
const videoBufferCanvas = new OffscreenCanvas(600, 600);
const videoBufferContext = videoBufferCanvas.getContext(
  "2d"
) as any as CanvasRenderingContext2D;

console.time("[worker] start");

comlink.expose({
  async init(canvas: OffscreenCanvas) {
    console.time("[worker] load model");
    net = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    console.timeEnd("[worker] load model");
  },
});

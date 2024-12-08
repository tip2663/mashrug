<template>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as rca from './rca.ts';

const canvasRef = ref<HTMLCanvasElement | null>(null);

// Utility function to load an image
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Get a random RCA (Randomly Customizable Avatar)
const getRandomElement = <T>(array: T[]): T | undefined => {
  if (array.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

const testRca = getRandomElement(rca.rcas);

// Draw images on the canvas in order
const drawImages = async (mashupRcas: rca.rca[]) => {
  const canvas = canvasRef.value;
  console.log(canvas)
  if (!canvas || !testRca) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Get image sources
  const sources = [
    rca.getBackdrop(mashupRcas[0]),
    rca.getResById(rca.getBodyLowerId(mashupRcas[1])),
    rca.getResById(rca.getBodyId(mashupRcas[2])),
    rca.getResById(rca.getHairBottomId(mashupRcas[3])),
    rca.getResById(rca.getFaceLowerId(mashupRcas[4])),
    rca.getResById(rca.getFaceUpperId(mashupRcas[5])),
    rca.getResById(rca.getHairTopId(mashupRcas[6])),
  ];

  // Load all images
  const images = await Promise.all(sources.map(loadImage).map(pr => pr.catch(() => null)));
  const baseimg = images.findIndex(img => !!img)

  // Set canvas size to match the first image (assuming all images are the same size)
  const width = images[baseimg]!.width;
  const height = images[baseimg]!.height;
  canvas.width = width;
  canvas.height = height;

  // Draw each image in order
  images.forEach((img) => {
    if(img) ctx.drawImage(img, 0, 0, width, height);
  });
};

// Draw images when the component is mounted
onMounted(() => {
  drawImages([testRca,testRca,testRca,testRca,testRca,testRca,testRca]).catch((error) => console.error(error));
});
</script>

<style scoped>
canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>


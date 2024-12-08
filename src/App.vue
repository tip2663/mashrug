<template>
  <div>
    <h5>Mashup Maker</h5>
    <canvas ref="canvasRef"></canvas>
    <div class="mashups">
      <div class="dropdown" v-for="(_option, index) in selectedRcas" :key="'dropdown-'+index">
        <label :for="'rca-dropdown-' + index">{{ indexToTrait[index] }}:</label>
        <select
          v-model="selectedRcas[index]"
          :id="'rca-dropdown-' + index">
          <option :value="null">None</option>
          <option v-for="rca in sortedRcas" :key="index + '-' + rca.name" :value="rca">{{ rca.name }}</option>
        </select>
        </div>
    </div>
    <button @click="downloadCanvas">Download High Resolution</button>
    <p>If you cannot load the images, try turning off advanced tracking protection. All images are fetched off of reddit directly. This site hosts none of reddit's content. Image Copyright is due to the artists. For personal use only. This site has no affiliation to Reddit.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import * as rca from './rca.ts';
const indexToTrait = [
  "Background",
  "Hair 1",
  "Lower",
  "Upper",
  "Head",
  "Eyes",
  "Hair 2",
  "Hat"
]

const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedRcas = reactive(new Array(8).fill(null)); // No need for ref inside the array
const sortedRcas = rca.rcas.sort((a, b) => a.name.localeCompare(b.name));

const downloadCanvas = () => {
  if (canvasRef.value) {
    const link = document.createElement('a');
    link.download = 'canvas-image.png';
    link.href = canvasRef.value.toDataURL('image/png');
    link.click();
  }
};

// Watch selectedRcas to trigger drawing on canvas
watch(selectedRcas, (newValue) => {
    drawImages(newValue);
});

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};
const drawImages = async (mashupRcas: (rca.rca|null)[]) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const sources = [
    ...(mashupRcas[0] ? [rca.getBackdrop(mashupRcas[0]!)] : []),
    ...(mashupRcas[1] ? [rca.getResById(rca.getHairBottomId(mashupRcas[1]!))] : []),
    ...(mashupRcas[2] ? [rca.getResById(rca.getBodyLowerId(mashupRcas[2]!))] : []),
    ...(mashupRcas[3] ? [rca.getResById(rca.getBodyId(mashupRcas[3]!))] : []),
    ...(mashupRcas[4] ? [rca.getResById(rca.getFaceLowerId(mashupRcas[4]!))] : []),
    ...(mashupRcas[5] ? [rca.getResById(rca.getEyesId(mashupRcas[5]!))] : []),
    ...(mashupRcas[6] ? [rca.getResById(rca.getHairTopId(mashupRcas[6]!))] : []),
    ...(mashupRcas[7] ? [rca.getResById(rca.getHatId(mashupRcas[7]!))] : []),
  ];
  const images = await Promise.all(sources.map(loadImage).map(pr => pr.catch(() => null)));
  const baseimg = images.findIndex(img => !!img)
  const width = images[baseimg]!.width;
  const height = images[baseimg]!.height;
  canvas.width = width;
  canvas.height = height;
  images.forEach((img) => {
    if(img) ctx.drawImage(img, 0, 0, width, height);
  });
};

</script>

<style scoped>
canvas {
  max-width: 256px;
  min-width: 256px;
  min-height: 341.333px;
  max-height: 100%;
}

.mashups {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  margin: 1rem 0;
}
.mashups .dropdown {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 2;
  text-align: right;
}
</style>

<template>
  <div>
    <h5>Mashup Maker</h5>
    <canvas ref="canvasRef"></canvas>
    <div>
      <button @click="randomize()">randomize!</button>
    </div>
    <div class="mashups">
      <div class="controls" v-for="(_option, index) in selectedRcas" :key="'dropdown-'+index">
        <label :for="'rca-dropdown-' + index">{{ indexToTrait[index] }}:</label>
        <Multiselect
          :id="'rca-dropdown-' + index"
          v-model="selectedRcas[index]"
          :allow-empty="true"
          :options="dropdownRcas"
          deselect-label="None"
          track-by="name"
          label="name"
        >
        </Multiselect>
      </div>
      <div class="controls">
        <label for="skinColor">Skin Color</label>
        <input id="skinColor" type="color" v-model="skinColor">
      </div>
      <div class="controls">
        <label for="hairColor">Hair Color</label>
        <input id="hairColor" type="color" v-model="hairColor">
      </div>
    </div>
    <button @click="downloadCanvas">Download High Resolution</button>
    <p>This site is for entertainment purposes only. We are neither affiliated nor endorsed by Reddit.</p>
    <p>Older generation avatars do not work because the trickery to fetch the traits doesn't work with them. If you cannot load the images, try turning off advanced tracking protection. All images are fetched off of reddit directly. This site hosts none of reddit's content. Image Copyright is due to the artists. For personal use only. This site has no affiliation to Reddit.</p>
    <p>#stopthedev</p>
  </div>
</template>

<script setup lang="ts">
import Multiselect from 'vue-multiselect'
import { ref, reactive, watch, onMounted } from 'vue';
import * as rca from './rca.ts';
import TheDev from './TheDev.ts';

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

const skinColor = ref('#ffffff');
const hairColor = ref('#ffffff');

const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedRcas = reactive(new Array(8).fill(TheDev)); // No need for ref inside the array
const dropdownRcas = [TheDev, ...rca.rcas.sort((a, b) => a.name.localeCompare(b.name))]

const randomize = () => {
  selectedRcas.forEach((_ignore,index) => {
    selectedRcas[index] = dropdownRcas[Math.floor(Math.random() * dropdownRcas.length)]
  })
  selectedRcas[1] = selectedRcas[6] // have hairs matching
}

onMounted(() => {
  drawImages(selectedRcas,skinColor.value,hairColor.value)
})

const downloadCanvas = () => {
  if (canvasRef.value) {
    const link = document.createElement('a');
    link.download = 'canvas-image.png';
    link.href = canvasRef.value.toDataURL('image/png');
    link.click();
  }
};

watch([selectedRcas, skinColor, hairColor], ([selectedRcas,skinColor,hairColor]) => {
    drawImages(selectedRcas, skinColor, hairColor);
});

const loadPng = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

const loadAndModifySvg = async (
  src: string,
  modifyFn: ((svgContent: string) => string) | null = null
): Promise<HTMLImageElement> => {
  try {
    const response = await fetch(src, { method: "GET" });
    if (!response.ok) throw new Error(`Failed to fetch SVG: ${src}`);
    let svgContent = await response.text();
    svgContent = !modifyFn ? svgContent : modifyFn(svgContent);
    console.log(svgContent)
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        URL.revokeObjectURL(url); // Clean up the object URL
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load modified SVG: ${src}`));
      };
      img.src = url;
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

const replaceSvgColor = (svgContent: string, oldColor: string, newColor: string): string => {
  return svgContent.replace(
    new RegExp(`(fill|stroke):\\s*${oldColor};`, "gi"),
    (_, attribute) => `${attribute}: ${newColor};`
  );
};

const drawImages = async (mashupRcas: (rca.rca|typeof TheDev|null)[], skinColor:string, hairColor:string) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const replaceSkinColor = (svgContent: string) => replaceSvgColor(svgContent, 'lime', skinColor);
  const replaceHairColor = (svgContent: string) => replaceSvgColor(svgContent, 'blue', hairColor);

  const sources = [
    ...(mashupRcas[0] ? [
      mashupRcas[0].unofficial && mashupRcas[0].bg ? loadPng(mashupRcas[0].bg) : loadPng(rca.getBackdrop(mashupRcas[0]!as rca.rca))
    ] : []),
    ...(mashupRcas[1] && !mashupRcas[1].unofficial ? [
      loadAndModifySvg(rca.getResById(rca.getHairBottomId(mashupRcas[1]!as rca.rca)), replaceHairColor)
    ] : []),
    ...(mashupRcas[2] ? [
       mashupRcas[2].unofficial && mashupRcas[2].bg ? loadPng(mashupRcas[2].lower) : loadAndModifySvg(rca.getResById(rca.getBodyLowerId(mashupRcas[2]!as rca.rca)), replaceSkinColor)
    ] : []),
    ...(mashupRcas[3] ? [
       mashupRcas[3].unofficial && mashupRcas[3].upper? loadPng(mashupRcas[3].upper) : loadAndModifySvg(rca.getResById(rca.getBodyId(mashupRcas[3]!as rca.rca)), replaceSkinColor)
    ] : []),
    ...(mashupRcas[4]  && !mashupRcas[4].unofficial ? [
     loadAndModifySvg(rca.getResById(rca.getFaceLowerId(mashupRcas[4]! as rca.rca)), replaceSkinColor)
    ] : []),
    ...(mashupRcas[5]  && !mashupRcas[5].unofficial ? [
      loadAndModifySvg(rca.getResById(rca.getEyesId(mashupRcas[5]!as rca.rca)))
    ] : []),
    ...(mashupRcas[6]  && !mashupRcas[6].unofficial ? [
      loadAndModifySvg(rca.getResById(rca.getHairTopId(mashupRcas[6]!as rca.rca )), replaceHairColor)
    ] : []),
    ...(mashupRcas[7] ? [
      mashupRcas[7].unofficial && mashupRcas[7].hat ? loadPng(mashupRcas[7].hat) : loadAndModifySvg(rca.getResById(rca.getHatId(mashupRcas[7]!as rca.rca)))
    ] : []),
  ];
  const images = await Promise.all(sources.map(pr => pr.catch(e => {console.log(e);return null})));
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
.mashups .controls {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 2;
  text-align: right;
}

</style>

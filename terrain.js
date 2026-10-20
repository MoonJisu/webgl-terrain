import { fbm } from './noise.js';

const HEIGHT = 80;   // 산 높이
const FREQ = 0.01;   // 작을수록 지형이 넓게 펼쳐짐
const LIFT = 10;     // 전체를 올려서 물 비율 줄이기

function colorAt(h) {
    if (h <= 0) return [0.15, 0.35, 0.6];   // 물 (해수면 아래)
    if (h < 0.5) return [0.76, 0.7, 0.5];   // 모래 (~10m)
    if (h < 25) return [0.25, 0.5, 0.2];    // 풀 (~500m)
    if (h < 70) return [0.45, 0.42, 0.4];   // 바위 (~1,450m)
    return [0.95, 0.95, 0.97];              // 눈 (정상 부근)
  }

export function noiseHeights(n) {
    const heights = new Float32Array(n * n);
    for (let z = 0; z < n; z++)
      for (let x = 0; x < n; x++)
        heights[z * n + x] = Math.max(0, fbm(x * FREQ, z * FREQ) * HEIGHT + LIFT); // 0 미만은 수면으로 평평하게
    return heights;
  }
  
  // heights: 길이 n*n의 높이 배열 (z * n + x 순서)
  export function createTerrain(heights, n, scale = 1) {
    const size = n - 1; // 한 변의 사각형 수
    const half = (size * scale) / 2;

  const clamp = (v) => Math.min(n - 1, Math.max(0, v));
  const h = (x, z) => heights[clamp(z) * n + clamp(x)];

  const positions = new Float32Array(n * n * 3);
  const normals = new Float32Array(n * n * 3);
  const colors = new Float32Array(n * n * 3);

  for (let z = 0; z < n; z++)
    for (let x = 0; x < n; x++) {
      const i = (z * n + x) * 3;
      const y = h(x, z);
      positions.set([x * scale - half, y, z * scale - half], i);

      // 이웃 높이 차로 법선 계산 (중앙 차분)
      const nx = h(x - 1, z) - h(x + 1, z);
      const ny = 2 * scale;
      const nz = h(x, z - 1) - h(x, z + 1);
      const len = Math.hypot(nx, ny, nz);
      normals.set([nx / len, ny / len, nz / len], i);

      colors.set(colorAt(y), i);
    }

  const indices = new Uint32Array(size * size * 6);
  let k = 0;
  for (let z = 0; z < size; z++)
    for (let x = 0; x < size; x++) {
      const a = z * n + x, b = a + 1, c = a + n, d = c + 1;
      indices.set([a, c, b, b, c, d], k); // 사각형 하나 = 삼각형 두 개
      k += 6;
    }

  return { positions, normals, colors, indices };
}
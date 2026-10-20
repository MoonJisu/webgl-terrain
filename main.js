import { createProgram, vertexSrc, fragmentSrc } from './shaders.js';
import { createTerrain, noiseHeights } from './terrain.js';
import { loadTerrainTiles } from './geo/tiles.js';
import { perspective, multiply, normalize } from './mat4.js';
import { createCamera } from './camera.js';
import { createMarkers } from './markers.js';

const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('이 브라우저는 WebGL2를 지원하지 않아요');

const program = createProgram(gl, vertexSrc, fragmentSrc);
const EXAGGERATION = 3; // 실제 지형은 너비에 비해 낮아서 높이를 과장
const { heights, n, metersPerPixel, project } = await loadTerrainTiles(126.5292, 33.3617, 11); // 한라산
for (let i = 0; i < heights.length; i++) heights[i] = (heights[i] / metersPerPixel) * EXAGGERATION;
const terrain = createTerrain(heights, n);
// 대피소: 위경도 → 메시 좌표, 지형 범위 밖은 제외
const shelters = await (await fetch('data/shelters-jeju.json')).json();
const placed = shelters
  .map((s) => ({ ...s, ...project(s.lon, s.lat) }))
  .filter((s) => s.px >= 0 && s.py >= 0 && s.px <= n - 1 && s.py <= n - 1);
const markerPositions = new Float32Array(
  placed.flatMap((s) => [s.x, heights[Math.round(s.py) * n + Math.round(s.px)] + 2, s.z]) // 지면보다 살짝 위
);
const drawMarkers = createMarkers(gl, markerPositions, new Float32Array(placed.map((s) => s.elevation)));

// 정점 데이터 업로드: location 0 = 위치, 1 = 법선, 2 = 색
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
[terrain.positions, terrain.normals, terrain.colors].forEach((data, loc) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
});
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, terrain.indices, gl.STATIC_DRAW);

const uViewProj = gl.getUniformLocation(program, 'uViewProj');
const uLightDir = gl.getUniformLocation(program, 'uLightDir');
const uWaterLevel = gl.getUniformLocation(program, 'uWaterLevel');
const levelInput = document.getElementById('level');
const levelOutput = document.getElementById('level-value');
levelInput.addEventListener('input', () => {
  levelOutput.textContent = `${Number(levelInput.value).toFixed(1)}m`;
});
const lightDir = normalize([0.5, 0.8, 0.3]);
const camera = createCamera(canvas);

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.6, 0.75, 0.9, 1); // 하늘색

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1); // 탭 전환 후 순간이동 방지
  last = now;

  const w = Math.round(canvas.clientWidth * devicePixelRatio);
  const h = Math.round(canvas.clientHeight * devicePixelRatio);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, w, h);

  camera.update(dt);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  const viewProj = multiply(perspective(Math.PI / 3, w / h, 0.1, 2000), camera.viewMatrix());
  const levelMeters = Number(levelInput.value);
  gl.uniformMatrix4fv(uViewProj, false, viewProj);
  gl.uniform3fv(uLightDir, lightDir);
  // 미터 → 메시 단위 (높이와 같은 변환)
  gl.uniform1f(uWaterLevel, (levelMeters / metersPerPixel) * EXAGGERATION);
  gl.bindVertexArray(vao);
  gl.drawElements(gl.TRIANGLES, terrain.indices.length, gl.UNSIGNED_INT, 0);

  drawMarkers(viewProj, levelMeters);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
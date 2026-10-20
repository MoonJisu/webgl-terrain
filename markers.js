import { createProgram } from './shaders.js';

const vertexSrc = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aElevation; // 대피소 해발고도 (m)

uniform mat4 uViewProj;
uniform float uWaterLevel; // 수위 (m)

out vec3 vColor;

void main() {
  float margin = aElevation - uWaterLevel; // 물이 닿기까지 남은 높이
  vColor = margin <= 0.0 ? vec3(0.9, 0.2, 0.2)    // 침수
         : margin <= 1.0 ? vec3(0.95, 0.8, 0.2)   // 위험 (1m 이내)
         :                 vec3(0.2, 0.8, 0.3);   // 안전
  gl_Position = uViewProj * vec4(aPosition, 1.0);
  gl_PointSize = 14.0;
}`;

const fragmentSrc = `#version 300 es
precision highp float;

in vec3 vColor;
out vec4 outColor;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  if (dot(p, p) > 0.25) discard; // 사각형 점을 원으로 깎기
  outColor = vec4(vColor, 1.0);
}`;

export function createMarkers(gl, positions, elevations) {
  const program = createProgram(gl, vertexSrc, fragmentSrc);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  [[positions, 3], [elevations, 1]].forEach(([data, size], loc) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  });
  gl.bindVertexArray(null);

  const uViewProj = gl.getUniformLocation(program, 'uViewProj');
  const uWaterLevel = gl.getUniformLocation(program, 'uWaterLevel');

  function draw(viewProj, waterLevelMeters) {
    gl.useProgram(program);
    gl.uniformMatrix4fv(uViewProj, false, viewProj);
    gl.uniform1f(uWaterLevel, waterLevelMeters);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, elevations.length);
  }

  // 화면 좌표(x, y)에서 radius 픽셀 안의 가장 가까운 마커 번호, 없으면 -1
  // shortcut: 산에 가려진 마커도 선택됨, 마커가 많아지면 깊이까지 비교
  function pick(viewProj, x, y, width, height, radius = 15) {
    const m = viewProj;
    let best = -1, bestDist = radius;
    for (let i = 0; i < elevations.length; i++) {
      const [px, py, pz] = positions.subarray(i * 3, i * 3 + 3);
      const w = m[3] * px + m[7] * py + m[11] * pz + m[15];
      if (w <= 0) continue; // 카메라 뒤쪽
      const sx = (((m[0] * px + m[4] * py + m[8] * pz + m[12]) / w) * 0.5 + 0.5) * width;
      const sy = (0.5 - ((m[1] * px + m[5] * py + m[9] * pz + m[13]) / w) * 0.5) * height;
      const d = Math.hypot(sx - x, sy - y);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  return { draw, pick };
}
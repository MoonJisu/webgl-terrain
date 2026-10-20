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

  return function draw(viewProj, waterLevelMeters) {
    gl.useProgram(program);
    gl.uniformMatrix4fv(uViewProj, false, viewProj);
    gl.uniform1f(uWaterLevel, waterLevelMeters);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, elevations.length);
  };
}
// 주의: 백틱 바로 뒤에 #version이 와야 함 (앞에 줄바꿈이 있으면 컴파일 실패)
export const vertexSrc = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;

uniform mat4 uViewProj;

out vec3 vNormal;
out vec3 vColor;
out float vHeight; 

void main() {
  vNormal = aNormal;
  vColor = aColor;
  vHeight = aPosition.y; 
  gl_Position = uViewProj * vec4(aPosition, 1.0);
}`;

export const fragmentSrc = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vColor;
in float vHeight;

uniform vec3 uLightDir;
uniform float uWaterLevel; // 메시 단위로 변환된 수위

out vec4 outColor;

const vec3 SEA = vec3(0.1, 0.3, 0.55);   // 원래 바다
const vec3 FLOOD = vec3(0.3, 0.7, 0.95); // 새로 잠긴 땅

void main() {
  float diffuse = max(dot(normalize(vNormal), uLightDir), 0.0);
  vec3 color = vColor * (0.3 + 0.7 * diffuse);

  float depth = uWaterLevel - vHeight;
  if (depth >= 0.0) {
    vec3 water = vHeight <= 0.0 ? SEA : FLOOD; // 해발 0m 이하 = 원래 바다
    color = mix(color, water, clamp(0.6 + depth * 0.05, 0.6, 0.95)); // 깊을수록 진하게
  }
  outColor = vec4(color, 1.0);
}`;

export function createProgram(gl, vsSrc, fsSrc) {
  const program = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vsSrc], [gl.FRAGMENT_SHADER, fsSrc]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}
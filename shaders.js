// 주의: 백틱 바로 뒤에 #version이 와야 함 (앞에 줄바꿈이 있으면 컴파일 실패)
export const vertexSrc = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;

uniform mat4 uViewProj;

out vec3 vNormal;
out vec3 vColor;

void main() {
  vNormal = aNormal;
  vColor = aColor;
  gl_Position = uViewProj * vec4(aPosition, 1.0);
}`;

export const fragmentSrc = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vColor;

uniform vec3 uLightDir; // 표면에서 태양을 향하는 방향

out vec4 outColor;

void main() {
  float diffuse = max(dot(normalize(vNormal), uLightDir), 0.0);
  outColor = vec4(vColor * (0.3 + 0.7 * diffuse), 1.0);
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
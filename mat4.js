// 모든 행렬은 Float32Array(16), 열 우선(column-major)

export function perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }
  
  export function lookAt(eye, target, up) {
    const z = normalize(sub(eye, target));
    const x = normalize(cross(up, z));
    const y = cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
    ]);
  }
  
  export function multiply(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        out[c * 4 + r] = s;
      }
    return out;
  }
  
  export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  export const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  export const normalize = (v) => {
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  
  // self-check: 근평면(z = -near)의 점은 NDC z = -1이 되어야 함
  {
    const p = perspective(1, 1, 0.1, 100);
    console.assert(Math.abs((p[10] * -0.1 + p[14]) / 0.1 + 1) < 1e-6, 'perspective 오류');
  }
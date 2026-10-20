import { lookAt, cross, normalize } from './mat4.js';

const UP = [0, 1, 0];

export function createCamera(canvas) {
  const position = [0, 60, 150];
  let yaw = -Math.PI / 2; // -z 방향(지형 중앙)을 바라봄
  let pitch = -0.3;
  const keys = new Set();

  addEventListener('keydown', (e) => keys.add(e.code));
  addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('click', () => canvas.requestPointerLock());
  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return;
    yaw += e.movementX * 0.002;
    pitch = Math.max(-1.5, Math.min(1.5, pitch - e.movementY * 0.002)); // 수직을 넘지 않게 제한
  });

  const forward = () => [
    Math.cos(pitch) * Math.cos(yaw),
    Math.sin(pitch),
    Math.cos(pitch) * Math.sin(yaw),
  ];

  function update(dt) {
    const f = forward();
    const r = normalize(cross(f, UP));
    const speed = (keys.has('ShiftLeft') ? 150 : 50) * dt;
    const move = (v, s) => { for (let i = 0; i < 3; i++) position[i] += v[i] * s; };

    if (keys.has('KeyW')) move(f, speed);
    if (keys.has('KeyS')) move(f, -speed);
    if (keys.has('KeyD')) move(r, speed);
    if (keys.has('KeyA')) move(r, -speed);
    if (keys.has('KeyE')) position[1] += speed;
    if (keys.has('KeyQ')) position[1] -= speed;
  }

  function viewMatrix() {
    const f = forward();
    return lookAt(position, [position[0] + f[0], position[1] + f[1], position[2] + f[2]], UP);
  }

  return { update, viewMatrix, position };
}
import { lookAt } from './mat4.js';

const UP = [0, 1, 0];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// 오빗 카메라: target을 중심으로 yaw(좌우)·pitch(위아래)·distance(거리)로 위치 결정
export function createCamera(canvas) {
  const target = [0, 0, 0];   // 바라보는 중심점
  const position = [0, 0, 0];
  let yaw = Math.PI / 2;      // 남쪽에서 북쪽을 바라봄
  let pitch = 0.5;            // 내려다보는 각도 (라디안)
  let distance = 600;
  let dragging = false;
  let moved = 0;              // 이번 드래그에서 움직인 거리 (클릭과 구분용)
  const keys = new Set();

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = 0;
    canvas.setPointerCapture(e.pointerId); // 캔버스 밖으로 나가도 드래그 유지
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    yaw -= e.movementX * 0.005;
    pitch = clamp(pitch + e.movementY * 0.005, 0.05, 1.5); // 땅 밑으로, 수직 넘어로 가지 않게
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // 페이지 스크롤 막기
    distance = clamp(distance * Math.exp(e.deltaY * 0.001), 50, 1500);
  }, { passive: false });

  addEventListener('keydown', (e) => keys.add(e.code));
  addEventListener('keyup', (e) => keys.delete(e.code));

  function update(dt) {
    // WASD: 화면 기준 앞·옆으로 중심점 이동 (멀리서 볼수록 빠르게)
    const speed = distance * dt;
    const fx = -Math.cos(yaw), fz = -Math.sin(yaw); // 지면 위 앞쪽 방향
    if (keys.has('KeyW')) { target[0] += fx * speed; target[2] += fz * speed; }
    if (keys.has('KeyS')) { target[0] -= fx * speed; target[2] -= fz * speed; }
    if (keys.has('KeyD')) { target[0] -= fz * speed; target[2] += fx * speed; }
    if (keys.has('KeyA')) { target[0] += fz * speed; target[2] -= fx * speed; }

    position[0] = target[0] + distance * Math.cos(pitch) * Math.cos(yaw);
    position[1] = target[1] + distance * Math.sin(pitch);
    position[2] = target[2] + distance * Math.cos(pitch) * Math.sin(yaw);
  }

  return {
    update,
    viewMatrix: () => lookAt(position, target, UP),
    position,
    get dragged() { return moved > 3; }, // 3픽셀 넘게 움직였으면 클릭이 아니라 드래그
  };
}
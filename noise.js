// 2D Simplex 노이즈 (Stefan Gustavson 방식)
const grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
const perm = new Uint8Array(512);
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

// 0~255 숫자를 섞어서 순열표 perm을 생성. 시드가 같으면 항상 같은 순열표가 생성됨 -> 같은 지형이 재현
export function seed(s = 1) {
  s = s % 2147483647 || 1;
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647; // 간단한 난수 생성기
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
seed();

// 2D Simplex 노이즈 계산
// 공간을 삼각형 격자로 나누고 점이 속한 삼각형의 꼭짓점 3개를 찾아서 각 꼭짓점에서의 기여도를 합산
export function noise2D(x, y) {
  const s = (x + y) * F2;
  const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t), y0 = y - (j - t);
  const [i1, j1] = x0 > y0 ? [1, 0] : [0, 1];
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;

  const corner = (gi, dx, dy) => {
    const t = 0.5 - dx * dx - dy * dy;
    if (t < 0) return 0;
    const g = grad[gi & 7];
    return t ** 4 * (g[0] * dx + g[1] * dy);
  };

  return 70 * (
    corner(perm[ii + perm[jj]], x0, y0) +
    corner(perm[ii + i1 + perm[jj + j1]], x1, y1) +
    corner(perm[ii + 1 + perm[jj + 1]], x2, y2)
  );
}

// 노이즈를 6겹 쌓음. 겹마다 주파수는 2배, 진폭은 절반
export function fbm(x, y, octaves = 6) {
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2D(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm; // 대략 -1 ~ 1
}
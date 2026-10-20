export const WARNING_MARGIN = 1; // m, markers.js 셰이더의 1.0과 같아야 함

// 대피소 상태: 'flooded' | 'warning' | 'safe'
export function shelterStatus(elevation, level) {
  const margin = elevation - level;
  return margin <= 0 ? 'flooded' : margin <= WARNING_MARGIN ? 'warning' : 'safe';
}

// 새로 잠긴 땅의 면적 (원래 바다는 제외)
// heights와 levelUnits는 메시 단위, metersPerPixel은 픽셀 한 칸의 실제 길이
export function floodedAreaKm2(heights, levelUnits, metersPerPixel) {
  let count = 0;
  for (const h of heights) if (h > 0 && h <= levelUnits) count++;
  return (count * metersPerPixel ** 2) / 1e6;
}

// self-check
console.assert(shelterStatus(3, 3.5) === 'flooded', 'flooded');
console.assert(shelterStatus(4, 3.5) === 'warning', 'warning');
console.assert(shelterStatus(8, 3.5) === 'safe', 'safe');
console.assert(floodedAreaKm2(new Float32Array([0, 1, 2, 5]), 2, 1000) === 2, 'area');
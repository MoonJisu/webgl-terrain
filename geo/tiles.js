const TILE = 256;
const EARTH_CIRCUMFERENCE = 40075016.686; // 적도 둘레 (m)
const tileUrl = (z, x, y) =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

// 위경도 → 타일 번호 (Web Mercator)
export function lonLatToTile(lon, lat, z) {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return {
    x: Math.floor(((lon + 180) / 360) * n),
    y: Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n),
  };
}

// 타일 PNG 한 장 → 높이 배열 (미터, 256×256)
async function loadTile(z, x, y) {
  const res = await fetch(tileUrl(z, x, y));
  if (!res.ok) throw new Error(`타일 로딩 실패 ${z}/${x}/${y}: ${res.status}`);
  // 색 보정이 들어가면 높이값이 틀어지므로 끔
  const bitmap = await createImageBitmap(await res.blob(), {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  });
  const ctx = new OffscreenCanvas(TILE, TILE).getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const px = ctx.getImageData(0, 0, TILE, TILE).data;

  const heights = new Float32Array(TILE * TILE);
  for (let i = 0; i < heights.length; i++)
    heights[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768; // Terrarium 인코딩
  return heights;
}

// 중심 타일 주변 3×3장을 이어 붙인 높이 배열
export async function loadTerrainTiles(lon, lat, z) {
  const center = lonLatToTile(lon, lat, z);
  const n = TILE * 3;
  const heights = new Float32Array(n * n);

  const jobs = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      jobs.push(
        loadTile(z, center.x + dx, center.y + dy).then((tile) => {
          const ox = (dx + 1) * TILE, oy = (dy + 1) * TILE;
          for (let row = 0; row < TILE; row++)
            heights.set(tile.subarray(row * TILE, (row + 1) * TILE), (oy + row) * n + ox);
        })
      );
  await Promise.all(jobs); // 9장 동시에 요청

  const metersPerPixel = (EARTH_CIRCUMFERENCE * Math.cos((lat * Math.PI) / 180)) / (TILE * 2 ** z);
  return { heights, n, metersPerPixel };
}
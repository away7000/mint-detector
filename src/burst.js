const map = {};

export function trackBurst(contract) {
  const now = Date.now();

  if (!map[contract]) {
    map[contract] = [];
  }

  map[contract].push(now);

  // simpan 30 detik terakhir
  map[contract] = map[contract].filter(
    (t) => now - t < 30000
  );

  return map[contract].length;
}

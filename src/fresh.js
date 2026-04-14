const seen = {};

export function isFresh(contract) {
  const now = Date.now();

  if (!seen[contract]) {
    seen[contract] = now;
    return true;
  }

  return false;
}

// cek apakah masih early (5 menit pertama)
export function isEarly(contract) {
  const now = Date.now();

  if (!seen[contract]) return false;

  return now - seen[contract] < 5 * 60 * 1000;
}

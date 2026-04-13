export const mintTracker = {};
export const contractFirstSeen = {};

export function trackMint(contract) {
  if (!mintTracker[contract]) {
    mintTracker[contract] = 0;
  }
  mintTracker[contract]++;
}

export function getMintCount(contract) {
  return mintTracker[contract] || 0;
}

export function resetMint(contract) {
  mintTracker[contract] = 0;
}

export function trackContract(contract) {
  if (!contractFirstSeen[contract]) {
    contractFirstSeen[contract] = Date.now();
  }
}

export function getContractAge(contract) {
  if (!contractFirstSeen[contract]) return 0;
  return (Date.now() - contractFirstSeen[contract]) / 1000;
}
import { CONFIG } from "./config.js";
import { getContractAge } from "./tracker.js";

export function isValidMint(tx, contract) {
  if (tx.value == 0n) return false;

  const eth = Number(tx.value) / 1e18;
  if (eth < CONFIG.MIN_ETH) return false;

  const age = getContractAge(contract);
  if (age > CONFIG.MAX_CONTRACT_AGE) return false;

  return true;
}
import { ethers } from "ethers";

export function formatETH(value) {
  return ethers.formatEther(value);
}
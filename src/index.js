import "dotenv/config";
import { ethers } from "ethers";
import { CONFIG } from "./config.js";
import {
  trackMint,
  getMintCount,
  resetMint,
  trackContract,
} from "./tracker.js";
import { isValidMint } from "./filters.js";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

console.log("🚀 Alpha Mint Detector Running...");

// ==========================
// MAIN LISTENER (MEMPOOL)
// ==========================
provider.on("pending", async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) return;

    const contract = tx.to.toLowerCase();

    // track contract first seen
    trackContract(contract);

    // filter mint
    if (!isValidMint(tx, contract)) return;

    // track mint
    trackMint(contract);
    const count = getMintCount(contract);

    // burst detection
    if (count >= CONFIG.BURST_THRESHOLD) {
      const msg = `
🔥 <b>ALPHA MINT DETECTED</b>

Contract: <code>${contract}</code>
Mints: ${count}
Value: ${formatETH(tx.value)} ETH

Tx: https://etherscan.io/tx/${tx.hash}
`;

      await sendAlert(msg);

      // reset biar ga spam
      resetMint(contract);
    }
  } catch (err) {
    // silent error biar ga crash
  }
});

// ==========================
// KEEP ALIVE LOG
// ==========================
setInterval(() => {
  console.log("🟢 still alive", new Date().toISOString());
}, 60000);

// ==========================
// ERROR HANDLING (ethers v6 safe)
// ==========================
provider.on("error", (err) => {
  console.log("⚠️ Provider error:", err.message);
});

// ==========================
// WATCHDOG (ANTI FREEZE)
// ==========================
let lastBlock = Date.now();

provider.on("block", () => {
  lastBlock = Date.now();
});

// kalau ga dapet block → restart
setInterval(() => {
  const now = Date.now();

  if (now - lastBlock > 60000) {
    console.log("💀 No block detected. Restarting...");
    process.exit(1); // Railway auto restart
  }
}, 30000);

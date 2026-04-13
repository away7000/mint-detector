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

provider.on("pending", async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) return;

    const contract = tx.to.toLowerCase();

    trackContract(contract);

    if (!isValidMint(tx, contract)) return;

    trackMint(contract);
    const count = getMintCount(contract);

    if (count >= CONFIG.BURST_THRESHOLD) {
      const msg = `
🔥 <b>ALPHA MINT DETECTED</b>

Contract: <code>${contract}</code>
Mints: ${count}
Value: ${formatETH(tx.value)} ETH

Tx: https://etherscan.io/tx/${tx.hash}
`;

      await sendAlert(msg);
      resetMint(contract);
    }
  } catch (err) {}
});

// keep alive
setInterval(() => {
  console.log("🟢 still alive", new Date().toISOString());
}, 60000);

provider._websocket.on("close", () => {
  console.log("❌ WS closed. Restarting...");
  process.exit(1);
});

provider._websocket.on("error", () => {
  console.log("⚠️ WS error");
});
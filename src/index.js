import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

// SeaDrop contract (OpenSea mint)
const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 SeaDrop Mint Detector Running...");

// ==========================
// LISTEN MEMPOOL
// ==========================
provider.on("pending", async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) return;

    const to = tx.to.toLowerCase();

    // hanya SeaDrop
    if (to !== SEADROP) return;

    // skip kalau ga ada value
    if (tx.value == 0n) return;

    const eth = Number(tx.value) / 1e18;

    // filter kecil biar ga noise
    if (eth < 0.01) return;

    const contract = tx.to.toLowerCase();

    // ambil info dari OpenSea API
    const info = await getCollection(contract);

    const name = info?.name || "Unknown Collection";
    const url =
      info?.url || `https://opensea.io/assets/ethereum/${contract}`;
    const price = formatETH(tx.value);

    const message = `
🔥 <b>NEW MINT LIVE</b>

🎨 Collection: <b>${name}</b>
💰 Price: ${price} ETH

🔗 Mint:
${url}

📜 Contract:
<code>${contract}</code>
`;

    await sendAlert(message);
  } catch (err) {
    // biar ga crash
  }
});

// ==========================
// KEEP ALIVE
// ==========================
setInterval(() => {
  console.log("🟢 still alive", new Date().toISOString());
}, 60000);

// ==========================
// ERROR HANDLER
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

setInterval(() => {
  if (Date.now() - lastBlock > 60000) {
    console.log("💀 No block detected. Restarting...");
    process.exit(1);
  }
}, 30000);

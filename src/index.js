import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

// SeaDrop contract
const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 SeaDrop Mint Detector Running...");

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
    if (eth < 0.01) return;

    // ==========================
    // 🔥 DECODE NFT CONTRACT
    // ==========================
    let nftContract;

    try {
      nftContract = "0x" + tx.data.slice(34, 74);
    } catch {
      return;
    }

    // ==========================
    // 🔥 GET OPENSEA DATA
    // ==========================
    const info = await getCollection(nftContract);

    const name = info?.name || "Unknown Collection";
    const url =
      info?.url || `https://opensea.io/assets/ethereum/${nftContract}`;
    const price = formatETH(tx.value);

    // ==========================
    // 🔥 OUTPUT
    // ==========================
    const message = `
🔥 <b>NEW MINT LIVE</b>

🎨 Collection: <b>${name}</b>
💰 Price: ${price} ETH

🔗 Mint:
${url}

📜 Contract:
<code>${nftContract}</code>
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

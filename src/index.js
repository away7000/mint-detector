import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 SeaDrop Detector (WSS MODE)...");

// ==========================
// RETRY GET TX (ANTI RPC ERROR)
// ==========================
async function getTx(hash, retry = 3) {
  for (let i = 0; i < retry; i++) {
    try {
      const tx = await provider.getTransaction(hash);
      if (tx) return tx;
    } catch (e) {
      console.log("⚠️ retry tx...", i + 1);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return null;
}

// ==========================
// LISTEN MEMPOOL
// ==========================
provider.on("pending", async (txHash) => {
  try {
    if (!txHash) return;

    const tx = await getTx(txHash);
    if (!tx || !tx.to || !tx.data) return;

    // hanya SeaDrop
    if (tx.to.toLowerCase() !== SEADROP) return;

    console.log("🔥 SeaDrop TX detected");

    const price = formatETH(tx.value);

    // ==========================
    // 🔥 MANUAL DECODE
    // ==========================
    const methodId = tx.data.slice(0, 10);
    const chunks = tx.data.slice(10);

    let nftContract = "Unknown";

    if (chunks.length >= 64) {
      nftContract = "0x" + chunks.slice(24, 64);
    }

    const minter = tx.from;

    let quantity = "?";
    if (chunks.length >= 128) {
      try {
        quantity = parseInt(chunks.slice(64, 128), 16);
      } catch {}
    }

    // ==========================
    // 🔥 FILTER FREE MINT ONLY
    // ==========================
    if (tx.value !== 0n) return;

    // ==========================
    // 🔥 OPENSEA DATA
    // ==========================
    let name = "Unknown Collection";
    let url = "https://opensea.io";

    if (nftContract !== "Unknown") {
      const info = await getCollection(nftContract);

      name = info?.name || "Unknown Collection";
      url =
        info?.url ||
        `https://opensea.io/assets/ethereum/${nftContract}`;
    }

    // ==========================
    // 🚀 OUTPUT
    // ==========================
    const message = `
🆓 <b>FREE MINT LIVE</b>

🎨 Collection: <b>${name}</b>
📦 Qty: ${quantity}

🔗 Mint:
${url}

👤 Minter:
<code>${minter}</code>

📜 Contract:
<code>${nftContract}</code>
`;

    await sendAlert(message);

  } catch (err) {
    console.log("error:", err.message);
  }
});

// ==========================
// KEEP ALIVE (BIAR RAILWAY GA MATI)
// ==========================
setInterval(() => {
  console.log("🟢 alive", new Date().toISOString());
}, 60000);

// ==========================
// ERROR HANDLER
// ==========================
provider.on("error", (err) => {
  console.log("⚠️ provider error:", err.message);
});

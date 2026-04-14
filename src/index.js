import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";
import { isFresh } from "./fresh.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

// SeaDrop contract
const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 SeaDrop Detector (ANTI MISS MODE)...");

provider.on("pending", async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to || !tx.data) return;

    // hanya SeaDrop
    if (tx.to.toLowerCase() !== SEADROP) return;

    const price = formatETH(tx.value);

    // ==========================
    // 🔥 MANUAL DECODE (NO FAIL)
    // ==========================

    const methodId = tx.data.slice(0, 10);
    const chunks = tx.data.slice(10);

    // ambil NFT contract (slot pertama)
    let nftContract = "Unknown";

    if (chunks.length >= 64) {
      nftContract = "0x" + chunks.slice(24, 64);
    }

    if (nftContract !== "Unknown") {

    const fresh = isFresh(nftContract);

    if (!fresh) {
    // skip kalau bukan mint baru
    return;
  }
}
    // minter
    const minter = tx.from;

    // quantity
    let quantity = "?";

    if (chunks.length >= 128) {
      try {
        quantity = parseInt(chunks.slice(64, 128), 16);
      } catch {}
    }

    // detect type kasar
    let mintType = "UNKNOWN";

    if (methodId === "0x84bb1e42") mintType = "PUBLIC";
    if (methodId === "0x9a1fc3a7") mintType = "WHITELIST";

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
🔥 <b>NEW MINT LIVE (SEADROP)</b>

🎨 Collection: <b>${name}</b>
💰 Price: ${price} ETH
🧠 Type: ${mintType}
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
// KEEP ALIVE
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

// ==========================
// WATCHDOG (ANTI FREEZE)
// ==========================
let lastBlock = Date.now();

provider.on("block", () => {
  lastBlock = Date.now();
});

setInterval(() => {
  if (Date.now() - lastBlock > 60000) {
    console.log("💀 restart...");
    process.exit(1);
  }
}, 30000);

import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";

const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTPS);

const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 SeaDrop Detector (HTTPS MODE)...");

// ==========================
// LISTEN BLOCK (BUKAN MEMPOOL)
// ==========================
provider.on("block", async (blockNumber) => {
  try {
    console.log("📦 Block:", blockNumber);

    const block = await provider.getBlock(blockNumber, true);

    for (const tx of block.transactions) {
      if (!tx.to) continue;

      // hanya SeaDrop
      if (tx.to.toLowerCase() !== SEADROP) continue;

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
🆓 <b>FREE MINT LIVE</b>

🎨 Collection: <b>${name}</b>
📦 Qty: ${quantity}

🔗 Mint:
${url}

📜 Contract:
<code>${nftContract}</code>
`;

      await sendAlert(message);
    }
  } catch (err) {
    console.log("error:", err.message);
  }
});

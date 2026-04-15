import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";

const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTPS);

const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 SeaDrop Detector (POLLING MODE)...");

let lastBlock = 0;

// ==========================
// LOOP POLLING
// ==========================
async function loop() {
  try {
    const blockNumber = await provider.getBlockNumber();

    if (blockNumber === lastBlock) return;

    console.log("📦 New Block:", blockNumber);

    const block = await provider.getBlock(blockNumber, true);

    lastBlock = blockNumber;

    for (const tx of block.transactions) {
      if (!tx.to) continue;

      if (tx.to.toLowerCase() !== SEADROP) continue;

      console.log("🔥 SeaDrop TX detected");

      const price = formatETH(tx.value);

      // ==========================
      // DECODE
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
      // OPENSEA
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
      // OUTPUT
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
}

// ==========================
// RUN LOOP
// ==========================
setInterval(loop, 3000); // tiap 3 detik

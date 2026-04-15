import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { getCollection } from "./opensea.js";
import { trackBurst } from "./burst.js";
import { getScore, getVerdict } from "./scoring.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 SeaDrop Detector (FINAL UI MODE)...");

// ==========================
// RETRY TX (ANTI ERROR)
// ==========================
async function getTx(hash, retry = 2) {
  for (let i = 0; i < retry; i++) {
    try {
      const tx = await provider.getTransaction(hash);
      if (tx) return tx;
    } catch {}

    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

// ==========================
// LIMIT BIAR GA OVERLOAD
// ==========================
let processing = 0;
const MAX_CONCURRENT = 5;

// ==========================
// LISTEN MEMPOOL
// ==========================
provider.on("pending", async (txHash) => {
  if (processing >= MAX_CONCURRENT) return;
  if (!txHash) return;

  processing++;

  try {
    const tx = await getTx(txHash);
    if (!tx || !tx.to || !tx.data) return;

    // hanya SeaDrop
    if (tx.to.toLowerCase() !== SEADROP) return;

    // hanya FREE MINT
    if (tx.value !== 0n) return;

    console.log("🔥 FREE MINT DETECTED");

    // ==========================
    // DECODE MANUAL
    // ==========================
    const chunks = tx.data.slice(10);

    let nftContract = "Unknown";

    if (chunks.length >= 64) {
      nftContract = "0x" + chunks.slice(24, 64);
    }

    const minter = tx.from;

    let quantity = "?";
    try {
      quantity = parseInt(chunks.slice(64, 128), 16);
    } catch {}

    // ==========================
    // OPENSEA DATA
    // ==========================
    let name = "Unknown";
    let url = "https://opensea.io";

    if (nftContract !== "Unknown") {
      const info = await getCollection(nftContract);

      name = info?.name || "Unknown";
      url =
        info?.url ||
        `https://opensea.io/assets/ethereum/${nftContract}`;
    }

    // ==========================
    // FINAL UI (KAYAK GAMBAR)
    // ==========================
    const message = `
🚨 <b>FREEMINT NOW (Public)</b> 🚨

<b>Name:</b> ${name}
<b>Chain:</b> Ethereum
💎 <b>Price:</b> FREEMINT (Public)
<b>Status:</b> 🔥 Minting Now

🧠 <b>Score:</b> ${score}/100
📊 <b>Verdict:</b> ${verdict}
⚡ <b>Burst:</b> ${burst}/30s

🖼 <a href="${url}">View on OpenSea</a>
🔍 <a href="https://etherscan.io/address/${nftContract}">View on Explorer</a>
`;

    await sendAlert(message);

  } catch (err) {
    console.log("error:", err.message);
  }

  processing--;
});

    const burst = trackBurst(nftContract);

    const hasTwitter = !!info?.twitter;
    const hasDiscord = !!info?.discord;

    const score = getScore({
    hasTwitter,
    hasDiscord,
    burst
});

    const verdict = getVerdict(score);

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

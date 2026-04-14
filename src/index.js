import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";
import { SEADROP_ABI } from "./abi/seadrop.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

const iface = new ethers.Interface(SEADROP_ABI);

console.log("🚀 SeaDrop Detector Running (NO MISS MODE)...");

provider.on("pending", async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) return;

    // hanya SeaDrop
    if (tx.to.toLowerCase() !== SEADROP) return;

    const price = formatETH(tx.value);

    let nftContract = "Unknown";
    let minter = tx.from;
    let quantity = "?";
    let mintType = "UNKNOWN";

    // ==========================
    // 🔥 TRY DECODE (kalau gagal tetap lanjut)
    // ==========================
    try {
      const decoded = iface.parseTransaction({
        data: tx.data,
        value: tx.value
      });

      nftContract = decoded.args[0];
      minter = decoded.args[1];
      quantity = decoded.args[2];

      if (decoded.name === "mintPublic") mintType = "PUBLIC";
      if (decoded.name === "mintAllowed") mintType = "WHITELIST";
      if (decoded.name === "mintSigned") mintType = "SIGNED";

    } catch {
      console.log("⚠️ decode gagal, fallback mode:", tx.hash);
    }

    // ==========================
    // 🔥 OPENSEA DATA (optional)
    // ==========================
    const info =
      nftContract !== "Unknown"
        ? await getCollection(nftContract)
        : null;

    const name = info?.name || "Unknown Collection";
    const url =
      nftContract !== "Unknown"
        ? info?.url || `https://opensea.io/assets/ethereum/${nftContract}`
        : "https://opensea.io";

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

  } catch (err) {}
});

// keep alive
setInterval(() => {
  console.log("🟢 alive", new Date().toISOString());
}, 60000);

// watchdog
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

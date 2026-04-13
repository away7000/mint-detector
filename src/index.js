import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";
import { SEADROP_ABI } from "./abi/seadrop.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

const SEADROP = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

// decoder
const iface = new ethers.Interface(SEADROP_ABI);

console.log("🚀 SeaDrop PRO Detector Running...");

provider.on("pending", async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to || !tx.data) return;

    if (tx.to.toLowerCase() !== SEADROP) return;
    if (tx.value == 0n) return;

    const eth = Number(tx.value) / 1e18;
    if (eth < 0.01) return;

    let decoded;
    try {
      decoded = iface.parseTransaction({
        data: tx.data,
        value: tx.value
      });
    } catch {
      return; // bukan mint function
    }

    // ==========================
    // 🔥 AMBIL DATA
    // ==========================
    const nftContract = decoded.args[0];
    const minter = decoded.args[1];
    const quantity = decoded.args[2];

    const method = decoded.name;

    // ==========================
    // 🧠 TYPE DETECTION
    // ==========================
    let mintType = "UNKNOWN";

    if (method === "mintPublic") mintType = "PUBLIC";
    if (method === "mintAllowed") mintType = "WHITELIST";
    if (method === "mintSigned") mintType = "SIGNED";

    // ==========================
    // 🔥 OPENSEA DATA
    // ==========================
    const info = await getCollection(nftContract);

    const name = info?.name || "Unknown Collection";
    const url =
      info?.url || `https://opensea.io/assets/ethereum/${nftContract}`;
    const price = formatETH(tx.value);

    // ==========================
    // 🚀 OUTPUT
    // ==========================
    const message = `
🔥 <b>NEW MINT LIVE</b>

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
  console.log("🟢 still alive", new Date().toISOString());
}, 60000);

// error handler
provider.on("error", (err) => {
  console.log("⚠️ Provider error:", err.message);
});

// watchdog
let lastBlock = Date.now();

provider.on("block", () => {
  lastBlock = Date.now();
});

setInterval(() => {
  if (Date.now() - lastBlock > 60000) {
    console.log("💀 Restarting...");
    process.exit(1);
  }
}, 30000);

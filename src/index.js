import "dotenv/config";
import { ethers } from "ethers";
import { sendAlert } from "./telegram.js";
import { formatETH } from "./utils.js";
import { getCollection } from "./opensea.js";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

// Seaport contract
const SEAPORT = "0x00005ea00ac477b1030ce78506496e8c2de24bf5";

console.log("🚀 Seaport Monitor Running...");

// ==========================
// LISTEN MEMPOOL
// ==========================
provider.on("pending", async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) return;

    const to = tx.to.toLowerCase();

    // ✅ hanya Seaport
    if (to !== SEAPORT) return;

    // skip tx tanpa value
    if (tx.value == 0n) return;

    const eth = Number(tx.value) / 1e18;

    // filter kecil biar ga noise
    if (eth < 0.01) return;

    const msg = `
🔥 <b>OPENSEA BUY DETECTED</b>

Value: ${formatETH(tx.value)} ETH
From: <code>${tx.from}</code>

Tx:
https://etherscan.io/tx/${tx.hash}
`;
    
const info = await getCollection(contract);

let extra = "";

if (info) {
  extra = `
Collection: <b>${info.name}</b>
OpenSea: ${info.url}
`;
}

const msg = `
🔥 <b>SEADROP MINT DETECTED</b>

${extra}
Value: ${formatETH(tx.value)} ETH
Minter: <code>${tx.from}</code>

Tx:
https://etherscan.io/tx/${tx.hash}
`;

await sendAlert(msg);
    await sendAlert(msg);
  } catch (err) {}
});

import "dotenv/config";

const API_KEY = process.env.OPENSEA_API_KEY;

// cache biar ga spam API
const cache = {};

export async function getCollection(contract) {
  try {
    // cache hit
    if (cache[contract]) {
      return cache[contract];
    }

    const res = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/contract/${contract}`,
      {
        headers: {
          "X-API-KEY": API_KEY,
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    const result = {
      name: data?.collection || "Unknown",
      url: `https://opensea.io/assets/ethereum/${contract}`,
    };

    // simpan ke cache
    cache[contract] = result;

    return result;
  } catch (e) {
    return null;
  }
}

import "dotenv/config";

const API_KEY = process.env.OPENSEA_API_KEY;

export async function getCollection(contract) {
  try {
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

    return {
      name: data?.collection || "Unknown",
      slug: data?.collection, // kadang sama
      url: `https://opensea.io/collection/${data?.collection}`,
    };
  } catch (e) {
    return null;
  }
}

const cache = {};

export async function getCollection(contract) {
  if (cache[contract]) return cache[contract];

  try {
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
      slug: data?.collection,
      url: `https://opensea.io/collection/${data?.collection}`,
    };

    cache[contract] = result;

    return result;
  } catch (e) {
    return null;
  }
}

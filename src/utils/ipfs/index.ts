import { EffectContext } from "envio";
import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({
  // rejectUnauthorized: false, // Disable TLS cert check for debug
  keepAlive: true,
  maxSockets: 100,
});

const RETRY_DELAY_MS = 5000;

async function fetchFromEndpoint(
  endpoint: string,
  ipfsHash: string,
  context: EffectContext
): Promise<JSON | null> {
  try {
    const response = await axios.get(`${endpoint}/${ipfsHash}`, { httpsAgent });

    if (response.data) {
      const metadata: any = response.data;
      context.log.info(metadata);
      return metadata;
    } else {
      throw new Error("Unable to fetch from endpoint");
    }
  } catch (e) {
    context.log.warn(`Unable to fetch from ${endpoint}/${ipfsHash} : ${e}`);
  }
  return null;
}

export async function tryFetchIpfsFile(
  tokenId: string,
  context: EffectContext,
  retry = true
): Promise<JSON | null> {
  const endpoints = [
    process.env.ENVIO_KLEROS_CDN_LINK || "",
    "https://ipfs.io/ipfs",
  ];

  for (const endpoint of endpoints) {
    if (!endpoint) continue;

    const metadata = await fetchFromEndpoint(endpoint, tokenId, context);
    if (metadata) {
      return metadata;
    }
  }

  // Retry once after a short pause to ride out transient gateway errors.
  if (retry) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return tryFetchIpfsFile(tokenId, context, false);
  }

  context.log.error("Unable to fetch from all endpoints");
  return null;
}

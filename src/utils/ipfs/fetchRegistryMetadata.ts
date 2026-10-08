import { experimental_createEffect, S } from "envio";
import { tryFetchIpfsFile } from ".";

const registryMetadataSchema = S.schema({
  metadata: S.optional(
    S.schema({
      tcrTitle: S.optional(S.string),
      description: S.optional(S.string),
      itemName: S.optional(S.string),
      itemNamePlural: S.optional(S.string),
      parentTCRAddress: S.optional(S.string),
      isConnectedTCR: S.optional(S.boolean),
      requireRemovalEvidence: S.optional(S.boolean),
      isTCRofTcrs: S.optional(S.boolean),
      relTcrDisabled: S.optional(S.boolean),
    })
  ),
});

/**
 * Fetches Registry's metadata from ipfs uri provided
 * @param ipfsHash CID of the ipfs file
 * @example uri https://ipfs.io/ipfs/QmdtT3gupJnavSrtyB1fp4r9h1GVSNcYGy3WJxR36X5uPz/reg.json
 */
export const fetchRegistryMetadata = experimental_createEffect(
  {
    name: "fetchRegistryMetadata",
    input: {
      ipfsHash: S.string,
    },
    // Rejects null, so failures cached by older versions are fetched again.
    output: S.optional(registryMetadataSchema),
    cache: true,
  },
  async ({ input, context }) => {
    const { ipfsHash } = input;

    try {
      const data = await tryFetchIpfsFile(ipfsHash, context);

      const parsed = S.parseOrThrow(data, registryMetadataSchema);

      return parsed;
    } catch (err) {
      if (err instanceof Error) {
        context.log.error(`Error fetching Registry Metadata: ${err.message}`);
      }
      // Don't cache failures, so a later run fetches again.
      context.cache = false;
      return undefined;
    }
  }
);

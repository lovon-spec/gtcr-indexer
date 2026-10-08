import { experimental_createEffect, S } from "envio";
import { tryFetchIpfsFile } from ".";

const evidenceSchema = S.schema({
  title: S.optional(S.string),
  description: S.optional(S.string),
  name: S.optional(S.string),
  fileURI: S.optional(S.string),
  fileTypeExtension: S.optional(S.string),
});

/**
 * Fetches Evidence's data from ipfs uri provided
 * @param ipfsHash CID of the ipfs file
 * @example uri https://ipfs.io/ipfs/QmRqJFhKKdz2KS78ARSWimirZLqUf1tKyAKNexcJ6Y3hy5/evidence.json
 */
export const fetchEvidenceData = experimental_createEffect(
  {
    name: "fetchEvidenceData",
    input: {
      ipfsHash: S.string,
    },
    // Rejects null, so failures cached by older versions are fetched again.
    output: S.optional(evidenceSchema),
    cache: true,
  },
  async ({ input, context }) => {
    const { ipfsHash } = input;

    try {
      const data = await tryFetchIpfsFile(ipfsHash, context);

      const parsed = S.parseOrThrow(data, evidenceSchema);

      return parsed;
    } catch (err) {
      if (err instanceof Error) {
        context.log.error(`Error fetching Evidence Data: ${err.message}`);
      }
      // Don't cache failures, so a later run fetches again.
      context.cache = false;
      return undefined;
    }
  }
);

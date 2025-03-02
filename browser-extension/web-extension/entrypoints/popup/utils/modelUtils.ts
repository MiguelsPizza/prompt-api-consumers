import { ValidatedModelRecord } from "@mlc-ai/web-llm";
import { fetchHuggingFaceModelInfo, parseHuggingFaceModelUrl } from "./hugginfaceAPIClient";

/**
 * Extracts the model ID from a manifest URL.
 * Assumes the manifest URL ends with "/ndarray-cache.json"
 * and that the model ID is the directory immediately preceding it.
 */
export function extractModelId(manifestUrl: string): string {
  try {
    const url = new URL(manifestUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && segments[segments.length - 1] === "ndarray-cache.json") {
      return segments[segments.length - 2];
    }
  } catch (err) {
    console.error("Failed to extract model id from manifestUrl", manifestUrl, err);
  }
  return manifestUrl;
}

/**
 * Processes a given model record by fetching its information from the Hugging Face API and calculating
 * the required disk space based on the model files.
 *
 * @param record - The model record containing details about the model.
 * @returns A promise that resolves with an object containing:
 *  - `diskSpaceBytes`: the total disk space required (in bytes),
 *  - `apiResponse`: the raw API response from Hugging Face.
 * @example
 * ```ts
 * const record: ValidatedModelRecord = {
 *   model: "https://huggingface.co/username/model/resolve/main",
 *   model_id: "my-model",
 *   model_lib: "https://example.com/model.wasm",
 *   // ... other properties
 * };
 *
 * processModelRecord(record)
 *   .then(({ diskSpaceBytes, apiResponse }) => {
 *     console.log(`Total disk space required: ${diskSpaceBytes} bytes`);
 *   })
 *   .catch(console.error);
 * ```
 */
export async function processModelRecord(
  record: ValidatedModelRecord
) {
  // Parse the model URL to extract the necessary parts.
  const { username, modelName, branch } = parseHuggingFaceModelUrl(record.model);

  // Fetch model information from the Hugging Face API.
  const apiResponse = await fetchHuggingFaceModelInfo(username, modelName, branch);
  if (apiResponse.error) throw (apiResponse.error as Error)
  console.log({ apiResponse })
  return apiResponse
}
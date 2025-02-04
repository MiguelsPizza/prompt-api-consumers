import { ModelRecord } from "@mlc-ai/web-llm";

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
 * Represents an individual file in the Hugging Face model repository.
 */
interface HuggingFaceFile {
  /** The relative filename of the file. */
  rfilename: string;
  /** The size of the file in bytes. */
  size: number;
}

/**
 * Interface representing the response from the Hugging Face model API.
 * In particular, we expect a list of files (siblings) with their sizes.
 */
interface HuggingFaceModelApiResponse {
  /** Other model metadata can be present, but we require at least a listing of files. */
  siblings: HuggingFaceFile[];
  // ... add other properties as needed.
}

/**
 * Parses a Hugging Face model URL and extracts the username, model name, and branch (if specified).
 *
 * @param url - The Hugging Face model URL.
 * @returns An object containing the username, modelName, and optionally the branch.
 * @throws Will throw an error if the URL is invalid or does not follow the expected format.
 */
function parseHuggingFaceModelUrl(url: string): {
  username: string;
  modelName: string;
  branch?: string;
} {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "huggingface.co") {
      throw new Error(
        `Invalid hostname: ${parsedUrl.hostname}. Expected "huggingface.co".`
      );
    }
    // Remove leading and trailing slashes, then split the pathname.
    const pathSegments = parsedUrl.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (pathSegments.length < 2) {
      throw new Error(
        `URL path too short, expected at least 2 segments (username/model), got: ${pathSegments.join(
          "/"
        )}`
      );
    }
    const username = pathSegments[0];
    const modelName = pathSegments[1];
    let branch: string | undefined;
    // If the URL has a "/resolve/{BRANCH}" segment, extract the branch.
    if (pathSegments.length >= 4 && pathSegments[2] === "resolve") {
      branch = pathSegments[3];
    }
    return { username, modelName, branch };
  } catch (error) {
    throw new Error(`Failed to parse Hugging Face model URL: ${(error as Error).message}`);
  }
}

/**
 * Fetches detailed model information from the Hugging Face API.
 *
 * The API endpoint used is:
 *   https://huggingface.co/api/models/{USERNAME}/{MODEL}?full=true[&revision={BRANCH}]
 *
 * @param username - The username extracted from the model URL.
 * @param modelName - The model name extracted from the model URL.
 * @param branch - (Optional) The branch (revision) to fetch the info from.
 * @returns A promise that resolves to the Hugging Face model API response.
 * @throws Will throw an error if the network request fails or the API returns a non-OK status.
 */
async function fetchHuggingFaceModelInfo(
  username: string,
  modelName: string,
  branch?: string
): Promise<HuggingFaceModelApiResponse> {
  const baseUrl = `https://huggingface.co/api/models/${username}/${modelName}`;
  const urlObj = new URL(baseUrl);
  // Append query parameters to request full file info.
  urlObj.searchParams.append("full", "true");
  if (branch) {
    urlObj.searchParams.append("revision", branch);
  }

  const response = await fetch(urlObj.toString());
  if (!response.ok) {
    throw new Error(
      `Failed to fetch model info from Hugging Face API: ${response.status} ${response.statusText}`
    );
  }
  const data: HuggingFaceModelApiResponse = await response.json();
  return data;
}

/**
 * Calculates the total disk space required by summing the sizes of all model files.
 *
 * @param apiResponse - The response from the Hugging Face API containing model file information.
 * @returns The total disk space required in bytes.
 */
function calculateRequiredDiskSpace(apiResponse: HuggingFaceModelApiResponse): number {
  if (!apiResponse.siblings || !Array.isArray(apiResponse.siblings)) {
    return 0;
  }
  return apiResponse.siblings.reduce((total, file) => total + (file.size || 0), 0);
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
 * const record: ModelRecord = {
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
  record: ModelRecord
): Promise<{ diskSpaceBytes: number; apiResponse: HuggingFaceModelApiResponse }> {
  // Parse the model URL to extract the necessary parts.
  const { username, modelName, branch } = parseHuggingFaceModelUrl(record.model);

  // Fetch model information from the Hugging Face API.
  const apiResponse = await fetchHuggingFaceModelInfo(username, modelName, branch);

  // Calculate the total disk space required from the file sizes.
  const diskSpaceBytes = calculateRequiredDiskSpace(apiResponse);

  return { diskSpaceBytes, apiResponse };
}
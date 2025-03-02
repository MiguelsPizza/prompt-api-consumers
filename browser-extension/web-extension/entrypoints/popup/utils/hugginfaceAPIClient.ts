import { z } from 'zod';

// Token configuration schema
const TokenizerConfigSchema = z.object({
  bos_token: z.string(),
  chat_template: z.array(z.object({
    name: z.string(),
    template: z.string()
  })),
  eos_token: z.string(),
  pad_token: z.string()
});

// Card data schema
const CardDataSchema = z.object({
  library_name: z.string(),
  base_model: z.string(),
  tags: z.array(z.string())
});

// Sibling file schema
const SiblingSchema = z.object({
  rfilename: z.string()
});

// Config schema
const ConfigSchema = z.object({
  tokenizer_config: TokenizerConfigSchema
});

// Main HuggingFace model response schema
export const HuggingFaceModelResponseSchema = z.object({
  _id: z.string(),
  // id: z.string(),
  // private: z.boolean(),
  library_name: z.string(),
  // tags: z.array(z.string()),
  // downloads: z.number().int().nonnegative(),
  // likes: z.number().int().nonnegative(),
  modelId: z.string(),
  // author: z.string(),
  // sha: z.string().regex(/^[0-9a-f]{40}$/), // Validates SHA-1 hash format
  // lastModified: z.string().datetime(), // ISO date string
  // gated: z.boolean(),
  // inference: z.string(),
  // disabled: z.boolean(),
  // 'model-index': z.null(),
  // config: z.any(),
  // cardData: CardDataSchema,
  siblings: z.array(SiblingSchema),
  // spaces: z.array(z.unknown()),
  // createdAt: z.string().datetime(), // ISO date string
  usedStorage: z.number().int().positive()
})

// Type inference
export type HuggingFaceModelResponse = z.infer<typeof HuggingFaceModelResponseSchema>;

// Helper function to validate HuggingFace model response
export function validateHuggingFaceModelResponse(data: unknown) {
  try {
    return {
      success: true,
      data: HuggingFaceModelResponseSchema.parse(data),
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof z.ZodError ? error.errors : error
    };
  }
}

// Custom error classes for better error handling
class HuggingFaceApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string
  ) {
    super(`HuggingFace API Error: ${status} ${statusText}`);
    this.name = 'HuggingFaceApiError';
  }
}

interface FetchOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

const DEFAULT_OPTIONS: Required<FetchOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'HuggingFace-Fetch-Utility/1.0'
  }
};

/**
 * Creates a full URL for the HuggingFace API request
 */
const createApiUrl = (username: string, modelName: string, branch?: string): URL => {
  const baseUrl = `https://huggingface.co/api/models/${encodeURIComponent(username)}/${encodeURIComponent(modelName)}`;
  const url = new URL(baseUrl);
  url.searchParams.append('full', 'true');
  if (branch) {
    url.searchParams.append('revision', encodeURIComponent(branch));
  }
  return url;
};

/**
 * Fetches detailed model information from the Hugging Face API with retries and validation.
 *
 * @param username - The username extracted from the model URL
 * @param modelName - The model name extracted from the model URL
 * @param branch - Optional branch (revision) to fetch info from
 * @param options - Optional configuration for the fetch request
 * @returns A promise that resolves to the validated HuggingFace model response
 * @throws {HuggingFaceApiError} When the API request fails
 * @throws {ValidationError} When the response fails validation
 * @throws {Error} For other unexpected errors
 */
export async function fetchHuggingFaceModelInfo(
  username: string,
  modelName: string,
  branch?: string,
  options: Pick<FetchOptions, 'headers'> = {}
) {
  const url = createApiUrl(username, modelName, branch);
  const headers = { ...DEFAULT_OPTIONS.headers, ...options.headers };

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new HuggingFaceApiError(response.status, response.statusText, body);
  }

  const data = await response.json();

  return validateHuggingFaceModelResponse(data)
}

/**
 * Parses a Hugging Face model URL and extracts the username, model name, and branch (if specified).
 *
 * @param url - The Hugging Face model URL.
 * @returns An object containing the username, modelName, and optionally the branch.
 * @throws Will throw an error if the URL is invalid or does not follow the expected format.
 */
export function parseHuggingFaceModelUrl(url: string): {
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


// Usage example:
/*
async function example() {
  try {
    // Using URL
    const modelUrl = 'https://huggingface.co/username/model-name/main';
    const { username, modelName, branch } = parseHuggingFaceModelUrl(modelUrl);
    const modelInfo = await fetchHuggingFaceModelInfo(username, modelName, branch, {
      maxRetries: 5,
      timeout: 60000
    });
    console.log('Model info:', modelInfo);
  } catch (error) {
    if (error instanceof HuggingFaceApiError) {
      console.error('API Error:', error.status, error.statusText);
    } else if (error instanceof ValidationError) {
      console.error('Validation Error:', error.errors);
    } else {
      console.error('Unexpected Error:', error);
    }
  }
}
*/
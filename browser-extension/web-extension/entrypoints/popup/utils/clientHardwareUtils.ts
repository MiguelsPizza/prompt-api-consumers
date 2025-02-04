import { prebuiltAppConfig } from "@mlc-ai/web-llm";
import { GPUDeviceDetectOutput } from "@mlc-ai/web-runtime";

interface LLMRequirement {
  name: string;
  minVRAM: number;
  recommendedVRAM: number;
  computeCapability?: number;
  notes?: string;
}

interface LLMCompatibility {
  llm: string;
  canRun: boolean;
  meetsRecommended: boolean;
  requiredVRAM: number;
  availableVRAM?: number;
}

/**
 * Represents a GPU entry in the database with various technical specifications
 */
export interface GPUEntry {
  /** Full model name of the GPU */
  Model: string;
  /** Launch date in YYYY-MM-DD format */
  Launch?: string;
  /** Semiconductor fabrication process in nanometers */
  "Fab (nm)"?: string | number;
  /** Physical die size in square millimeters */
  "Die size (mm2)"?: string | number;
  /** Interface type (e.g., PCIe, AGP) */
  "Bus interface"?: string;
  /** Core clock speeds in MHz (may include base/boost) */
  "Core clock (MHz)"?: string | number;
  /** Memory clock speeds in MHz */
  "Memory clock (MHz)"?: string | number;
  /** GPU core configuration */
  "Core config"?: string;
  /** Memory size with unit (GB/MiB) */
  "Memory Size"?: string;
  /** Memory bandwidth in GB/s */
  "Memory Bandwidth (GB/s)"?: number;
  /** Type of memory (GDDR3, DDR, etc) */
  "Memory Bus type"?: string;
  /** Memory bus width in bits */
  "Memory Bus width (bit)"?: string | number;
  /** Thermal Design Power in watts */
  "TDP (Watts)"?: string | number;
  /** Manufacturer name */
  Vendor?: string;
  /** Internal codename */
  "Code name"?: string;
  /** Floating point performance metrics */
  [key: string]: string | number | undefined;
}

type DeviceRequirements = {
  /** Available VRAM in gigabytes */
  availableVRAM: number;
  /** Compute capability version (e.g., 7.5 for Turing architecture) */
  computeCapability?: number;
  /** Memory bandwidth in GB/s */
  memoryBandwidth: number;
  /** Number of processing cores */
  coreCount?: number;
  /** System RAM in gigabytes */
  systemRAM?: number;
  /** Operating system compatibility */
  os?: string;
  /** Matched GPU model from database */
  matchedGPU?: GPUEntry;
  /** List of compatible LLMs with detailed compatibility info */
  compatibleModels: LLMCompatibility[];
  /** Raw hardware detection output */
  hardwareInfo?: GPUDeviceDetectOutput;
};


/**
 * Database structure mapping GPU codenames to their specifications
 */
type GPUDB = Record<string, GPUEntry>;

/**
 * Fetches GPU database from remote source
 * @async
 * @returns {Promise<GPUDB>} Promise resolving to GPU database object
 * @throws {Error} Throws error for network failures, timeouts, or invalid responses
 * @example
 * const gpuDB = await fetchGPUDB();
 * console.log(gpuDB['NV40']?.Model); // "GeForce 6800 Ultra"
 */

export async function fetchGPUDB(): Promise<GPUDB> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

  try {
    const response = await fetch('https://raw.githubusercontent.com/voidful/gpu-info-api/gpu-data/gpu.json', {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GPU database: ${response.status} ${response.statusText}`);
    }

    const data: GPUDB = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Fetch request timed out');
      }
      throw error;
    }
    throw new Error('An unknown error occurred');
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeModelName(model: string): string {
  if (!model) return ''
  return model
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(geforcertx|radeonrx)/gi, '')
    .trim();
}

export const AVAILABLE_MODELS = prebuiltAppConfig.model_list;

export async function getCompatibleLLMs(
  gpuDB?: GPUDB,
  gpuInfo?: GPUDeviceDetectOutput
): Promise<DeviceRequirements> {
  if (!gpuInfo || !gpuDB) {
    return {
      availableVRAM: 0,
      memoryBandwidth: 0,
      compatibleModels: [],
    };
  }

  const { adapterInfo } = gpuInfo;

  // Find best GPU match
  const gpuEntries = Object.values(gpuDB);
  const matchedGPU = gpuEntries.find(entry =>
    normalizeModelName(entry.Model) === normalizeModelName(adapterInfo.__brand) ||
    normalizeModelName(entry.Model) === normalizeModelName(adapterInfo.device)
  );

  if (!matchedGPU) {
    return {
      availableVRAM: 0,
      memoryBandwidth: 0,
      compatibleModels: [],
    };
  }
  // Get VRAM in GB (convert from bytes if necessary)
  const availableVRAM = matchedGPU.vram ?
    Math.round(Number(matchedGPU.vram) / 1024 / 1024 / 1024) : 0;

  // Get memory bandwidth from matched GPU or adapter info
  const memoryBandwidth = matchedGPU?.["Memory Bandwidth (GB/s)"] || 0;

  const compatibleModels: LLMCompatibility[] = AVAILABLE_MODELS.map(llm => ({
    llm: llm.model_id,
    requiredVRAM: llm.vram_required_MB!,
    availableVRAM,
    canRun: availableVRAM >= llm.vram_required_MB!,
    meetsRecommended: availableVRAM >= llm.buffer_size_required_bytes!,
  }));

  return {
    availableVRAM,
    memoryBandwidth: Number(memoryBandwidth),
    compatibleModels,
    matchedGPU,
    hardwareInfo: gpuInfo,
  };
}
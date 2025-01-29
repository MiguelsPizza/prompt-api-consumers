/* --------------------------------------------------------------------------------
  NOTE: We now use our createWebAIPolyfill() to attach a partial polyfill for
  just the languageModel key. We keep the existing extension messaging logic
  intact (e.g. _relayRequest, windowAI.generateText, etc.) and simply wrap the
  relevant pieces into an AILanguageModelFactory that matches the Chrome AI spec.
-------------------------------------------------------------------------------- */

import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"
import {
  type AITextSessionOptions,
  type CompletionOptions,
  type EventListenerHandler,
  EventType,
  type Input,
  type ModelID,
  type RequestID,
  VALID_DOMAIN,
  type WindowAI
} from "window.ai"
import type {
  CompletionResponse,
  EventResponse,
  ModelResponse,
  PortRequest
} from "~core/constants"
import { ContentMessageType, PortName } from "~core/constants"
import type { OriginData } from "~core/managers/origin"
import { originManager } from "~core/managers/origin"
import { transactionManager } from "~core/managers/transaction"
import type { Result } from "~core/utils/result-monad"
import { isOk } from "~core/utils/result-monad"

import { version } from "../../package.json"

// NEW: import createWebAIPolyfill to wrap our partial language model
import { createWebAIPolyfill } from "@local-first-web-ai-monorepo/web-ai-polyfill"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true
}

// ----------------------------------------------
// Model-checking and event simulation
// ----------------------------------------------
async function checkModelAvailability(): Promise<AICapabilityAvailability> {
  // TODO: Implementation to check if the model is available
  return "readily"
}

async function checkModelDownloaded(): Promise<boolean> {
  // TODO: Implementation to check if the model is downloaded
  return false
}

async function downloadModel(): Promise<void> {
  const totalSize = 1000000
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const progressEvent = new ProgressEvent("textmodeldownloadprogress", {
      lengthComputable: true,
      loaded: (i + 1) * (totalSize / 10),
      total: totalSize
    })
    // We can emit this event on the monitor if needed.
  }
}

// ----------------------------------------------
// The class used by our partial polyfill's create() method
// ----------------------------------------------
class AILanguageModelImpl implements AILanguageModel {
  private options: AILanguageModelCreateOptions
  private sessionHistory: AILanguageModelPrompt[]
  private _maxTokens = 4096
  private _tokensSoFar = 0

  constructor(options: AILanguageModelCreateOptions) {
    this.sessionHistory = this.initializeSessionHistory(options)
    this.options = this.initializeOptions(options)
  }

  dispatchEvent(event: Event): boolean {
    throw new Error("Method not implemented.")
  }

  private initializeSessionHistory(
    options: AILanguageModelCreateOptions
  ): AILanguageModelPrompt[] {
    const history: AILanguageModelPrompt[] = []
    if ("systemPrompt" in options && options.systemPrompt) {
      history.push({
        role: "system",
        content: options.systemPrompt
      } as AILanguageModelInitialPrompt)
    }
    if ("initialPrompts" in options && options.initialPrompts) {
      history.push(...options.initialPrompts)
    }
    return history
  }

  private initializeOptions(
    options: AILanguageModelCreateOptions
  ): CompletionOptions<string, Input> & AITextSessionOptions {
    return {
      maxTokens: undefined,
      model: undefined,
      stopSequences: undefined,
      numOutputs: undefined,
      onStreamResult: undefined,
      temperature: 0.7,
      ...options
    }
  }

  async prompt(
    input: AILanguageModelPromptInput,
    options: AILanguageModelPromptOptions = {}
  ): Promise<string> {
    const messages = this.normalizeInput(input)
    const res = await this.generateResponse(messages, options)
    this.sessionHistory.push(...messages)
    return res
  }

  promptStreaming(
    input: AILanguageModelPromptInput,
    options: AILanguageModelPromptOptions = {}
  ): ReadableStream<string> {
    return this.generateStreamingResponse(this.normalizeInput(input), options)
  }

  private normalizeInput(
    input: AILanguageModelPromptInput
  ): AILanguageModelPrompt[] {
    if (typeof input === "string") {
      return [{ role: "user", content: input }]
    }
    return Array.isArray(input) ? input : [input]
  }

  get maxTokens(): number {
    return this._maxTokens
  }

  get tokensSoFar(): number {
    return this._tokensSoFar
  }

  get tokensLeft(): number {
    return this.maxTokens - this.tokensSoFar
  }

  get topK(): number {
    return this.options.topK ?? 40
  }

  get temperature(): number {
    return this.options.temperature ?? 0.7
  }

  async countPromptTokens(
    _input: AILanguageModelPromptInput,
    _options: AILanguageModelPromptOptions = {}
  ): Promise<number> {
    // TODO: Implement actual token counting
    return 100
  }

  async clone(
    options: AILanguageModelCloneOptions = {}
  ): Promise<AILanguageModel> {
    if (options.signal?.aborted) {
      throw new DOMException("Clone aborted", "AbortError")
    }
    return new AILanguageModelImpl({ ...this.options })
  }

  destroy(): void {
    // Clean up resources if needed
  }

  // Event handling stubs
  oncontextoverflow: ((this: AILanguageModel, ev: Event) => any) | null = null
  addEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject
  ): void {
    // Not implemented
  }
  removeEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject
  ): void {
    // Not implemented
  }

  // ---------------------------------------------
  // Uses the extension messaging logic from windowAI below
  // ---------------------------------------------
  private async generateResponse(
    messages: AILanguageModelPrompt[]
  ): Promise<string> {
    try {
      const finalUserContent = messages[messages.length - 1]?.content ?? ""
      console.log("Generating response for input:", finalUserContent)
      console.log("Current session history:", this.sessionHistory)

      const combined = [...this.sessionHistory, ...messages]
      console.log("Messages to send:", combined)
      console.log("Options:", this.options)

      // Our extension call:
      const response = await windowAI.generateText({ messages: combined }, this.options)
      console.log("Raw response:", response)

      const lastResponse = response[response.length - 1]!
      const result =
        "message" in lastResponse
          ? lastResponse?.message?.content
          : lastResponse?.text

      console.log("Final response:", result)
      return result
    } catch (error) {
      console.error("Error generating response:", error)
      return "FAILED TO GENERATE RESPONSE"
    }
  }

  private generateStreamingResponse(
    input: AILanguageModelPrompt[]
  ): ReadableStream<string> {
    // For demonstration, we'll just do a one-shot fetch (no partial streaming).
    return new ReadableStream<string>({
      start: async (controller) => {
        try {
          const text = await this.generateResponse(input)
          controller.enqueue(text)
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })
  }
}

// ----------------------------------------------
// Partial polyfill for languageModel only
// ----------------------------------------------
const languageModelFactory: AILanguageModelFactory = {
  async create(options) {
    const availability = await this.capabilities()

    if (availability.available === "no") {
      throw new DOMException(
        "Language model is not supported",
        "NotSupportedError"
      )
    }
    if (availability.available === "after-download") {
      if (options?.monitor) {
        const monitor = new EventTarget() as AICreateMonitor
        options.monitor(monitor)
        await downloadModel()
      } else {
        await downloadModel()
      }
    }
    return new AILanguageModelImpl(options ?? {})
  },

  async capabilities() {
    const available = await checkModelAvailability()
    return {
      available,
      languageAvailable: () => available,
      defaultTopK: available === "no" ? null : 40,
      maxTopK: available === "no" ? null : 100,
      defaultTemperature: available === "no" ? null : 0.7
    }
  }
}

// ----------------------------------------------
// Extension messaging logic (unchanged)
// ----------------------------------------------
export const windowAI: WindowAI<ModelID | string> = {
  __window_ai_metadata__: {
    domain: VALID_DOMAIN,
    version
  },

  async generateText(input, options = {}) {
    const { onStreamResult } = _validateOptions(options)
    const hasStreamHandler = !!onStreamResult
    const requestId = _relayRequest(PortName.Completion, {
      transaction: transactionManager.init(input, _getOriginData(), options),
      hasStreamHandler
    })
    return new Promise((resolve, reject) => {
      _addResponseListener<CompletionResponse<typeof input>>(
        requestId,
        (res) => {
          if (isOk(res)) {
            if (
              res.data[0] &&
              "isPartial" in res.data[0] &&
              res.data[0].isPartial
            ) {
              onStreamResult && res.data.forEach((d) => onStreamResult(d, null))
            } else {
              resolve(res.data)
            }
          } else {
            reject(res.error)
            onStreamResult && onStreamResult(null, res.error)
          }
        }
      )
    })
  },

  async getCompletion(input, options = {}) {
    const shouldReturnMultiple = options.numOutputs && options.numOutputs > 1
    return windowAI.generateText(input, options).then((res) => {
      return shouldReturnMultiple ? res : (res[0] as any)
    })
  },

  async getCurrentModel() {
    const requestId = _relayRequest(PortName.Model, undefined)
    return new Promise((resolve, reject) => {
      _addResponseListener<ModelResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(res.data.model)
        } else {
          reject(res.error)
        }
      })
    })
  },

  addEventListener<T>(handler: EventListenerHandler<T>) {
    // Keep using a dedicated port for events
    const requestId = _relayRequest(PortName.Events, {
      shouldListen: true
    })
    _addResponseListener<EventResponse<T>>(null, (res) => {
      if (isOk(res)) {
        if (res.data.event) {
          handler(res.data.event, res.data.data)
        }
      } else {
        handler(EventType.Error, res.error)
      }
    })
    return requestId
  },

  BETA_updateModelProvider({ baseUrl, session, shouldSetDefault }) {
    const requestId = _relayRequest(PortName.Model, {
      baseUrl,
      session,
      shouldSetDefault
    })
    return new Promise((resolve, reject) => {
      _addResponseListener<ModelResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve()
        } else {
          reject(res.error)
        }
      })
    })
  }
}

// Helper validations and request bridging (unchanged)
function _validateOptions<TOptions>(options: TOptions): TOptions {
  console.log({ options })
  if (
    typeof options !== "object" ||
    (!!options &&
      "onStreamResult" in options &&
      (options as any).onStreamResult &&
      typeof (options as any).onStreamResult !== "function")
  ) {
    throw new Error("Invalid options")
  }
  return options
}

function _getOriginData(): OriginData {
  return originManager.getData(
    window.location.origin,
    window.location.pathname,
    window.document.title
  )
}

function _relayRequest<PN extends PortName>(
  portName: PN,
  request: PortRequest[PN]["request"]
): RequestID {
  const requestId = uuidv4() as RequestID
  const msg = {
    type: ContentMessageType.Request,
    portName,
    id: requestId,
    request
  }
  window.postMessage(msg, "*")
  return requestId
}

const _responseListeners = new Map<RequestID | null, Set<(data: any) => void>>()
function _addResponseListener<T extends Result<any, string>>(
  requestId: RequestID | null,
  handler: (data: T) => void
) {
  const handlerSet =
    _responseListeners.get(requestId) || new Set<(data: T) => void>()
  handlerSet.add(handler)
  _responseListeners.set(requestId, handlerSet)
}

window.addEventListener(
  "message",
  (event) => {
    const { source, data } = event
    // We only accept messages from our window with a recognized port
    if (source !== window || !data.portName) {
      return
    }
    if (data.type === ContentMessageType.Response) {
      const msg = data as { id: RequestID; response: unknown }
      const handlers = new Set([
        ...(_responseListeners.get(msg.id) || []),
        ...(_responseListeners.get(null) || [])
      ])

      if (handlers.size === 0) {
        throw new Error(`No handlers found for request ${msg.id}`)
      }
      handlers.forEach((h) => h(msg.response))
    }
  },
  false
)

// ----------------------------------------------
// Finally, create and attach the partial polyfill
// ----------------------------------------------
const partialPolyfill = {
  languageModel: languageModelFactory
}

// For example usage, you can refine AIProviderInfo + options as desired
const options = {} // AttachPolyfillOptions if needed

const mergedPolyfill = createWebAIPolyfill({
})

window.ai = mergedPolyfill
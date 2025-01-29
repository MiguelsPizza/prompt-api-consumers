import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"
import {
  type AITextSessionOptions,
  type ChatMessage,
  type CompletionOptions,
  type EventListenerHandler,
  EventType,
  type Input,
  type ModelID,
  type RequestID,
  type StreamAndAsyncIterable,
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

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true
  // run_at: "document_start" // This causes some Next.js pages (e.g. Plasmo docs) to break
}

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
    // nativeWindowAIPolyfill.ontextmodeldownloadprogress?.(progressEvent)
  }
}

export const nativeWindowAIPolyfill: AI = {
  languageModel: {
    async create(
      options: AILanguageModelCreateOptions = {}
    ): Promise<AILanguageModel> {
      const availability = await this.capabilities()
      if (availability.available === "no") {
        throw new DOMException(
          "Language model is not supported",
          "NotSupportedError"
        )
      }
      if (availability.available === "after-download") {
        if (options.monitor) {
          const monitor = new EventTarget() as AICreateMonitor
          options.monitor(monitor)
          await downloadModel()
        } else {
          await downloadModel()
        }
      }
      return new AILanguageModelImpl(options)
    },

    async capabilities(): Promise<AILanguageModelCapabilities> {
      const available = await checkModelAvailability()
      return {
        available,
        languageAvailable: () => available,
        defaultTopK: available === "no" ? null : 40,
        maxTopK: available === "no" ? null : 100,
        defaultTemperature: available === "no" ? null : 0.7
        // maxTemperature: available === "no" ? null : 1.0
      }
    }
  },
  // TODO: Implement summarizer capabilities and methods
  summarizer: {
    async create() {
      return ""
    }
  } as any,
  // TODO: Implement writer capabilities and methods
  writer: {} as any,
  // TODO: Implement rewriter capabilities and methods
  rewriter: {} as any,
  // TODO: Implement translator capabilities and methods
  translator: {} as any,
  // TODO: Implement language detection capabilities and methods
  languageDetector: {} as any
}

class AILanguageModelImpl implements AILanguageModel {
  private options: AILanguageModelCreateOptions
  private sessionHistory: AILanguageModelPrompt[]
  private _maxTokens = 4096 // Example value
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
    if (options.systemPrompt) {
      history.push({
        role: "system",
        content: options.systemPrompt
      } as AILanguageModelInitialPrompt)
    }
    if (options.initialPrompts) {
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
    input: AILanguageModelPromptInput,
    options: AILanguageModelPromptOptions = {}
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

  // Event handling
  oncontextoverflow: ((this: AILanguageModel, ev: Event) => any) | null = null
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    // Implement event handling
  }
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    // Implement event handling
  }

  private async generateResponse(input: string): Promise<string> {
    try {
      console.log("Generating response for input:", input)
      console.log("Current session history:", this.sessionHistory)

      const messages: ChatMessage[] = [
        ...this.sessionHistory,
        { role: "user", content: input }
      ]
      console.log("Messages to send:", messages)
      console.log("Options:", this.options)

      const response = await windowAI.generateText({ messages }, this.options)
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
    input: string
  ): ReadableStream<Uint8Array> & AsyncIterable<string> {
    let fullResponse = ""
    const messages: ChatMessage[] = [
      ...this.sessionHistory,
      { role: "user", content: input },
      { role: "assistant", content: fullResponse }
    ]

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          await windowAI.generateText(
            { messages },
            {
              ...this.options,
              onStreamResult: (result, error) => {
                if (error) {
                  controller.error(error)
                  return
                }
                if (result) {
                  console.log({ result })
                  const content =
                    "message" in result ? result.message.content : result.text
                  fullResponse += content
                  this.sessionHistory[this.sessionHistory.length - 1]!.content =
                    fullResponse
                  controller.enqueue(new TextEncoder().encode(content))
                }
                controller.close()
              }
            }
          )
        } catch (error) {
          controller.error(error)
        }
      }
    })

    const asyncIterator = {
      [Symbol.asyncIterator]: async function* () {
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            yield new TextDecoder().decode(value)
          }
        } finally {
          reader.releaseLock()
        }
      }
    }

    return Object.assign(
      stream,
      asyncIterator
    ) as StreamAndAsyncIterable<Uint8Array>
  }
}
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
    // TODO - use a dedicated port for events
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

// TODO better validation
function _validateOptions<TOptions>(options: TOptions): TOptions {
  console.log({ options })
  if (
    typeof options !== "object" ||
    (!!options &&
      "onStreamResult" in options &&
      options.onStreamResult &&
      typeof options.onStreamResult !== "function")
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

// TODO figure out how to reclaim memory
// `null` means all listen for all requests
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

    // We only accept messages our window and a port
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

window.ai = nativeWindowAIPolyfill

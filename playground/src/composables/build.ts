/* eslint-disable unused-imports/no-unused-vars */
import { decompressFromEncodedURIComponent as decode, compressToEncodedURIComponent as encode } from 'lz-string'
import { computed, reactive, ref } from 'vue'

// Constants for API and workflow
const API_BASE_URL = 'https://slidefly.idealeap.cn/api'
const TRIGGER_WORKFLOW_ENDPOINT = `${API_BASE_URL}/trigger-workflow`
const WORKFLOW_STATUS_ENDPOINT_PREFIX = `${API_BASE_URL}/workflow-status`

const WORKFLOW_MAX_ATTEMPTS = 60
const WORKFLOW_INITIAL_INTERVAL = 2000 // ms
const WORKFLOW_MAX_INTERVAL = 30000 // ms

const WORKFLOW_STATUS_COMPLETED = 'completed'
const WORKFLOW_STATUS_FAILED = 'failed'
const WORKFLOW_STATUS_CANCELLED = 'cancelled'
const WORKFLOW_STATUS_TIMED_OUT = 'timed_out'

interface Step {
  text: string
  afterText?: string
  async?: boolean
  duration?: number
  action?: () => void | Promise<void>
}

export type AspectRatio = '16/9' | '4/3' | '1/1'
export type ColorSchema = 'light' | 'dark'

interface WorkflowInputArgs {
  aspectRatio?: AspectRatio
  colorSchema?: ColorSchema
}

interface WorkflowInput {
  environment: string
  version?: string // User identifier or version
  content?: string // Encoded Markdown content
  title?: string // Slides file name
  args?: string // Encoded JSON string of WorkflowInputArgs
  type?: 'web' | 'pptx' // Export type
}

interface TriggerWorkflowPayload {
  ref: string
  inputs: WorkflowInput
}

interface TriggerWorkflowResponse {
  request_id: string
  run_id: string
}

interface WorkflowStatusResponse {
  status: string | null
  conclusion?: string
}

export interface BuildSlidesOptions {
  name?: string
  mdc?: string
  user?: string
  aspectRatio?: AspectRatio
  colorSchema?: ColorSchema
  type?: 'web' | 'pptx' // Export type
}

export function useMultiStepBuilding() {
  const requestId = ref('')
  const runId = ref('')
  const slidesUrl = ref('')
  const errorMessage = ref<string | null>(null)
  const currentExportType = ref<'web' | 'pptx'>('web') // Added to store current export type

  const loaderStates = reactive({
    isTriggeringWorkflow: false,
    isBuildingSlides: false,
  })

  const buildingState = reactive({
    showSteps: false,
    close: () => {
      buildingState.showSteps = false
      // errorMessage.value = null; // Error message is now cleared at the start of a new build
    },
  })

  const loadingSteps = computed<Step[]>(() => [
    {
      text: 'Triggering Workflow...',
      async: loaderStates.isTriggeringWorkflow,
      afterText: runId.value ? `Workflow (ID: ${runId.value}) triggered.` : 'Workflow triggered.',
    },
    {
      text: 'Building Slides...', // Generic text for building
      async: loaderStates.isBuildingSlides,
      afterText: requestId.value ? `Slides (ID: ${requestId.value}) built.` : 'Slides built.',
    },
    {
      text: 'Finalizing...', // Changed from 'Redirecting...'
      duration: 1000,
      action: handleBuildingComplete,
    },
  ])

  function handleStateChange(state: number) {
    // console.log('Loading step state changed:', state)
  }

  function handleComplete() {
    // console.log('All loading steps completed')
  }

  function handleBuildingComplete() {
    buildingState.close()
    if (requestId.value) {
      if (currentExportType.value === 'pptx') {
        slidesUrl.value = `https://talks.idealeap.cn/playground/${requestId.value}/${requestId.value}.pptx`
      }
      else {
        slidesUrl.value = `https://talks.idealeap.cn/playground/${requestId.value}`
      }
    }
  }

  async function _fetchApi<T>(url: string, options?: RequestInit, errorContext?: string): Promise<T> {
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API Error ${response.status}: ${errorData || response.statusText} (Context: ${errorContext || 'General API call'})`)
      }
      return await response.json() as T
    }
    catch (error) {
      console.error(`Fetch API error (${errorContext || 'General API call'}):`, error)
      throw error
    }
  }

  async function triggerWorkflow(options: BuildSlidesOptions): Promise<void> {
    const { name, mdc, user, aspectRatio, colorSchema, type = 'web' } = options // Add type, default to 'web'
    const workflowArgs: WorkflowInputArgs = {}
    if (aspectRatio)
      workflowArgs.aspectRatio = aspectRatio
    if (colorSchema)
      workflowArgs.colorSchema = colorSchema

    const payload: TriggerWorkflowPayload = {
      ref: 'main',
      inputs: {
        environment: 'playground',
        version: user,
        content: mdc,
        title: name,
        args: encode(JSON.stringify(workflowArgs)),
        type, // Include type in inputs
      },
    }

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }

    try {
      const data = await _fetchApi<TriggerWorkflowResponse>(TRIGGER_WORKFLOW_ENDPOINT, requestOptions, 'Trigger Workflow')
      if (!data.request_id || !data.run_id) {
        throw new Error('Invalid response from trigger workflow API: missing request_id or run_id')
      }
      requestId.value = data.request_id
      runId.value = data.run_id
      loaderStates.isTriggeringWorkflow = false
    }
    catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to trigger workflow.'
      throw error
    }
  }

  async function checkWorkflowStatus(currentRunId: string): Promise<void> {
    let attempts = 0
    let interval = WORKFLOW_INITIAL_INTERVAL

    while (attempts < WORKFLOW_MAX_ATTEMPTS) {
      try {
        const data = await _fetchApi<WorkflowStatusResponse>(
          `${WORKFLOW_STATUS_ENDPOINT_PREFIX}/${currentRunId}`,
          { method: 'GET', headers: { Accept: 'application/json' } },
          `Check Workflow Status (Attempt: ${attempts + 1})`,
        )

        const status = data?.status

        if (status === WORKFLOW_STATUS_COMPLETED) {
          if (data?.conclusion === 'failure') {
            errorMessage.value = `Workflow failed. Run ID: ${currentRunId}`
            throw new Error(`Workflow failed. Run ID: ${currentRunId}`)
          }
          loaderStates.isBuildingSlides = false
          return // Successfully completed
        }
        if (
          status === WORKFLOW_STATUS_FAILED
          || status === WORKFLOW_STATUS_CANCELLED
          || status === WORKFLOW_STATUS_TIMED_OUT
        ) {
          throw new Error(`Workflow ${status}. Run ID: ${currentRunId}`)
        }
        // Otherwise, status is pending or unknown, continue polling
      }
      catch (error) {
        if (error instanceof Error && (error.message.includes(WORKFLOW_STATUS_FAILED) || error.message.includes(WORKFLOW_STATUS_CANCELLED) || error.message.includes(WORKFLOW_STATUS_TIMED_OUT))) {
          errorMessage.value = error.message
          throw error
        }
        console.warn(`Workflow status check attempt ${attempts + 1} failed:`, error)
      }

      await new Promise(resolve => setTimeout(resolve, interval))
      interval = Math.min(interval * 1.5, WORKFLOW_MAX_INTERVAL)
      attempts++
    }

    const timeoutMessage = `Workflow status check timed out after ${attempts} attempts. Run ID: ${currentRunId}`
    errorMessage.value = timeoutMessage
    throw new Error(timeoutMessage)
  }

  async function startSlidesBuilding(options: BuildSlidesOptions): Promise<void> {
    requestId.value = ''
    runId.value = ''
    slidesUrl.value = ''
    errorMessage.value = null // Clear previous errors at the start of a new build
    currentExportType.value = options.type || 'web' // Store the export type

    buildingState.showSteps = true

    loaderStates.isTriggeringWorkflow = true
    loaderStates.isBuildingSlides = true

    try {
      await triggerWorkflow(options)
      loaderStates.isTriggeringWorkflow = false // Triggering successful

      if (runId.value) {
        await checkWorkflowStatus(runId.value)
        loaderStates.isBuildingSlides = false // Building successful
      }
      else {
        throw new Error('Workflow triggered, but Run ID is not available. Cannot check status.')
      }
    }
    catch (error) {
      loaderStates.isTriggeringWorkflow = false
      loaderStates.isBuildingSlides = false

      if (!errorMessage.value) {
        errorMessage.value = error instanceof Error ? error.message : 'An unexpected error occurred during the build process.'
      }
      console.error('Slides building process failed:', error)
      buildingState.close() // Hide the loader UI
      throw error
    }
  }

  return {
    loaderStates,
    buildingState,
    loadingSteps,
    handleStateChange,
    handleComplete,
    startSlidesBuilding,
    slidesUrl,
    errorMessage,
    currentExportType, // Ensure currentExportType is returned
  }
}

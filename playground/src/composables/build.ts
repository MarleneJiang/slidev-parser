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

export type AspectRatio = '16/9' | '4/3' | '1/1' | string
export type ColorSchema = 'light' | 'dark' | string

interface WorkflowInput {
  environment: string
  version?: string // User identifier or version
  content?: string // Encoded Markdown content
  title?: string // Slides file name
  args?: string // Encoded JSON string of additional arguments like aspectRatio, colorSchema
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
}

export function useMultiStepBuilding() {
  const requestId = ref('')
  const runId = ref('')
  const slidesUrl = ref('')
  const errorMessage = ref<string | null>(null) // For user-facing error messages

  const loaderStates = reactive({
    isTriggeringWorkflow: false,
    isBuildingSlides: false,
  })

  const buildingState = reactive({
    showSteps: false,
    close: () => {
      buildingState.showSteps = false
      errorMessage.value = null // Clear errors when closing
    },
  })

  const loadingSteps = computed<Step[]>(() => [
    {
      text: 'Triggering Workflow...',
      async: loaderStates.isTriggeringWorkflow,
      afterText: runId.value ? `Workflow (ID: ${runId.value}) triggered.` : 'Workflow triggered.',
    },
    {
      text: 'Building Slides Website...',
      async: loaderStates.isBuildingSlides,
      afterText: requestId.value ? `Slides (ID: ${requestId.value}) built.` : 'Slides built.',
    },
    {
      text: 'Redirecting...',
      duration: 1000,
      action: handleBuildingComplete,
    },
  ])

  // Placeholder - can be implemented if specific state change reactions are needed
  function handleStateChange(state: number) {
    // console.log('Loading step state changed:', state)
  }

  // Placeholder - can be implemented if specific actions on completion are needed
  function handleComplete() {
    // console.log('All loading steps completed')
  }

  function handleBuildingComplete() {
    buildingState.close()
    if (requestId.value) {
      slidesUrl.value = `https://talks.idealeap.cn/playground/${requestId.value}`
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
      throw error // Re-throw to be caught by the caller
    }
  }

  async function triggerWorkflow(
    name?: string,
    mdc?: string,
    user?: string,
    aspectRatio?: AspectRatio,
    colorSchema?: ColorSchema,
  ): Promise<void> {
    const payload: TriggerWorkflowPayload = {
      ref: 'main',
      inputs: {
        environment: 'playground',
        version: user,
        content: mdc,
        title: name,
        args: encode(JSON.stringify({ aspectRatio, colorSchema })),
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
      throw error // Propagate error to stop the building process
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
          loaderStates.isBuildingSlides = false
          return // Successfully completed
        }
        else if (
          status === WORKFLOW_STATUS_FAILED
          || status === WORKFLOW_STATUS_CANCELLED
          || status === WORKFLOW_STATUS_TIMED_OUT
        ) {
          throw new Error(`Workflow ${status}. Run ID: ${currentRunId}`)
        }
        // Otherwise, status is pending or unknown, continue polling
      }
      catch (error) {
        // If a specific workflow failure status was thrown, propagate it
        if (error instanceof Error && (error.message.includes(WORKFLOW_STATUS_FAILED) || error.message.includes(WORKFLOW_STATUS_CANCELLED) || error.message.includes(WORKFLOW_STATUS_TIMED_OUT))) {
          errorMessage.value = error.message
          throw error
        }
        // For other errors (e.g., network issues during polling), log and continue polling up to MAX_ATTEMPTS
        console.warn(`Workflow status check attempt ${attempts + 1} failed:`, error)
        // Do not set errorMessage.value here for transient polling errors, only for terminal workflow states.
      }

      await new Promise(resolve => setTimeout(resolve, interval))
      interval = Math.min(interval * 1.5, WORKFLOW_MAX_INTERVAL)
      attempts++
    }

    const timeoutMessage = `Workflow status check timed out after ${attempts} attempts. Run ID: ${currentRunId}`
    errorMessage.value = timeoutMessage
    throw new Error(timeoutMessage)
  }

  async function startSlidesBuilding(
    name?: string,
    mdc?: string,
    user?: string,
    aspectRatio?: AspectRatio,
    colorSchema?: ColorSchema,
  ): Promise<void> {
    // Reset states
    buildingState.showSteps = true
    loaderStates.isTriggeringWorkflow = true
    loaderStates.isBuildingSlides = true
    requestId.value = ''
    runId.value = ''
    slidesUrl.value = ''
    errorMessage.value = null

    try {
      // Trigger workflow
      await triggerWorkflow(name, mdc, user, aspectRatio, colorSchema)
      loaderStates.isTriggeringWorkflow = false

      // Build slides by checking workflow status
      if (runId.value) {
        await checkWorkflowStatus(runId.value)
      }
      else {
        // This case should ideally not be reached if triggerWorkflow throws on failure
        throw new Error('Cannot check workflow status: Run ID is not available.')
      }
      loaderStates.isBuildingSlides = false
    }
    catch (error) {
      // Error message is already set by triggerWorkflow or checkWorkflowStatus
      // or set a generic one if not already set.
      if (!errorMessage.value) {
        errorMessage.value = error instanceof Error ? error.message : 'An unexpected error occurred during the build process.'
      }
      console.error('Slides building process failed:', error)
      buildingState.close() // Close the loader on error
      // Re-throw so the caller (e.g., Vue component) can also handle it if needed
      throw error
    }
  }

  return {
    loaderStates,
    buildingState,
    loadingSteps,
    handleStateChange,
    handleComplete,
    // handleBuildingComplete, // Not typically called directly from outside
    startSlidesBuilding,
    slidesUrl,
    errorMessage, // Expose error message to the UI
  }
}

/* eslint-disable unused-imports/no-unused-vars */
import { decompressFromEncodedURIComponent as decode, compressToEncodedURIComponent as encode } from 'lz-string'
import { computed, reactive, ref } from 'vue'

interface Step {
  text: string // Display text for the step
  afterText?: string // Text to show after step completion
  async?: boolean // If true, waits for external trigger to proceed
  duration?: number // Duration in ms before proceeding (default: 2000)
  action?: () => void // Function to execute when step is active
}
export function useMultiStepBuilding() {
  const requestId = ref('')
  const runId = ref('')
  const slidesUrl = ref('')
  // State management
  const loaderStates = reactive({
    triggerWorkflow: false,
    isBuilding: false,
  })
  const buildingState = reactive({
    showSteps: false,
    close: () => {
      buildingState.showSteps = false
    },
  })
  const loadingSteps = computed<Step[]>(() => [
    {
      text: 'Trigger Workflow',
      async: loaderStates.triggerWorkflow,
      afterText: `workflow(ID:${runId.value}) triggered`,
    },
    {
      text: 'Build Slides Website',
      async: loaderStates.isBuilding,
      afterText: `slides(ID:${requestId.value}) built`,
    },
    {
      text: 'Redirecting',
      duration: 1000,
      action: handleBuildingComplete,
    },
  ])

  // Event handlers
  function handleStateChange(state: number) {
  // Handle Loading State Change
  }

  function handleComplete() {
  // Handle Loading Complete
  }
  function handleBuildingComplete() {
    buildingState.close()
    const url = `https://talks.idealeap.cn/playground/${requestId.value}`
    slidesUrl.value = url
  }

  async function triggerWorkflow(name?: string, mdc?: string, user?: string, aspectRatio?: string, colorSchema?: string) {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')

    const raw = JSON.stringify({
      ref: 'main',
      inputs: {
        environment: 'playground',
        version: user,
        content: mdc,
        title: name,
        args: encode(JSON.stringify({ aspectRatio, colorSchema })),
      },
    })

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    }

    const res = await fetch('https://slidefly.idealeap.cn/api/trigger-workflow', requestOptions)
    if (!res.ok) {
      throw new Error('Failed to trigger workflow')
      return
    }
    const data = await res.json()
    if (!data.request_id || !data.run_id) {
      throw new Error('Failed to trigger workflow')
      return
    }
    requestId.value = data.request_id
    runId.value = data.run_id
    loaderStates.triggerWorkflow = false
  }

  async function checkWorkflowStatus(runId: string) {
    const MAX_ATTEMPTS = 60 // Maximum number of polling attempts
    const INITIAL_INTERVAL = 2000 // Start with 2 second interval
    const MAX_INTERVAL = 30000 // Maximum 30 second interval

    // Status check with exponential backoff
    let attempts = 0
    let interval = INITIAL_INTERVAL

    const getStatus = async () => {
      try {
        const res = await fetch(`https://slidefly.idealeap.cn/api/workflow-status/${runId}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        })

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const data = await res.json()
        return data?.status || null
      }
      catch (error) {
        console.error('Status check failed:', error)
        return null
      }
    }

    while (attempts < MAX_ATTEMPTS) {
      const status = await getStatus()

      // Handle different status types
      if (status === 'completed') {
        loaderStates.isBuilding = false
        return
      }
      else if (['failed', 'cancelled', 'timed_out'].includes(status)) {
        throw new Error(`Workflow ${status}`)
      }

      // Wait before next attempt with exponential backoff
      await new Promise(resolve => setTimeout(resolve, interval))
      interval = Math.min(interval * 1.5, MAX_INTERVAL) // Exponential backoff
      attempts++
    }

    throw new Error('Workflow status check timed out')
  }

  async function startSlidesBuilding(name?: string, mdc?: string, user?: string, aspectRatio?: string, colorSchema?: string) {
  // Reset states
    buildingState.showSteps = true
    loaderStates.triggerWorkflow = true
    loaderStates.isBuilding = true
    requestId.value = ''
    runId.value = ''
    slidesUrl.value = ''

    // Simulate async operations
    async function simulateAsyncStep(stateProp: keyof typeof loaderStates) {
      if (stateProp === 'triggerWorkflow') {
        await triggerWorkflow(name, mdc, user, aspectRatio, colorSchema)
      }
      else if (stateProp === 'isBuilding') {
        await checkWorkflowStatus(runId.value)
      }
    }

    try {
    // Trigger workflow
      await simulateAsyncStep('triggerWorkflow')

      // Build slides
      await simulateAsyncStep('isBuilding')
    }
    catch (error) {
      buildingState.close()
    }
  }
  return { loaderStates, buildingState, loadingSteps, handleStateChange, handleComplete, handleBuildingComplete, startSlidesBuilding, slidesUrl }
}

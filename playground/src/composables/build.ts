/* eslint-disable unused-imports/no-unused-vars */
import { computed, reactive, ref } from 'vue'

interface Step {
  text: string // Display text for the step
  afterText?: string // Text to show after step completion
  async?: boolean // If true, waits for external trigger to proceed
  duration?: number // Duration in ms before proceeding (default: 2000)
  action?: () => void // Function to execute when step is active
}
export function useMultiStepBuilding() {
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
      afterText: 'workflow triggered',
    },
    {
      text: 'Build Slides Website',
      async: loaderStates.isBuilding,
      afterText: 'slides website built',
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
  // eslint-disable-next-line no-alert
    alert('Slides was built, redirecting...')
    buildingState.close()
  }

  async function startSlidesBuilding(name?: string, mdc?: string) {
  // Reset states
    buildingState.showSteps = true
    loaderStates.triggerWorkflow = true
    loaderStates.isBuilding = true

    // Simulate async operations
    async function simulateAsyncStep(stateProp: keyof typeof loaderStates) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          loaderStates[stateProp] = false
          resolve()
        }, 2000)
      })
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
  return { loaderStates, buildingState, loadingSteps, handleStateChange, handleComplete, handleBuildingComplete, startSlidesBuilding }
}

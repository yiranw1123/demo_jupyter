import { useState, useEffect } from 'react'
import { marked } from 'marked'
import Onboarding from './Onboarding'
import Results from './Results'
import Reader from './Reader'
import { API_BASE_URL } from './config'

function App() {
  const [currentView, setCurrentView] = useState('onboarding') // 'onboarding', 'setup', 'results', 'reader'
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [selectedVideoId, setSelectedVideoId] = useState(null)
  
  // Three-stage process state
  const [currentStep, setCurrentStep] = useState(1)
  const [stepStatuses, setStepStatuses] = useState({
    1: 'pending', // pending, processing, completed, error
    2: 'pending',
    3: 'pending'
  })
  const [stepResults, setStepResults] = useState({
    1: null, // persona data
    2: null, // scoring dimensions
    3: null  // content ranking results
  })
  const [stepErrors, setStepErrors] = useState({
    1: null,
    2: null, 
    3: null
  })
  
  
  // Streaming animation for persona
  const [streamingPersonaText, setStreamingPersonaText] = useState('')
  const [isStreamingPersona, setIsStreamingPersona] = useState(false)
  const [personaStreamComplete, setPersonaStreamComplete] = useState(false)
  
  // Processing text for each step
  const [processingTexts, setProcessingTexts] = useState({
    1: [],
    2: [],
    3: []
  })

  // Character streaming effect for persona display
  useEffect(() => {
    if (!stepResults[1]?.persona || stepStatuses[1] !== 'completed' || isStreamingPersona) {
      return
    }

    const fullText = stepResults[1].persona
    setStreamingPersonaText('')
    setIsStreamingPersona(true)
    setPersonaStreamComplete(false)

    let streamInterval = null
    const startDelay = setTimeout(() => {
      let index = 0
      streamInterval = setInterval(() => {
        // Stream multiple characters at once for faster display
        const charsToAdd = Math.min(3, fullText.length - index)
        setStreamingPersonaText(fullText.slice(0, index + charsToAdd))
        index += charsToAdd
        
        if (index >= fullText.length) {
          clearInterval(streamInterval)
          setIsStreamingPersona(false)
          setPersonaStreamComplete(true)
          
          // Give user 1100ms to read the completed persona, then proceed to stage 2
          setTimeout(() => {
            if (window.pendingPersonaForStage2) {
              executeStage2(window.pendingPersonaForStage2)
              window.pendingPersonaForStage2 = null
            }
          }, 1100)
        }
      }, 15)
    }, 100)

    return () => {
      clearTimeout(startDelay)
      if (streamInterval) {
        clearInterval(streamInterval)
      }
    }
  }, [stepResults[1], stepStatuses[1]])

  const handleOnboardingComplete = async (profile) => {
    console.log('Onboarding completed with profile:', profile)
    setUserProfile(profile)
    setShowOnboarding(false)
    setCurrentView('setup')
    
    // Start the three-stage process
    await executeStage1(profile)
  }

  const executeStage1 = async (profile) => {
    console.log('Starting Stage 1: Persona Generation')
    setCurrentStep(1)
    setStepStatuses(prev => ({ ...prev, 1: 'processing' }))
    setStepErrors(prev => ({ ...prev, 1: null }))
    
    // Add processing steps
    const step1ProcessingSteps = [
  'Analyzing your role to determine professional context and altitude...',
  'Determining the core "Job to be Done" from your primary challenges...',
  'Assessing your cognitive style based on your trusted sources and content...',
  'Synthesizing insights to construct your unique cognitive persona...'
]
    
    for (let i = 0; i < step1ProcessingSteps.length; i++) {
      setProcessingTexts(prev => ({
        ...prev,
        1: [...prev[1], step1ProcessingSteps[i]]
      }))
      if (i < step1ProcessingSteps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        signal: AbortSignal.timeout(180000)
      })
      
      if (response.ok) {
        const result = await response.json()
        const personaData = result.persona_data
        
        if (!personaData?.persona) {
          throw new Error('Invalid persona data received from API')
        }
        
        setStepResults(prev => ({ ...prev, 1: personaData }))
        setStepStatuses(prev => ({ ...prev, 1: 'completed' }))
        
        // Auto-proceed to stage 2 after streaming completes + reading time
        // We'll use the personaStreamComplete state to trigger this
        // Store persona data for later use
        window.pendingPersonaForStage2 = personaData.persona
      } else {
        throw new Error(`Failed to generate persona: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Stage 1 error:', error)
      setStepErrors(prev => ({ ...prev, 1: error.message }))
      setStepStatuses(prev => ({ ...prev, 1: 'error' }))
    }
  }
  
  const executeStage2 = async (persona) => {
    console.log('Starting Stage 2: Ranking Dimension Generation')
    setCurrentStep(2)
    setStepStatuses(prev => ({ ...prev, 2: 'processing' }))
    setStepErrors(prev => ({ ...prev, 2: null }))
    
    // Add processing steps
    const step2ProcessingSteps = [
  'Analyzing the persona to identify core professional challenges...',
  'Defining the key "intellectual jobs" the content must perform...',
  'Translating these jobs into value-based scoring dimensions...',
  'Weighting dimensions by criticality to construct the final ranking framework...'
]
    
    for (let i = 0; i < step2ProcessingSteps.length; i++) {
      setProcessingTexts(prev => ({
        ...prev,
        2: [...prev[2], step2ProcessingSteps[i]]
      }))
      if (i < step2ProcessingSteps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-scoring-dimensions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: persona,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(180000)
      })
      
      if (response.ok) {
        const result = await response.json()
        const scoringData = result.scoring_data
        
        if (!scoringData?.scoring_dimensions) {
          throw new Error('Invalid scoring dimensions data received from API')
        }
        
        setStepResults(prev => ({ ...prev, 2: scoringData }))
        setStepStatuses(prev => ({ ...prev, 2: 'completed' }))
        
        // Auto-proceed to stage 3
        setTimeout(() => executeStage3(persona, scoringData.scoring_dimensions), 5000)
      } else {
        throw new Error(`Failed to generate scoring dimensions: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Stage 2 error:', error)
      setStepErrors(prev => ({ ...prev, 2: error.message }))
      setStepStatuses(prev => ({ ...prev, 2: 'error' }))
    }
  }
  
  const executeStage3 = async (persona, scoringDimensions) => {
    console.log('Starting Stage 3: Content Pool Ranking')
    setCurrentStep(3)
    setStepStatuses(prev => ({ ...prev, 3: 'processing' }))
    setStepErrors(prev => ({ ...prev, 3: null }))
    
    // Add processing steps
    const step3ProcessingSteps = [
  'Parsing the evaluation framework and candidate list...',
  'Scoring each item against the framework dimensions...',
  'Calculating the final weighted score for each candidate...',
  'Assembling the results into the final JSON output...'
  ]
    
    for (let i = 0; i < step3ProcessingSteps.length; i++) {
      setProcessingTexts(prev => ({
        ...prev,
        3: [...prev[3], step3ProcessingSteps[i]]
      }))
      if (i < step3ProcessingSteps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 700))
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/content-pool-ranking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: persona,
          scoring_dimensions: scoringDimensions,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(180000)
      })
      
      if (response.ok) {
        const result = await response.json()
        const rankingData = result.ranking_data
        
        setStepResults(prev => ({ ...prev, 3: rankingData }))
        setStepStatuses(prev => ({ ...prev, 3: 'completed' }))
        
        // Auto-navigate to results after a brief delay
        setTimeout(() => {
          setCurrentView('results')
        }, 2000)
      } else {
        throw new Error(`Failed to rank content pool: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Stage 3 error:', error)
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. The ranking process is taking longer than expected. Please try again.'
        : error.message
      setStepErrors(prev => ({ ...prev, 3: errorMessage }))
      setStepStatuses(prev => ({ ...prev, 3: 'error' }))
    }
  }
  
  const handleRestartOnboarding = () => {
    setCurrentView('onboarding')
    setShowOnboarding(true)
    setUserProfile(null)
    setCurrentStep(1)
    setStepStatuses({ 1: 'pending', 2: 'pending', 3: 'pending' })
    setStepResults({ 1: null, 2: null, 3: null })
    setStepErrors({ 1: null, 2: null, 3: null })
    setStreamingPersonaText('')
    setIsStreamingPersona(false)
    setPersonaStreamComplete(false)
    setProcessingTexts({ 1: [], 2: [], 3: [] })
  }
  
  const handleBackToSetup = () => {
    setCurrentView('setup')
  }

  const handleViewReader = (videoId) => {
    setSelectedVideoId(videoId)
    setCurrentView('reader')
  }

  const handleBackToResults = () => {
    setCurrentView('results')
    setSelectedVideoId(null)
  }

  const handleStepClick = (stepNum) => {
    // Only allow clicking on completed steps or current processing step
    if (stepStatuses[stepNum] === 'completed' || 
        (stepStatuses[stepNum] === 'processing' && stepNum === currentStep)) {
      setCurrentStep(stepNum)
      // Clear expanded steps since we're now viewing a specific step
      }
  }

  const renderProgressBar = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-center items-center space-x-8">
          {[1, 2, 3].map((stepNum, index) => {
            const status = stepStatuses[stepNum]
            const isActive = currentStep === stepNum
            const isClickable = status === 'completed'
            
            return (
              <div key={stepNum} className="flex items-center">
                <div 
                  className={`relative w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                    status === 'processing' ? 'bg-indigo-500 border-indigo-500 text-white animate-pulse' :
                    status === 'error' ? 'bg-red-500 border-red-500 text-white' :
                    'bg-gray-100 border-gray-300 text-gray-400'
                  } ${
                    isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                  }`}
                  onClick={() => isClickable && handleStepClick(stepNum)}
                >
                  {status === 'completed' ? '✓' : stepNum}
                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    </div>
                  )}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-4 rounded ${
                    stepStatuses[stepNum + 1] === 'completed' || stepStatuses[stepNum] === 'completed' 
                      ? 'bg-green-400' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-center mt-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {getStepContent(currentStep).title}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {getStepContent(currentStep).subtitle}
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  const getStepContent = (stepNum) => {
    const stepConfig = {
      1: {
        title: 'Step 1 of 3 — Persona Generation',
        subtitle: 'The AI agent is building a profile of your content preferences and role.'
      },
      2: {
        title: 'Step 2 of 3 — Ranking Dimension Generation', 
        subtitle: 'The AI agent is creating the evaluation dimensions to judge content relevance and quality.'
      },
      3: {
        title: 'Step 3 of 3 — Content Pool Ranking',
        subtitle: 'The AI agent is scoring and ranking content against your persona and ranking dimensions.'
      }
    }
    return stepConfig[stepNum]
  }
  
  const renderStepOutput = (stepNum) => {
    const result = stepResults[stepNum]
    const error = stepErrors[stepNum]
    const status = stepStatuses[stepNum]
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-3">❌</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Processing Failed</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )
    }
    
    if (status === 'processing') {
      return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-8">
          <div className="text-center mb-6">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">Processing...</h3>
          </div>
          
          {/* Processing Steps */}
          <div className="space-y-3">
            {processingTexts[stepNum].map((text, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <p className="text-indigo-700 text-sm">{text}</p>
              </div>
            ))}
            {processingTexts[stepNum].length === 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <p className="text-gray-600 text-sm">Initializing...</p>
              </div>
            )}
          </div>
        </div>
      )
    }
    
    if (status !== 'completed' || !result) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-3">⏸️</div>
            <p>Waiting to start...</p>
          </div>
        </div>
      )
    }
    
    // Render completed results based on step number
    switch (stepNum) {
      case 1:
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-800 mb-4">Generated Persona</h3>
            <div className="text-indigo-700 space-y-3">
              {result.role && <p><span className="font-medium">Role:</span> {result.role}</p>}
              {result.area && <p><span className="font-medium">Area:</span> {result.area}</p>}
              {result.persona && (
                <div>
                  <span className="font-medium">Persona:</span>
                  {!personaStreamComplete ? (
                    <div className="mt-3 text-sm leading-relaxed prose prose-sm prose-indigo max-w-none">
                      <div dangerouslySetInnerHTML={{
                        __html: marked.parse(streamingPersonaText + (isStreamingPersona ? '<span class="inline-block w-2 h-4 bg-indigo-600 ml-1 animate-pulse">|</span>' : ''))
                      }} />
                    </div>
                  ) : (
                    <div className="mt-3 text-sm leading-relaxed prose prose-sm prose-indigo max-w-none" 
                         dangerouslySetInnerHTML={{__html: marked.parse(result.persona)}} />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Scoring Dimensions</h3>
            <div className="text-green-700 text-sm leading-relaxed prose prose-sm prose-green max-w-none" 
                 dangerouslySetInnerHTML={{__html: marked.parse(result.scoring_dimensions)}} />
          </div>
        )
      case 3:
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Content Pool Results</h3>
            <div className="text-blue-700">
              <p className="font-medium text-lg mb-3">{result.ranking_results?.processing_summary}</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-800">{result.ranking_results?.sources_scanned}</div>
                  <div className="text-sm text-blue-600">Sources Scanned</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-800">{result.ranking_results?.relevance_filtered}</div>
                  <div className="text-sm text-blue-600">Relevance Filtered</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-800">{result.ranking_results?.final_selection}</div>
                  <div className="text-sm text-blue-600">Final Selection</div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }
  
  if (currentView === 'onboarding' || showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }
  
  if (currentView === 'results') {
    return (
      <Results 
        rankingResults={stepResults[3]} 
        onBack={handleBackToSetup}
        onViewReader={handleViewReader}
      />
    )
  }

  if (currentView === 'reader') {
    return (
      <Reader 
        videoId={selectedVideoId}
        onBack={handleBackToResults}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Tuning your AI
        </h1>
        
        {renderProgressBar()}
        
        {/* Single Column Layout */}
        <div className="max-w-4xl mx-auto">
          {/* Main Content Display */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Dynamic Output Area */}
            <div className="min-h-64">
              {renderStepOutput(currentStep)}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 text-center">
          {stepStatuses[3] === 'completed' && (
            <div>
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Setup Complete!</h2>
              <p className="text-green-700 mb-6">
                Your personalized AI agent is ready to curate content for you.
              </p>
              <button
                onClick={handleRestartOnboarding}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
          
          {Object.values(stepStatuses).some(status => status === 'error') && (
            <button
              onClick={handleRestartOnboarding}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
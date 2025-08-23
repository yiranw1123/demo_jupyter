import { useState, useEffect } from 'react'
import { marked } from 'marked'
import Onboarding from './Onboarding'

function App() {
  const [loading, setLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true) // Always start with onboarding
  const [persona, setPersona] = useState(null)
  const [streamingPersonaText, setStreamingPersonaText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamComplete, setStreamComplete] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false)
  const [personaError, setPersonaError] = useState(null)
  const [personaLoaded, setPersonaLoaded] = useState(false)
  const [startStreaming, setStartStreaming] = useState(false)

  // No initial persona fetching - always start with onboarding

  // Character streaming effect - only trigger when explicitly requested
  useEffect(() => {
    if (!startStreaming || !persona?.persona) {
      console.log('Streaming effect: not ready', { startStreaming, hasPersona: !!persona?.persona })
      return
    }
    
    // Don't stream if already streaming
    if (isStreaming) {
      console.log('Streaming effect: already streaming, skipping')
      return
    }

    console.log('Starting streaming for persona text:', {
      personaLength: persona.persona.length,
      startStreaming: true
    })

    const fullText = persona.persona
    setStreamingPersonaText('')
    setIsStreaming(true)

    let streamInterval = null

    // Add a small delay before starting to simulate AI processing
    const startDelay = setTimeout(() => {
      console.log('Beginning character streaming...')
      let index = 0
      streamInterval = setInterval(() => {
        setStreamingPersonaText(fullText.slice(0, index + 1))
        index++
        
        if (index >= fullText.length) {
          clearInterval(streamInterval)
          setIsStreaming(false)
          setStreamComplete(true)
          setStartStreaming(false) // Reset trigger
          console.log('Streaming complete')
        }
      }, 20) // 20ms per character for faster streaming
    }, 500) // 500ms delay before starting

    return () => {
      clearTimeout(startDelay)
      if (streamInterval) {
        clearInterval(streamInterval)
      }
    }
  }, [startStreaming, persona?.persona]) // Trigger on startStreaming flag

  const handleOnboardingComplete = async (profile) => {
    console.log('Onboarding completed with profile:', profile)
    
    // Store user profile and redirect to persona page immediately
    setUserProfile(profile)
    setShowOnboarding(false)
    setLoading(false) // Don't show loading since we'll show cooking message
    
    // Start persona generation
    setIsGeneratingPersona(true)
    setPersonaError(null)
    setPersonaLoaded(false)
    setStartStreaming(false)
    
    try {
      console.log('Calling persona generation API with profile:', JSON.stringify(profile, null, 2))
      console.log('Making fetch request to:', 'http://localhost:8000/api/generate-persona')
      
      const response = await fetch('http://localhost:8000/api/generate-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile)
      })
      
      console.log('API response status:', response.status)
      console.log('API response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('API response result:', result)
        console.log('Result keys:', Object.keys(result))
        
        // Use persona data directly from API response
        const personaData = result.persona_data
        console.log('Extracted persona_data:', personaData)
        console.log('Persona data keys:', personaData ? Object.keys(personaData) : 'null')
        console.log('Persona text length:', personaData?.persona?.length)
        console.log('Persona text sample:', personaData?.persona?.substring(0, 100))
        
        // Validate persona data before setting state
        if (!personaData || !personaData.persona) {
          console.error('Invalid persona data received:', personaData)
          setPersonaError('Invalid persona data received from API')
          setIsGeneratingPersona(false)
          return
        }
        
        console.log('Persona data is valid, setting state...')
        
        // Set persona data
        console.log('About to set persona state...')
        setPersona(personaData)
        setPersonaLoaded(true)
        console.log('Persona state set')
        
        // Reset streaming states and trigger streaming
        setStreamComplete(false)
        setIsStreaming(false)
        setStreamingPersonaText('')
        
        // Trigger streaming with a small delay to ensure state is set
        setTimeout(() => {
          console.log('Triggering streaming animation...')
          setStartStreaming(true)
        }, 100)
        
        
        // Stop generating after persona is set
        setIsGeneratingPersona(false)
        console.log('Persona loaded, streaming should start automatically')
      } else {
        console.error('Failed to generate persona:', response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setPersonaError(`Failed to generate persona: ${response.statusText}`)
        setIsGeneratingPersona(false)
      }
    } catch (error) {
      console.error('Error calling persona generation API:', error)
      console.error('Error stack:', error.stack)
      setPersonaError(`Error: ${error.message}`)
      setIsGeneratingPersona(false)
    }
  }

  const handleRestartOnboarding = () => {
    console.log('handleRestartOnboarding called! Current state:', {
      showOnboarding,
      isGeneratingPersona,
      personaError,
      personaLoaded,
      persona: !!persona
    })
    setShowOnboarding(true)
    // Reset all states
    setPersona(null)
    setUserProfile(null)
    setIsGeneratingPersona(false)
    setStreamComplete(false)
    setIsStreaming(false)
    setStreamingPersonaText('')
    setPersonaError(null)
    setPersonaLoaded(false)
    setStartStreaming(false)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Your Agent Profile
        </h1>
        
        {isGeneratingPersona ? (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-8 mb-6 text-center">
            <div className="mb-4">
              <div className="text-6xl mb-4">🍳</div>
              <h2 className="text-2xl font-bold text-orange-800 mb-2">Your Profile is cooking....</h2>
              <p className="text-orange-700">
                We're analyzing your preferences to create your personalized AI agent profile.
              </p>
            </div>
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        ) : personaError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-center">
            <div className="text-4xl mb-3">❌</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Generation Failed</h2>
            <p className="text-red-700 mb-4">{personaError}</p>
            <button
              onClick={handleRestartOnboarding}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : personaLoaded && persona && (persona.role || persona.area || persona.persona) ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-indigo-800">Your Persona</h2>
            </div>
            <div className="text-indigo-700 space-y-2">
              {persona.role && (
                <p>
                  <span className="font-medium">Role:</span> {persona.role}
                </p>
              )}
              {persona.area && (
                <p>
                  <span className="font-medium">Area:</span> {persona.area}
                </p>
              )}
              {persona.persona && (
                <div>
                  <span className="font-medium">Persona:</span>
                  {!streamComplete ? (
                    <div className="mt-2 text-sm leading-relaxed prose prose-sm prose-indigo max-w-none">
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(streamingPersonaText + (isStreaming ? '<span class="inline-block w-2 h-4 bg-indigo-600 ml-1 animate-pulse cursor-blink">|</span>' : ''))
                        }} 
                      />
                    </div>
                  ) : (
                    <div 
                      className="mt-2 text-sm leading-relaxed prose prose-sm prose-indigo max-w-none" 
                      dangerouslySetInnerHTML={{__html: marked.parse(persona.persona)}} 
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default App

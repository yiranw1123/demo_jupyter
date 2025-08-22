import { useState, useEffect } from 'react'
import { marked } from 'marked'
import Onboarding from './Onboarding'

function App() {
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [persona, setPersona] = useState(null)

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const personaResponse = await fetch('/persona.json')
        const personaData = await personaResponse.json()
        setPersona(personaData)
      } catch (error) {
        console.error('Failed to load persona:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPersona()
  }, [])

  const handleOnboardingComplete = () => {
    // Profile data from onboarding is stored, but we now display persona from persona.json
    setShowOnboarding(false)
  }

  const handleRestartOnboarding = () => {
    setShowOnboarding(true)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Your AI Agent Profile
        </h1>
        
        {persona && (persona.role || persona.area || persona.persona) && (
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
                  <div 
                    className="mt-2 text-sm leading-relaxed prose prose-sm prose-indigo max-w-none" 
                    dangerouslySetInnerHTML={{__html: marked.parse(persona.persona)}} 
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your profile...</p>
          </div>
        ) : !persona || (!persona.role && !persona.area && !persona.persona) ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Found</h3>
              <p className="text-gray-600">Complete the onboarding process to generate your AI agent profile.</p>
            </div>
            <button
              onClick={handleRestartOnboarding}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Onboarding
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default App

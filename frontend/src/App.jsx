import { useState, useEffect } from 'react'
import Onboarding from './Onboarding'

function App() {
  const [message, setMessage] = useState('')
  const [health, setHealth] = useState('')
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rootResponse, healthResponse] = await Promise.all([
          fetch('http://localhost:8000/'),
          fetch('http://localhost:8000/api/health')
        ])
        
        const rootData = await rootResponse.json()
        const healthData = await healthResponse.json()
        
        setMessage(rootData.message)
        setHealth(healthData.status)
      } catch {
        setMessage('Failed to connect to backend')
        setHealth('unhealthy')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleOnboardingComplete = (profile) => {
    setUserProfile(profile)
    setShowOnboarding(false)
  }

  const handleRestartOnboarding = () => {
    setShowOnboarding(true)
    setUserProfile(null)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          React + Tailwind + FastAPI
        </h1>
        
        {userProfile && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold text-indigo-800">Your Profile</h2>
              <button
                onClick={handleRestartOnboarding}
                className="
                  text-indigo-600 hover:text-indigo-800 text-sm font-medium
                  transition-colors duration-200 ease-out
                  hover:underline flex items-center gap-1
                "
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Edit
              </button>
            </div>
            <p className="text-indigo-700">
              <span className="font-medium">Category:</span> {userProfile.category}<br />
              <span className="font-medium">Role:</span> {userProfile.role}
              {userProfile.challenges && userProfile.challenges.length > 0 && (
                <>
                  <br />
                  <span className="font-medium">Focus Areas:</span> {userProfile.challenges.map(c => c.label).join(', ')}
                </>
              )}
              {userProfile.trustedSource && (
                <>
                  <br />
                  <span className="font-medium">Trusted Source:</span> {userProfile.trustedSource.name}
                </>
              )}
              {userProfile.contentPreferences && Object.keys(userProfile.contentPreferences).length > 0 && (
                <>
                  <br />
                  <span className="font-medium">Content Preferences:</span> Calibrated ({Object.keys(userProfile.contentPreferences).length} items rated)
                </>
              )}
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Connecting to backend...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Backend Message</h2>
              <p className="text-green-700">{message}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Health Status</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                health === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {health}
              </span>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Frontend running on localhost:5173<br />
            Backend running on localhost:8000
          </p>
        </div>
      </div>
    </div>
  )
}

export default App

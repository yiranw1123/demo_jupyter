import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { API_BASE_URL } from './config'

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  sanitize: false
})

function Reader({ videoId, onBack }) {
  const [article, setArticle] = useState('')
  const [keyInsights, setKeyInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  useEffect(() => {
    const loadContent = async () => {
      if (!videoId) return

      setLoading(true)
      setError(null)

      try {
        // Load article content
        const articleResponse = await fetch(`${API_BASE_URL}/api/content/${videoId}/article`)
        if (!articleResponse.ok) {
          throw new Error('Failed to load article content')
        }
        const articleText = await articleResponse.text()
        console.log('=== RAW MARKDOWN FROM API ===')
        console.log('Full article text:')
        console.log(articleText)
        console.log('=== END RAW MARKDOWN ===')
        console.log('First 200 chars:', articleText.substring(0, 200))
        setArticle(articleText)

        // Load key insights
        const insightsResponse = await fetch(`${API_BASE_URL}/api/content/${videoId}/insights`)
        if (!insightsResponse.ok) {
          throw new Error('Failed to load key insights')
        }
        const insightsData = await insightsResponse.json()
        setKeyInsights(insightsData)

      } catch (err) {
        console.error('Error loading content:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [videoId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Content</h3>
          <p className="text-gray-600">Please wait while we load the article and key insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Content</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            ← Back to Results
          </button>
        </div>
      </div>
    )
  }

  const currentInsights = keyInsights?.[selectedLanguage]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Results</span>
          </button>
        </div>

        {/* Section Headers */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Insight</h2>
            <div className="h-1 w-16 bg-indigo-500 rounded mt-2"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Article</h2>
            <div className="h-1 w-16 bg-green-500 rounded mt-2"></div>
          </div>
        </div>

        {/* Two-column layout - Side by side */}
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-8rem)] min-h-0">
          {/* Left Column - Key Insights */}
          <div className="bg-white rounded-lg shadow-lg flex flex-col min-h-0">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-end items-center">
                {/* Language Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedLanguage('en')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedLanguage === 'en'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('zh')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedLanguage === 'zh'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    ZH
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {currentInsights ? (
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Title</h3>
                    <div 
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: marked.parse(currentInsights.title) }}
                    />
                  </div>

                  {/* Hook */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Summary</h3>
                    <div 
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: marked.parse(currentInsights.hook) }}
                    />
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Highlights</h3>
                    <div className="space-y-4">
                      {currentInsights.highlights?.map((highlight, index) => (
                        <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50 rounded-r-lg">
                          <div 
                            className="font-medium text-gray-800 mb-2 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked.parse(highlight.header) }}
                          />
                          <div 
                            className="text-gray-700 text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked.parse(highlight.content) }}
                          />
                          {highlight.clip && (
                            <div className="text-xs text-indigo-600 mt-2 font-mono">
                              📍 {highlight.clip}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <div className="text-4xl mb-3">📄</div>
                  <p>No insights available for this content.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Full Article */}
          <div className="bg-white rounded-lg shadow-lg flex flex-col min-h-0">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {article ? (
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: (() => {
                    const parsed = marked.parse(article)
                    console.log('Parsed markdown HTML:', parsed.substring(0, 200))
                    return parsed
                  })() }} />
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <div className="text-4xl mb-3">📖</div>
                  <p>No article content available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reader
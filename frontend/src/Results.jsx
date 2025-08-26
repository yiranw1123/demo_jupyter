import { useState, useEffect } from 'react'
import { API_BASE_URL } from './config'

function Results({ rankingResults, onBack, onViewReader }) {
  const [videoMetadata, setVideoMetadata] = useState({})
  const [loadingMetadata, setLoadingMetadata] = useState(false)

  // Get the top ranked content and sort by weighted score
  const rankedContent = rankingResults?.ranking_results?.ranked_content || []
  const sortedContent = [...rankedContent].sort((a, b) => b.final_weighted_score - a.final_weighted_score)
  const topResults = sortedContent.slice(0, 4)

  // Fetch video metadata for all top results
  useEffect(() => {
    const fetchVideoMetadata = async () => {
      if (topResults.length === 0) return
      
      // Check if we already have all the metadata we need
      const videoIds = topResults.map(item => item.videoId)
      const missingIds = videoIds.filter(id => !videoMetadata[id])
      
      if (missingIds.length === 0) return
      
      setLoadingMetadata(true)
      const metadata = { ...videoMetadata }
      
      try {
        await Promise.all(
          missingIds.map(async (videoId) => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/video/${videoId}`)
              if (response.ok) {
                const result = await response.json()
                metadata[videoId] = result.video
              } else {
                console.error(`Failed to fetch metadata for ${videoId}`)
                metadata[videoId] = null
              }
            } catch (error) {
              console.error(`Error fetching metadata for ${videoId}:`, error)
              metadata[videoId] = null
            }
          })
        )
        
        setVideoMetadata(metadata)
      } catch (error) {
        console.error('Error fetching video metadata:', error)
      } finally {
        setLoadingMetadata(false)
      }
    }
    
    fetchVideoMetadata()
  }, [topResults.map(item => item.videoId).join(',')])

  // Get enhanced video details combining ranking and metadata
  const getVideoDetails = (rankingItem) => {
    const metadata = videoMetadata[rankingItem.videoId]
    return {
      ...rankingItem,
      title: metadata?.title || rankingItem.title || `Video ${rankingItem.videoId}`,
      author: metadata?.author || rankingItem.author || 'Unknown Author',
      description: metadata?.description || rankingItem.description || 'No description available.',
      duration: metadata?.duration,
      publishedAt: metadata?.publishedAt,
      viewCount: metadata?.viewCount,
      thumbnail: metadata?.thumbnail
    }
  }

  if (!topResults || topResults.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any ranked content to display.
          </p>
          <button
            onClick={onBack}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Your Personalized Content
          </h1>
          <p className="text-gray-600">
            Top {topResults.length} recommendations ranked by your personalized scoring dimensions
          </p>
        </div>

        {/* Loading State */}
        {loadingMetadata && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 text-indigo-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Loading video details...</span>
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {topResults.map((item, index) => {
            const videoDetails = getVideoDetails(item)
            
            return (
              <div
                key={item.videoId}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-indigo-500"
              >
                {/* Rank Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">
                    #{index + 1}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {item.final_weighted_score?.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>

                {/* Thumbnail */}
                {videoDetails.thumbnail && (
                  <div className="mb-4">
                    <img 
                      src={videoDetails.thumbnail}
                      alt={videoDetails.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Content Details */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {videoDetails.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    by {videoDetails.author}
                  </p>
                  {videoDetails.duration && (
                    <p className="text-gray-500 text-xs mb-2">
                      Duration: {videoDetails.duration}
                    </p>
                  )}
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {videoDetails.description}
                  </p>
                </div>

              {/* Scoring Breakdown */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Scoring Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(item.scores || {}).map(([dimension, scoreData]) => (
                    <div key={dimension} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 flex-1">{dimension}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(scoreData.score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8">
                          {scoreData.score}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t">
                <button 
                  onClick={() => onViewReader(item.videoId)}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Get Your Quick Take
                </button>
              </div>
            </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ranking Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{rankedContent.length}</div>
              <div className="text-sm text-gray-600">Total Items Ranked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{topResults.length}</div>
              <div className="text-sm text-gray-600">Top Results</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {topResults.length > 0 ? topResults[0].final_weighted_score?.toFixed(2) : '0'}
              </div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {topResults.length > 0 
                  ? (topResults.reduce((sum, item) => sum + (item.final_weighted_score || 0), 0) / topResults.length).toFixed(2)
                  : '0'
                }
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={onBack}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            ← Back to Setup
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Start New Session
          </button>
        </div>
      </div>
    </div>
  )
}

export default Results
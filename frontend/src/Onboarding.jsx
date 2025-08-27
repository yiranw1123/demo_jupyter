import { useState } from 'react'

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState('1a')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [stepJustEntered, setStepJustEntered] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [contentRatings, setContentRatings] = useState({})

  const categories = [
    {
      id: 'leadership',
      emoji: '👔',
      label: 'Leadership',
      description: 'I lead teams'
    },
    {
      id: 'specialist',
      emoji: '🛠',
      label: 'Specialist',
      description: 'I build products'
    },
    {
      id: 'cross-functional',
      emoji: '📚',
      label: 'Cross-functional',
      description: 'I advise / research'
    }
  ]

  const rolesByCategory = {
    leadership: [
      'C-Level Executive (CEO, CTO, CFO, CMO, etc.)',
      'VP/Director (Department heads, senior leadership)',
      'Manager/Team Lead (People managers, project leads)'
    ],
    specialist: [
      'Product Manager',
      'Engineer/Developer',
      'Designer',
      'Data/Analytics Professional',
      'Marketing/Growth',
      'Sales/Business Development'
    ],
    'cross-functional': [
      'Consultant/Advisor',
      'Researcher/Academic',
      'Founder/Entrepreneur',
      'Other (text input)'
    ]
  }

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
    setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep('1b')
        setStepJustEntered('1b')
        setIsTransitioning(false)
        setTimeout(() => setStepJustEntered(''), 400)
      }, 400)
    }, 500)
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
  }

  // Legacy function kept for potential future use
  // const handleNext = () => {
  //   onComplete({ category: selectedCategory, role: selectedRole })
  // }

  const handleBack = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep('1a')
      setSelectedRole('')
      setStepJustEntered('1a')
      setIsTransitioning(false)
      setTimeout(() => setStepJustEntered(''), 400)
    }, 400)
  }

  const sampleContent = [
    {
      id: 'ai-moats',
      title: 'The Economic Moats of Modern AI Platforms',
      source: 'Ben Thompson, Stratechery',
      type: 'article',
      duration: '15 min read',
      snippet: 'An in-depth analysis of why foundational models are becoming commoditized while application layers capture value...',
      tags: ['Strategy', 'AI', 'Economics']
    },
    {
      id: 'ai-scaling',
      title: 'Scaling AI Teams: From MVP to Enterprise',
      source: 'a16z Portfolio Insights',
      type: 'video',
      duration: '28 min watch',
      snippet: 'How successful startups structure their AI teams as they grow from 10 to 100+ engineers...',
      tags: ['Team Building', 'AI', 'Scaling']
    },
    {
      id: 'competitive-ai',
      title: 'How OpenAI, Anthropic, and Google Stack Up',
      source: 'The Information',
      type: 'analysis',
      duration: '12 min read',
      snippet: 'A detailed comparison of capabilities, pricing, and strategic positioning across major AI providers...',
      tags: ['Competitive Intel', 'AI', 'Market Analysis']
    },
    {
      id: 'product-led-ai',
      title: 'Building AI Products That Sell Themselves',
      source: 'First Round Review',
      type: 'guide',
      duration: '20 min read',
      snippet: 'Product-led growth strategies specifically for AI-powered products, with case studies from successful launches...',
      tags: ['Product', 'GTM', 'AI']
    },
    {
      id: 'ai-leadership',
      title: 'Leading Through the AI Transformation',
      source: 'Harvard Business Review',
      type: 'article',
      duration: '18 min read',
      snippet: 'How executives can guide their organizations through AI adoption while managing cultural and operational changes...',
      tags: ['Leadership', 'AI', 'Transformation']
    },
    {
      id: 'global-ai',
      title: 'AI Market Expansion: Asia vs. Europe vs. US',
      source: 'McKinsey Global Institute',
      type: 'report',
      duration: '25 min read',
      snippet: 'Regional differences in AI adoption, regulation, and market opportunities across major global markets...',
      tags: ['Market Expansion', 'Global', 'AI']
    }
  ]

  const handleContentRating = (contentId, rating) => {
    setContentRatings(prev => ({
      ...prev,
      [contentId]: rating
    }))
  }

  const handleStep3bBack = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep('1b')
      setStepJustEntered('1b')
      setIsTransitioning(false)
      setTimeout(() => setStepJustEntered(''), 400)
    }, 400)
  }

  const handleFinalNext = () => {
    // Create content calibration categorized by rating (read, want, pass)
    const contentCalibration = {
      read: [],
      want: [],
      pass_on: []
    }

    Object.keys(contentRatings).forEach(contentId => {
      const content = sampleContent.find(c => c.id === contentId)
      const contentData = {
        title: content?.title,
        tags: content?.tags,
        source: content?.source
      }
      
      const rating = contentRatings[contentId]
      if (rating === 'read') {
        contentCalibration.read.push(contentData)
      } else if (rating === 'want') {
        contentCalibration.want.push(contentData)
      } else if (rating === 'not') {
        contentCalibration.pass_on.push(contentData)
      }
    })
    
    const userProfile = {
      category: selectedCategory, 
      role: selectedRole,
      contentCalibration: contentCalibration,
      timestamp: new Date().toISOString()
    }

    onComplete(userProfile)
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'article': return '📄'
      case 'video': return '🎥'
      case 'podcast': return '🎧'
      case 'analysis': return '📊'
      case 'guide': return '📋'
      case 'report': return '📈'
      default: return '📄'
    }
  }

  const getRatedContentCount = () => {
    return Object.keys(contentRatings).length
  }

  const handleStep1bNext = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep('3b')
      setStepJustEntered('3b')
      setIsTransitioning(false)
      setTimeout(() => setStepJustEntered(''), 400)
    }, 400)
  }

  const getCategoryLabel = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.label : ''
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-2xl w-full relative">
        
        {/* Step 1a - Category Selection */}
        <div className={`absolute inset-0 flex items-center justify-center ${
          currentStep === '1a' 
            ? isTransitioning 
              ? 'animate-[stepSlideOut_0.4s_ease-in-out_forwards]' 
              : 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full hidden'
        }`}>
          <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Tell us where you're coming from.
            </h1>
            <p className="text-lg text-gray-600">
              Pick the description that feels closest to your work.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`
                  relative bg-white rounded-xl p-4 sm:p-6 lg:p-8 border-2 cursor-pointer
                  transition-all duration-300 ease-out
                  hover:shadow-xl hover:border-indigo-300
                  ${selectedCategory === category.id 
                    ? 'border-indigo-500 shadow-lg ring-4 ring-indigo-100' 
                    : 'border-gray-200 shadow-md hover:border-indigo-200'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-4">{category.emoji}</div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                    {category.label}
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600">{category.description}</p>
                </div>
                
                {selectedCategory === category.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center transition-all duration-300 ease-out animate-slideInFromTop">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedCategory && (
            <div className="text-center text-gray-600 opacity-0 animate-slideInFromTop"
                 style={{animation: 'slideInFromTop 0.5s ease-out forwards'}}>
              <p className="text-lg">
                Got it. You see yourself as <span className="font-semibold text-indigo-600">
                  {getCategoryLabel(selectedCategory)}
                </span>. Let's narrow it down.
              </p>
            </div>
          )}
          </div>
        </div>

        {/* Step 1b - Role Selection */}
        <div className={`absolute inset-0 flex items-center justify-center ${
          currentStep === '1b' 
            ? isTransitioning 
              ? 'step-slide-out' 
              : stepJustEntered === '1b'
                ? 'step-slide-in'
                : 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full pointer-events-none'
        }`}>
          <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Great, let's get more specific.
            </h1>
            <p className="text-lg text-gray-600">
              Choose the role that best matches your day-to-day.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {selectedCategory && rolesByCategory[selectedCategory]?.map((role, index) => (
              <div
                key={index}
                onClick={() => handleRoleSelect(role)}
                className={`
                  bg-white rounded-lg p-6 border-2 cursor-pointer
                  transition-all duration-200 ease-out
                  hover:shadow-md hover:border-indigo-300
                  ${selectedRole === role 
                    ? 'border-indigo-500 shadow-lg bg-indigo-50 ring-2 ring-indigo-200' 
                    : 'border-gray-200 hover:border-indigo-200'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">{role}</span>
                  {selectedRole === role && (
                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center transition-all duration-300 ease-out animate-slideInFromTop">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleBack}
              className="
                bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium
                transition-all duration-200 ease-out
                hover:bg-gray-200 hover:shadow-md
                focus:outline-none focus:ring-4 focus:ring-gray-200
                flex items-center gap-2
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {selectedRole && (
              <div className="text-center flex-1 mx-8">
                <p className="text-lg text-gray-600 mb-6 opacity-0"
                   style={{animation: 'slideInFromTop 0.5s ease-out forwards'}}>
                  Perfect, we'll tailor recommendations for <span className="font-semibold text-indigo-600">
                    {selectedRole}
                  </span>.
                </p>
              </div>
            )}

            {selectedRole && (
              <button
                onClick={handleStep1bNext}
                className="
                  bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold
                  transition-all duration-200 ease-out
                  hover:bg-indigo-700 hover:shadow-lg
                  focus:outline-none focus:ring-4 focus:ring-indigo-200
                  opacity-0
                "
                style={{animation: 'slideInFromTop 0.3s ease-out forwards'}}
              >
                Next
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Step 3b - Content Calibration */}
        <div className={`absolute inset-0 flex items-center justify-center ${
          currentStep === '3b' 
            ? isTransitioning 
              ? 'step-slide-out' 
              : stepJustEntered === '3b'
                ? 'step-slide-in'
                : 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full pointer-events-none'
        }`}>
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Let's fine-tune what feels valuable to you.
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Here's a mix of high-impact content. Tell us what resonates—and what doesn't.
              </p>
              <p className="text-base text-gray-500">
                Click whether you've read, want to read, or not for you. Your choices will teach the agent what is—and isn't—worth surfacing.
              </p>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-500">Content Calibration</div>
              <div className="text-sm text-indigo-600 font-medium">
                {getRatedContentCount()} of {sampleContent.length} rated
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {sampleContent.map((content) => (
                <div
                  key={content.id}
                  className={`
                    bg-white rounded-lg border-2 p-4 transition-all duration-200 ease-out
                    ${contentRatings[content.id] 
                      ? 'border-green-200 bg-green-50 opacity-90' 
                      : 'border-gray-200 hover:border-indigo-200'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getContentTypeIcon(content.type)}</span>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{content.title}</h3>
                          <p className="text-xs text-gray-600">{content.source} | {content.duration}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{content.snippet}</p>
                      <div className="flex gap-2">
                        {content.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleContentRating(content.id, 'read')}
                      className={`
                        px-3 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center gap-1
                        ${contentRatings[content.id] === 'read'
                          ? 'bg-green-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                        }
                      `}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Read
                    </button>
                    
                    <button
                      onClick={() => handleContentRating(content.id, 'want')}
                      className={`
                        px-3 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center gap-1
                        ${contentRatings[content.id] === 'want'
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-800'
                        }
                      `}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Want
                    </button>
                    
                    <button
                      onClick={() => handleContentRating(content.id, 'not')}
                      className={`
                        px-3 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center gap-1
                        ${contentRatings[content.id] === 'not'
                          ? 'bg-red-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-800'
                        }
                      `}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Pass
                    </button>
                  </div>

                  {contentRatings[content.id] && (
                    <div className="mt-2 text-center opacity-0" style={{animation: 'slideInFromTop 0.3s ease-out forwards'}}>
                      <span className="text-xs text-green-600 font-medium">
                        {contentRatings[content.id] === 'read' && 'Noted: You\'ve read similar content'}
                        {contentRatings[content.id] === 'want' && 'Noted: You want more like this'}
                        {contentRatings[content.id] === 'not' && 'Noted: We\'ll avoid similar content'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleStep3bBack}
                className="
                  bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium
                  transition-all duration-200 ease-out
                  hover:bg-gray-200 hover:shadow-md
                  focus:outline-none focus:ring-4 focus:ring-gray-200
                  flex items-center gap-2
                "
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {getRatedContentCount() > 0 && (
                <button
                  onClick={handleFinalNext}
                  className="
                    bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold
                    transition-all duration-200 ease-out
                    hover:bg-indigo-700 hover:shadow-lg
                    focus:outline-none focus:ring-4 focus:ring-indigo-200
                    opacity-0
                  "
                  style={{animation: 'slideInFromTop 0.3s ease-out forwards'}}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Onboarding
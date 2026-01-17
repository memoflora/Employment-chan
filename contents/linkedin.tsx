import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useRef, useState } from "react"

// Import both mouth states for talking animation
import waifuMouthClosed from "data-base64:~assets/waifu-with-mouth-closed.jpeg"
import waifuMouthOpen from "data-base64:~assets/waifu-with-mouth-opened.jpeg"

// Debug: Log if images are different
console.log("[Employment-chan] Images loaded - are they different?", 
  waifuMouthClosed !== waifuMouthOpen, 
  "Closed length:", waifuMouthClosed?.length, 
  "Open length:", waifuMouthOpen?.length
)

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// Confetti particle component
const Confetti = () => {
  const colors = ["#ff6b6b", "#ffd700", "#4ecdc4", "#ff8e53", "#a855f7", "#3b82f6"]
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360
  }))

  return (
    <div className="ec-confetti-container">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="ec-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            transform: `rotate(${piece.rotation}deg)`
          }}
        />
      ))}
    </div>
  )
}

// Audio context singleton
let audioContext: AudioContext | null = null

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// Play celebration sound (initial jingle)
const playCelebrationSound = () => {
  const ctx = getAudioContext()
  
  const playNote = (frequency: number, startTime: number, duration: number) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = "sine"
    
    gainNode.gain.setValueAtTime(0.2, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
    
    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }
  
  // Play a cheerful ascending melody
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
  notes.forEach((note, i) => {
    playNote(note, now + i * 0.12, 0.25)
  })
}

// Play "mimimi" talking sound like Animal Crossing
const playMimiSound = () => {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  
  // Create a cute "mi" sound - high pitched blip
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  
  // Randomize pitch slightly for variety (like Animal Crossing)
  const baseFreq = 600 + Math.random() * 200 // 600-800 Hz range
  oscillator.frequency.setValueAtTime(baseFreq, now)
  oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.05)
  oscillator.type = "sine"
  
  // Quick attack, quick decay
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06)
  
  oscillator.start(now)
  oscillator.stop(now + 0.07)
}

// Typewriter text component with talking animation
const TypewriterText = ({
  text,
  onTypingStateChange,
  speed = 30
}: {
  text: string
  onTypingStateChange: (isTyping: boolean) => void
  speed?: number
}) => {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const callbackRef = useRef(onTypingStateChange)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onTypingStateChange
  }, [onTypingStateChange])
  
  useEffect(() => {
    if (!text) return
    
    console.log("[Employment-chan] Starting typewriter for:", text.substring(0, 30) + "...")
    
    setDisplayedText("")
    setIsComplete(false)
    indexRef.current = 0
    
    // Notify that typing started
    callbackRef.current(true)
    
    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        const char = text[indexRef.current]
        setDisplayedText(text.slice(0, indexRef.current + 1))
        
        // Play sound for non-space characters
        if (char !== " " && char !== "\n") {
          playMimiSound()
        }
        
        indexRef.current++
        
        // Vary timing slightly for more natural feel
        const nextDelay = char === " " ? speed * 0.5 : 
                         char === "." || char === "!" || char === "?" ? speed * 3 :
                         char === "," || char === "~" ? speed * 2 :
                         speed + (Math.random() * 10 - 5)
        
        timeoutRef.current = setTimeout(typeNextChar, nextDelay)
      } else {
        console.log("[Employment-chan] Typewriter complete")
        setIsComplete(true)
        callbackRef.current(false)
      }
    }
    
    // Start typing after a brief delay
    timeoutRef.current = setTimeout(typeNextChar, 300)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, speed])
  
  return (
    <span>
      {displayedText}
      {!isComplete && <span className="ec-cursor">|</span>}
    </span>
  )
}

// Talking waifu component with mouth animation
const TalkingWaifu = ({ isTalking }: { isTalking: boolean }) => {
  const [frameIndex, setFrameIndex] = useState(0)
  
  console.log("[Employment-chan] TalkingWaifu render - isTalking:", isTalking, "frameIndex:", frameIndex)
  
  useEffect(() => {
    console.log("[Employment-chan] TalkingWaifu useEffect - isTalking:", isTalking)
    
    if (!isTalking) {
      setFrameIndex(0) // Mouth closed when not talking
      return
    }
    
    console.log("[Employment-chan] Starting mouth animation loop")
    
    // Use setInterval for reliable timing
    const intervalId = setInterval(() => {
      setFrameIndex(prev => {
        const next = prev === 0 ? 1 : 0
        console.log("[Employment-chan] Frame:", next)
        return next
      })
    }, 120)
    
    return () => {
      console.log("[Employment-chan] Cleaning up mouth animation")
      clearInterval(intervalId)
    }
  }, [isTalking])
  
  return (
    <div className="ec-waifu-container">
      {/* Render both images, toggle visibility */}
      <img 
        src={waifuMouthClosed}
        alt="Employment-chan"
        className="ec-waifu"
        style={{ display: frameIndex === 0 ? 'block' : 'none' }}
      />
      <img 
        src={waifuMouthOpen}
        alt="Employment-chan"
        className="ec-waifu"
        style={{ display: frameIndex === 1 ? 'block' : 'none' }}
      />
    </div>
  )
}

// Extract job info from LinkedIn page
const extractJobInfo = (): { jobTitle?: string; company?: string } => {
  // Try multiple selectors for job title
  const titleSelectors = [
    ".job-details-jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title",
    ".t-24.job-details-jobs-unified-top-card__job-title",
    "h1.t-24",
    ".jobs-details__main-content h1",
    '[data-test-job-title]'
  ]
  
  // Try multiple selectors for company name
  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-details__main-content .jobs-unified-top-card__subtitle-primary-grouping a",
    '[data-test-company-name]'
  ]
  
  let jobTitle: string | undefined
  let company: string | undefined
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector)
    if (element?.textContent?.trim()) {
      jobTitle = element.textContent.trim()
      break
    }
  }
  
  for (const selector of companySelectors) {
    const element = document.querySelector(selector)
    if (element?.textContent?.trim()) {
      company = element.textContent.trim()
      break
    }
  }
  
  console.log("[Employment-chan] Extracted job info:", { jobTitle, company })
  return { jobTitle, company }
}

// Get application stats
const getApplicationStats = async (): Promise<{ todayCount: number; totalCount: number }> => {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve({ todayCount: 1, totalCount: 1 })
      return
    }
    
    chrome.storage.local.get(["applicationCount", "applications"], (result) => {
      const totalCount = result.applicationCount || 0
      const applications = result.applications || []
      
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const todayCount = applications.filter(
        (app: { timestamp: number }) => app.timestamp > oneDayAgo
      ).length
      
      resolve({ todayCount, totalCount })
    })
  })
}

// Track application count and get AI message
const incrementApplicationCount = async (): Promise<{
  count: number
  message: string
  jobTitle?: string
  company?: string
}> => {
  // Extract job info before incrementing (in case page changes)
  const { jobTitle, company } = extractJobInfo()
  
  return new Promise((resolve) => {
    // Safety check for chrome.storage
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve({ 
        count: 1, 
        message: "You did it! One step closer to your dream job!",
        jobTitle,
        company
      })
      return
    }
    
    chrome.storage.local.get(["applicationCount", "applications"], async (result) => {
      const newCount = (result.applicationCount || 0) + 1
      const applications = result.applications || []
      
      // Add new application record
      applications.push({
        timestamp: Date.now(),
        site: "LinkedIn",
        url: window.location.href,
        jobTitle,
        company
      })
      
      chrome.storage.local.set({ 
        applicationCount: newCount,
        applications: applications 
      }, async () => {
        // Get today's count
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        const todayCount = applications.filter(
          (app: { timestamp: number }) => app.timestamp > oneDayAgo
        ).length
        
        // Request AI-generated message from background script
        let message = "You did it! One step closer to your dream job!"
        
        try {
          if (chrome.runtime?.sendMessage) {
            const response = await chrome.runtime.sendMessage({
              type: "GENERATE_CELEBRATION_MESSAGE",
              jobTitle,
              company,
              todayCount,
              totalCount: newCount
            })
            
            if (response?.message) {
              message = response.message
            }
          }
        } catch (error) {
          console.error("[Employment-chan] Error getting AI message:", error)
        }
        
        resolve({ count: newCount, message, jobTitle, company })
      })
    })
  })
}

// Celebration overlay component
const CelebrationOverlay = ({
  show,
  onClose,
  applicationCount,
  message,
  jobTitle,
  company
}: {
  show: boolean
  onClose: () => void
  applicationCount: number
  message: string
  jobTitle?: string
  company?: string
}) => {
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const autoCloseRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleTypingStateChange = useCallback((typing: boolean) => {
    console.log("[Employment-chan] Typing state changed:", typing)
    // When typing stops, mark as complete
    if (!typing) {
      setIsTypingComplete(true)
      // Auto-close 4 seconds after typing finishes
      autoCloseRef.current = setTimeout(() => {
        onClose()
      }, 4000)
    }
  }, [onClose])
  
  useEffect(() => {
    if (show) {
      // Play initial celebration sound
      playCelebrationSound()
      setIsTypingComplete(false)
    }
    
    return () => {
      if (autoCloseRef.current) {
        clearTimeout(autoCloseRef.current)
      }
    }
  }, [show])
  
  // isTalking is true when overlay is shown and typing is not complete
  const isTalking = show && !isTypingComplete
  
  console.log("[Employment-chan] CelebrationOverlay - show:", show, "isTypingComplete:", isTypingComplete, "isTalking:", isTalking)

  if (!show) return null

  const handleClose = () => {
    if (isTypingComplete) {
      if (autoCloseRef.current) {
        clearTimeout(autoCloseRef.current)
      }
      onClose()
    }
  }

  return (
    <div className="ec-overlay" onClick={handleClose}>
      <Confetti />
      <div className="ec-container" onClick={(e) => e.stopPropagation()}>
        <div className="ec-count-badge">
          Application #{applicationCount}
        </div>
        {(jobTitle || company) && (
          <div className="ec-job-info">
            {jobTitle && <span className="ec-job-title">{jobTitle}</span>}
            {jobTitle && company && <span className="ec-job-separator">at</span>}
            {company && <span className="ec-job-company">{company}</span>}
          </div>
        )}
        <TalkingWaifu isTalking={isTalking} />
        <div className="ec-speech-bubble">
          <p className="ec-message">
            <TypewriterText 
              text={message} 
              onTypingStateChange={handleTypingStateChange}
              speed={35}
            />
          </p>
        </div>
        <button 
          className={`ec-close-btn ${!isTypingComplete ? 'ec-close-btn-disabled' : ''}`}
          onClick={handleClose}
          disabled={!isTypingComplete}
        >
          {isTypingComplete ? "Thanks, Employment-chan!" : "..."}
        </button>
      </div>
    </div>
  )
}

// Main content script component
const LinkedInWatcher = () => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [applicationCount, setApplicationCount] = useState(0)
  const [celebrationMessage, setCelebrationMessage] = useState("")
  const [jobTitle, setJobTitle] = useState<string | undefined>()
  const [company, setCompany] = useState<string | undefined>()
  const [triggeredUrls, setTriggeredUrls] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const triggerCelebration = useCallback(async (url?: string) => {
    // Prevent double triggers for the same URL
    if (url && triggeredUrls.has(url)) {
      console.log("[Employment-chan] Already celebrated this application, skipping")
      return
    }
    
    if (isLoading) {
      console.log("[Employment-chan] Already loading, skipping")
      return
    }
    
    if (url) {
      setTriggeredUrls(prev => new Set(prev).add(url))
    }
    
    console.log("[Employment-chan] Triggering celebration!")
    setIsLoading(true)
    
    try {
      const result = await incrementApplicationCount()
      setApplicationCount(result.count)
      setCelebrationMessage(result.message)
      setJobTitle(result.jobTitle)
      setCompany(result.company)
      setShowCelebration(true)
    } catch (error) {
      console.error("[Employment-chan] Error:", error)
      setCelebrationMessage("You did it! One step closer to your dream job!")
      setShowCelebration(true)
    } finally {
      setIsLoading(false)
    }
  }, [triggeredUrls, isLoading])

  useEffect(() => {
    console.log("[Employment-chan] LinkedIn watcher activated!")
    
    // Check if current URL is a post-apply page
    const checkForPostApplyUrl = () => {
      const url = window.location.href
      
      // LinkedIn post-apply URL pattern
      if (url.includes("/post-apply/") || url.includes("postApply")) {
        console.log("[Employment-chan] Post-apply URL detected!", url)
        triggerCelebration(url)
        return true
      }
      return false
    }
    
    // Check immediately on load
    checkForPostApplyUrl()
    
    // Watch for URL changes (LinkedIn is a SPA)
    let lastUrl = location.href
    
    const checkUrlChange = () => {
      const currentUrl = location.href
      if (currentUrl !== lastUrl) {
        console.log("[Employment-chan] URL changed:", currentUrl)
        lastUrl = currentUrl
        checkForPostApplyUrl()
      }
    }
    
    // Use multiple methods to detect URL changes
    // 1. MutationObserver for DOM changes that might indicate navigation
    const observer = new MutationObserver(() => {
      checkUrlChange()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // 2. Polling as backup (some SPA navigations might be missed)
    const pollInterval = setInterval(checkUrlChange, 500)
    
    // 3. Listen for popstate (back/forward navigation)
    window.addEventListener("popstate", checkUrlChange)
    
    // 4. Override history methods to catch programmatic navigation
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args)
      setTimeout(checkUrlChange, 0)
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args)
      setTimeout(checkUrlChange, 0)
    }

    return () => {
      observer.disconnect()
      clearInterval(pollInterval)
      window.removeEventListener("popstate", checkUrlChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [triggerCelebration])

  return (
    <CelebrationOverlay
      show={showCelebration}
      onClose={() => setShowCelebration(false)}
      applicationCount={applicationCount}
      message={celebrationMessage}
      jobTitle={jobTitle}
      company={company}
    />
  )
}

export default LinkedInWatcher

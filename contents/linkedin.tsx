import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useState } from "react"

import waifuImage from "data-base64:~assets/waifu.jpeg"

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

// Play celebration sound
const playCelebrationSound = () => {
  // Create a simple celebration jingle using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  
  const playNote = (frequency: number, startTime: number, duration: number) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = "sine"
    
    gainNode.gain.setValueAtTime(0.3, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
    
    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }
  
  // Play a cheerful ascending melody
  const now = audioContext.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
  notes.forEach((note, i) => {
    playNote(note, now + i * 0.15, 0.3)
  })
  
  // Final chord
  setTimeout(() => {
    playNote(523.25, audioContext.currentTime, 0.5)
    playNote(659.25, audioContext.currentTime, 0.5)
    playNote(783.99, audioContext.currentTime, 0.5)
  }, 600)
}

// Track application count
const incrementApplicationCount = async (): Promise<number> => {
  return new Promise((resolve) => {
    // Safety check for chrome.storage
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve(1)
      return
    }
    
    chrome.storage.local.get(["applicationCount", "applications"], (result) => {
      const newCount = (result.applicationCount || 0) + 1
      const applications = result.applications || []
      
      // Add new application record
      applications.push({
        timestamp: Date.now(),
        site: "LinkedIn",
        url: window.location.href
      })
      
      chrome.storage.local.set({ 
        applicationCount: newCount,
        applications: applications 
      }, () => {
        resolve(newCount)
      })
    })
  })
}

// Celebration overlay component
const CelebrationOverlay = ({
  show,
  onClose,
  applicationCount
}: {
  show: boolean
  onClose: () => void
  applicationCount: number
}) => {
  useEffect(() => {
    if (show) {
      // Play sound
      playCelebrationSound()
      
      // Auto-close after 6 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const messages = [
    "You did it! One step closer to your dream job!",
    "Amazing work! Keep that momentum going!",
    "Another application sent! You're unstoppable!",
    "Proud of you! Every application counts!",
    "You're doing great! The right job is out there!",
    "Keep going! Your dedication will pay off!"
  ]
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]

  return (
    <div className="ec-overlay" onClick={onClose}>
      <Confetti />
      <div className="ec-container" onClick={(e) => e.stopPropagation()}>
        <div className="ec-count-badge">
          Application #{applicationCount}
        </div>
        <img src={waifuImage} alt="Congratulations!" className="ec-waifu" />
        <p className="ec-message">{randomMessage}</p>
        <button className="ec-close-btn" onClick={onClose}>
          Thanks, Employment-chan!
        </button>
      </div>
    </div>
  )
}

// Main content script component
const LinkedInWatcher = () => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [applicationCount, setApplicationCount] = useState(0)
  const [triggeredUrls, setTriggeredUrls] = useState<Set<string>>(new Set())

  const triggerCelebration = useCallback(async (url?: string) => {
    // Prevent double triggers for the same URL
    if (url && triggeredUrls.has(url)) {
      console.log("[Employment-chan] Already celebrated this application, skipping")
      return
    }
    
    if (url) {
      setTriggeredUrls(prev => new Set(prev).add(url))
    }
    
    console.log("[Employment-chan] Triggering celebration!")
    const count = await incrementApplicationCount()
    setApplicationCount(count)
    setShowCelebration(true)
  }, [triggeredUrls])

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
    />
  )
}

export default LinkedInWatcher

import { useCallback, useEffect, useRef, useState } from "react"

// Import both mouth states for talking animation
import waifuMouthClosed from "data-base64:~assets/waifu-with-mouth-closed.jpeg"
import waifuMouthOpen from "data-base64:~assets/waifu-with-mouth-opened.jpeg"

// Dialogue context type
export interface DialogueContext {
  jobTitle?: string
  company?: string
  todayCount: number
  totalCount: number
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
export const playCelebrationSound = () => {
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

// Confetti particle component
export const Confetti = () => {
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

// Typewriter text component with talking animation
export const TypewriterText = ({
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
export const TalkingWaifu = ({ isTalking }: { isTalking: boolean }) => {
  const [frameIndex, setFrameIndex] = useState(0)
  
  useEffect(() => {
    if (!isTalking) {
      setFrameIndex(0) // Mouth closed when not talking
      return
    }
    
    // Use setInterval for reliable timing
    const intervalId = setInterval(() => {
      setFrameIndex(prev => prev === 0 ? 1 : 0)
    }, 120)
    
    return () => {
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

// Continue dialogue with backend
const continueDialogue = async (
  userChoice: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context: DialogueContext,
  isFinal: boolean = false
): Promise<{ message: string; choices: string[]; isFinal: boolean }> => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "CONTINUE_DIALOGUE",
      userChoice,
      conversationHistory,
      context,
      isFinal
    })
    
    if (response?.success) {
      return {
        message: response.message,
        choices: response.choices || [],
        isFinal: response.isFinal || false
      }
    }
  } catch (error) {
    console.error("[Employment-chan] Error continuing dialogue:", error)
  }
  
  // Fallback response
  return {
    message: "Ganbare! Keep applying, ne~! I believe in you! ♡",
    choices: [],
    isFinal: true
  }
}

// Props for CelebrationOverlay
export interface CelebrationOverlayProps {
  show: boolean
  onClose: () => void
  applicationCount: number
  initialMessage: string
  initialChoices?: string[]
  context?: DialogueContext
  jobTitle?: string
  company?: string
  interactive?: boolean // Whether to show dialogue choices
}

// Main Celebration Overlay Component
export const CelebrationOverlay = ({
  show,
  onClose,
  applicationCount,
  initialMessage,
  initialChoices = [],
  context,
  jobTitle,
  company,
  interactive = true
}: CelebrationOverlayProps) => {
  const [currentMessage, setCurrentMessage] = useState(initialMessage)
  const [currentChoices, setCurrentChoices] = useState<string[]>(initialChoices)
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([])
  const [dialogueRound, setDialogueRound] = useState(0)
  const [isFinalMessage, setIsFinalMessage] = useState(!interactive)
  
  // Reset state when overlay shows
  useEffect(() => {
    if (show) {
      playCelebrationSound()
      setCurrentMessage(initialMessage)
      setCurrentChoices(initialChoices)
      setIsTypingComplete(false)
      setIsLoadingResponse(false)
      setConversationHistory([{ role: "assistant", content: initialMessage }])
      setDialogueRound(0)
      setIsFinalMessage(!interactive)
    }
  }, [show, initialMessage, initialChoices, interactive])
  
  const handleTypingStateChange = useCallback((typing: boolean) => {
    if (!typing) {
      setIsTypingComplete(true)
    }
  }, [])
  
  const handleChoiceSelect = async (choice: string) => {
    if (isLoadingResponse || !isTypingComplete || !interactive) return
    
    setIsLoadingResponse(true)
    setIsTypingComplete(false)
    
    // Add user's choice to history
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: choice }
    ]
    setConversationHistory(newHistory)
    
    // Check if this should be the final round (after 2-3 exchanges)
    const shouldBeFinal = dialogueRound >= 2
    
    // Get response from Employment-chan
    const response = await continueDialogue(
      choice, 
      newHistory, 
      context || { todayCount: 1, totalCount: applicationCount },
      shouldBeFinal
    )
    
    // Update state with new message
    setCurrentMessage(response.message)
    setCurrentChoices(response.choices)
    setIsFinalMessage(response.isFinal || response.choices.length === 0)
    setDialogueRound(prev => prev + 1)
    
    // Add Employment-chan's response to history
    setConversationHistory([
      ...newHistory,
      { role: "assistant", content: response.message }
    ])
    
    setIsLoadingResponse(false)
  }
  
  const handleClose = () => {
    onClose()
  }
  
  // isTalking is true when typing is in progress
  const isTalking = show && !isTypingComplete && !isLoadingResponse

  if (!show) return null

  return (
    <div className="ec-overlay">
      <Confetti />
      <div className="ec-container" onClick={(e) => e.stopPropagation()}>
        <div className="ec-count-badge">
          Application #{applicationCount}
        </div>
        {(jobTitle || company) && dialogueRound === 0 && (
          <div className="ec-job-info">
            {jobTitle && <span className="ec-job-title">{jobTitle}</span>}
            {jobTitle && company && <span className="ec-job-separator">at</span>}
            {company && <span className="ec-job-company">{company}</span>}
          </div>
        )}
        <TalkingWaifu isTalking={isTalking} />
        <div className="ec-speech-bubble">
          <p className="ec-message">
            {isLoadingResponse ? (
              <span className="ec-loading">...</span>
            ) : (
              <TypewriterText 
                text={currentMessage} 
                onTypingStateChange={handleTypingStateChange}
                speed={30}
              />
            )}
          </p>
        </div>
        
        {/* Dialogue Choices - only show if interactive */}
        {interactive && isTypingComplete && !isLoadingResponse && currentChoices.length > 0 && !isFinalMessage && (
          <div className="ec-choices">
            {currentChoices.map((choice, index) => (
              <button
                key={index}
                className="ec-choice-btn"
                onClick={() => handleChoiceSelect(choice)}
              >
                {choice}
              </button>
            ))}
            {/* Always show exit option */}
            <button
              className="ec-choice-btn ec-choice-exit"
              onClick={handleClose}
            >
              Time to apply to more jobs! 💼
            </button>
          </div>
        )}
        
        {/* Close button - show when conversation is done or not interactive */}
        {isTypingComplete && !isLoadingResponse && (isFinalMessage || currentChoices.length === 0) && (
          <button 
            className="ec-choice-btn ec-choice-exit"
            onClick={handleClose}
          >
            Thanks, Employment-chan! ♡
          </button>
        )}
        
      </div>
    </div>
  )
}

export default CelebrationOverlay

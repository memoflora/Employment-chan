export {}

// Types for messages
interface DialogueContext {
  jobTitle?: string
  company?: string
  todayCount: number
  totalCount: number
  crazinessLevel?: number
}

interface GenerateDialogueRequest {
  type: "GENERATE_DIALOGUE"
  jobTitle?: string
  company?: string
  todayCount: number
  totalCount: number
  crazinessLevel?: number
}

interface ContinueDialogueRequest {
  type: "CONTINUE_DIALOGUE"
  userChoice: string
  conversationHistory: Array<{ role: string; content: string }>
  context: DialogueContext
  isFinal?: boolean
}

interface DialogueResponse {
  success: boolean
  message: string
  choices: string[]
  context?: DialogueContext
  isFinal?: boolean
  error?: string
}

type MessageRequest = GenerateDialogueRequest | ContinueDialogueRequest

// Flask backend URL
const BACKEND_URL = process.env.PLASMO_PUBLIC_BACKEND_URL || "http://localhost:5000"

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    _sender,
    sendResponse: (response: DialogueResponse) => void
  ) => {
    if (request.type === "GENERATE_DIALOGUE") {
      generateDialogue(request)
        .then((response) => sendResponse(response))
        .catch((error) => {
          console.error("[Employment-chan] Error generating dialogue:", error)
          sendResponse({
            success: false,
            message: getFallbackMessage(request.totalCount),
            choices: getFallbackChoices(),
            error: error.message
          })
        })
      return true
    }
    
    if (request.type === "CONTINUE_DIALOGUE") {
      continueDialogue(request)
        .then((response) => sendResponse(response))
        .catch((error) => {
          console.error("[Employment-chan] Error continuing dialogue:", error)
          sendResponse({
            success: false,
            message: "Gomen ne~! Something went wrong, but I still believe in you! ♡",
            choices: [],
            isFinal: true,
            error: error.message
          })
        })
      return true
    }
  }
)

// Generate initial dialogue with choices
async function generateDialogue(
  request: GenerateDialogueRequest
): Promise<DialogueResponse> {
  const { jobTitle, company, todayCount, totalCount, crazinessLevel } = request

  try {
    console.log("[Employment-chan] Calling Flask backend for dialogue")
    const response = await fetch(`${BACKEND_URL}/api/generate-dialogue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle, company, todayCount, totalCount, crazinessLevel: crazinessLevel || 2 })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        console.log("[Employment-chan] Got dialogue from Flask backend")
        return {
          success: true,
          message: data.message,
          choices: data.choices || [],
          context: data.context
        }
      }
    }
    
    throw new Error(`Backend error: ${response.status}`)
  } catch (error) {
    console.log("[Employment-chan] Flask backend error:", error)
    return {
      success: false,
      message: getFallbackMessage(totalCount),
      choices: getFallbackChoices(),
      context: { jobTitle, company, todayCount, totalCount }
    }
  }
}

// Continue dialogue based on user's choice
async function continueDialogue(
  request: ContinueDialogueRequest
): Promise<DialogueResponse> {
  const { userChoice, conversationHistory, context, isFinal } = request

  try {
    console.log("[Employment-chan] Continuing dialogue with choice:", userChoice)
    const response = await fetch(`${BACKEND_URL}/api/continue-dialogue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userChoice, conversationHistory, context, isFinal })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        message: data.message,
        choices: data.choices || [],
        isFinal: data.isFinal || false
      }
    }
    
    throw new Error(`Backend error: ${response.status}`)
  } catch (error) {
    console.log("[Employment-chan] Flask backend error:", error)
    return {
      success: false,
      message: "Aww, something went wrong~ But don't worry, I'm still cheering for you! ♡",
      choices: [],
      isFinal: true
    }
  }
}

// Fallback messages when backend is not available
function getFallbackMessage(totalCount: number): string {
  const messages = [
    "Yatta~! You did it! One step closer to your dream job, ne~ (๑>◡<๑)",
    "Sugoi! Keep that momentum going~! Ganbare! ♡",
    "Another application sent! You're unstoppable~ ٩(◕‿◕｡)۶",
    "I'm so proud of you! Every application counts, ne~! ☆",
    "You're doing amazing! The right job is out there waiting for you~!",
    "Fighto! Your dedication will definitely pay off! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧"
  ]

  // Milestone messages
  if (totalCount === 1) {
    return "Your first application! Sugoi~! This is just the beginning of something great, ne~ (๑>◡<๑) ♡"
  } else if (totalCount === 10) {
    return "Yatta~! 10 applications! You're building such amazing momentum! Ganbare! ٩(◕‿◕｡)۶"
  } else if (totalCount === 25) {
    return "25 applications?! Sugoi sugoi~! Your persistence is truly inspiring! ☆"
  } else if (totalCount === 50) {
    return "50 applications! You're like a job hunting hero~! I'm so proud of you! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧"
  } else if (totalCount === 100) {
    return "100 APPLICATIONS?! SUGOI~! You're absolutely legendary! I believe in you so much! ♡♡♡"
  }

  return messages[Math.floor(Math.random() * messages.length)]
}

// Fallback choices
function getFallbackChoices(): string[] {
  return [
    "Thank you, Employment-chan! ♡",
    "I'm feeling a bit nervous about this one...",
    "Let's keep the momentum going!"
  ]
}

export {}

// Types for messages
interface GenerateMessageRequest {
  type: "GENERATE_CELEBRATION_MESSAGE"
  jobTitle?: string
  company?: string
  todayCount: number
  totalCount: number
}

interface GenerateMessageResponse {
  success: boolean
  message: string
  error?: string
}

// Flask backend URL
const BACKEND_URL = process.env.PLASMO_PUBLIC_BACKEND_URL || "http://localhost:5000"

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(
  (
    request: GenerateMessageRequest,
    _sender,
    sendResponse: (response: GenerateMessageResponse) => void
  ) => {
    if (request.type === "GENERATE_CELEBRATION_MESSAGE") {
      generateCelebrationMessage(request)
        .then((message) => {
          sendResponse({ success: true, message })
        })
        .catch((error) => {
          console.error("[Employment-chan] Error generating message:", error)
          sendResponse({
            success: false,
            message: getFallbackMessage(request.totalCount),
            error: error.message
          })
        })
      // Return true to indicate we'll respond asynchronously
      return true
    }
  }
)

// Generate celebration message via Flask backend
async function generateCelebrationMessage(
  request: GenerateMessageRequest
): Promise<string> {
  const { jobTitle, company, todayCount, totalCount } = request

  try {
    console.log("[Employment-chan] Calling Flask backend at:", BACKEND_URL)
    const response = await fetch(`${BACKEND_URL}/api/generate-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle, company, todayCount, totalCount })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.message) {
        console.log("[Employment-chan] Got AI message from Flask backend")
        return data.message
      }
    }
    
    throw new Error(`Backend error: ${response.status}`)
  } catch (error) {
    console.log("[Employment-chan] Flask backend error:", error)
    return getFallbackMessage(totalCount)
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

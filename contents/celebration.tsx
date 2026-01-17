import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { CelebrationOverlay } from "~components/CelebrationOverlay"
import type { DialogueContext } from "~components/CelebrationOverlay"

// Run on all pages so popup can trigger celebration anywhere
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

interface CelebrationData {
  count: number
  message: string
  choices: string[]
  jobTitle?: string
  company?: string
}

// Generic celebration component that listens for messages from popup
const CelebrationListener = () => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null)

  useEffect(() => {
    // Listen for messages from popup to show celebration
    const handleMessage = (
      message: { type: string; data: CelebrationData },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: { success: boolean }) => void
    ) => {
      if (message.type === "SHOW_CELEBRATION" && message.data) {
        console.log("[Employment-chan] Received celebration trigger from popup")
        setCelebrationData(message.data)
        setShowCelebration(true)
        sendResponse({ success: true })
      }
      return true // Keep message channel open for async response
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  if (!showCelebration || !celebrationData) return null

  const context: DialogueContext = {
    jobTitle: celebrationData.jobTitle,
    company: celebrationData.company,
    todayCount: 1,
    totalCount: celebrationData.count
  }

  return (
    <CelebrationOverlay
      show={showCelebration}
      onClose={() => {
        setShowCelebration(false)
        setCelebrationData(null)
      }}
      applicationCount={celebrationData.count}
      initialMessage={celebrationData.message}
      initialChoices={celebrationData.choices}
      context={context}
      jobTitle={celebrationData.jobTitle}
      company={celebrationData.company}
      interactive={true}
    />
  )
}

export default CelebrationListener

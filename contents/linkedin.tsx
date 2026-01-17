import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useState } from "react"

import { CelebrationOverlay } from "~components/CelebrationOverlay"
import type { DialogueContext } from "~components/CelebrationOverlay"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
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

// Track application count and get initial dialogue with choices
const incrementApplicationCount = async (): Promise<{
  count: number
  message: string
  choices: string[]
  context: DialogueContext
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
        message: "Yatta~! You did it! One step closer to your dream job, ne~ ♡",
        choices: ["Thank you, Employment-chan!", "I'm feeling nervous..."],
        context: { jobTitle, company, todayCount: 1, totalCount: 1 },
        jobTitle,
        company
      })
      return
    }
    
    chrome.storage.local.get(["applicationCount", "applications", "crazinessLevel"], async (result) => {
      const newCount = (result.applicationCount || 0) + 1
      const applications = result.applications || []
      const crazinessLevel = result.crazinessLevel || 2
      
      // Add this application to the list
      const newApplication = {
        timestamp: Date.now(),
        site: "linkedin.com",
        url: window.location.href,
        jobTitle,
        company
      }
      applications.push(newApplication)
      
      // Calculate today's count
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const todayCount = applications.filter(
        (app: { timestamp: number }) => app.timestamp > oneDayAgo
      ).length
      
      // Save to storage
      chrome.storage.local.set({
        applicationCount: newCount,
        applications: applications
      })
      
      // Prepare context for dialogue
      let context: DialogueContext = {
        jobTitle,
        company,
        todayCount,
        totalCount: newCount,
        crazinessLevel
      }
      
      // Get personalized message from backend via background script
      let message = "Yatta~! You did it! One step closer to your dream job, ne~ ♡"
      let choices = ["Thank you, Employment-chan!", "I'm feeling nervous..."]
      
      try {
        if (chrome.runtime?.sendMessage) {
          const response = await chrome.runtime.sendMessage({
            type: "GENERATE_DIALOGUE",
            jobTitle,
            company,
            todayCount,
            totalCount: newCount,
            crazinessLevel
          })
          
          if (response?.message) {
            message = response.message
          }
          if (response?.choices?.length > 0) {
            choices = response.choices
          }
          if (response?.context) {
            context = response.context
          }
        }
      } catch (error) {
        console.error("[Employment-chan] Error getting dialogue:", error)
      }
      
      resolve({ count: newCount, message, choices, context, jobTitle, company })
    })
  })
}

// Main content script component
const LinkedInWatcher = () => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [applicationCount, setApplicationCount] = useState(0)
  const [celebrationMessage, setCelebrationMessage] = useState("")
  const [celebrationChoices, setCelebrationChoices] = useState<string[]>([])
  const [dialogueContext, setDialogueContext] = useState<DialogueContext>({ todayCount: 0, totalCount: 0 })
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
      setCelebrationChoices(result.choices)
      setDialogueContext(result.context)
      setJobTitle(result.jobTitle)
      setCompany(result.company)
      setShowCelebration(true)
    } catch (error) {
      console.error("[Employment-chan] Error:", error)
      setCelebrationMessage("Yatta~! You did it! One step closer to your dream job! ♡")
      setCelebrationChoices(["Thank you!", "I'm nervous...", "Let's keep going!"])
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
      initialMessage={celebrationMessage}
      initialChoices={celebrationChoices}
      context={dialogueContext}
      jobTitle={jobTitle}
      company={company}
      interactive={true}
    />
  )
}

export default LinkedInWatcher

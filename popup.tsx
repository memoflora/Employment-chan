import { useEffect, useState } from "react"

import waifuImage from "data-base64:~assets/waifu.jpeg"

interface ApplicationRecord {
  timestamp: number
  site: string
  url: string
  jobTitle?: string
  company?: string
}

// Helper to trigger celebration on current tab
const triggerCelebrationOnCurrentTab = async (data: {
  count: number
  message: string
  choices: string[]
  jobTitle?: string
  company?: string
}) => {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      // Send message to the content script on that tab
      await chrome.tabs.sendMessage(tab.id, {
        type: "SHOW_CELEBRATION",
        data
      })
      console.log("[Employment-chan] Celebration triggered on current tab")
    }
  } catch (error) {
    console.error("[Employment-chan] Error triggering celebration:", error)
  }
}

function IndexPopup() {
  const [applicationCount, setApplicationCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [weekCount, setWeekCount] = useState(0)
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualCompany, setManualCompany] = useState("")
  const [manualPosition, setManualPosition] = useState("")
  const [activeTab, setActiveTab] = useState<"stats" | "tracker">("stats")

  const loadApplications = () => {
    // Load stats from storage (with safety check)
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["applicationCount", "applications"], (result) => {
        setApplicationCount(result.applicationCount || 0)

        const apps: ApplicationRecord[] = result.applications || []
        setApplications(apps)
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

        const today = apps.filter((app) => app.timestamp > oneDayAgo).length
        const week = apps.filter((app) => app.timestamp > oneWeekAgo).length

        setTodayCount(today)
        setWeekCount(week)
      })
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const getMotivationalMessage = () => {
    if (applicationCount === 0) {
      return "Ready to start your job hunt? I'll be here to cheer you on!"
    } else if (applicationCount < 5) {
      return "Great start! Keep the momentum going!"
    } else if (applicationCount < 20) {
      return "You're doing amazing! Every application counts!"
    } else if (applicationCount < 50) {
      return "Wow, you're unstoppable! Your dream job is getting closer!"
    } else {
      return "You're a job hunting legend! I'm so proud of you!"
    }
  }

  const getAIDialogue = async (
    todayCount: number, 
    totalCount: number, 
    jobTitle?: string, 
    company?: string
  ): Promise<{ message: string; choices: string[] }> => {
    const BACKEND_URL = process.env.PLASMO_PUBLIC_BACKEND_URL || "http://localhost:5000"
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-dialogue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, todayCount, totalCount })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.message) {
          return {
            message: data.message,
            choices: data.choices || ["Thank you!", "I'm nervous...", "Let's keep going!"]
          }
        }
      }
    } catch (error) {
      console.error("[Employment-chan] Error getting AI dialogue:", error)
    }
    
    // Fallback messages
    const messages = [
      "Yatta~! You did it! One step closer to your dream job, ne~ (๑>◡<๑)",
      "Sugoi! Keep that momentum going~! Ganbare! ♡",
      "Another application sent! You're unstoppable~ ٩(◕‿◕｡)۶",
      "I'm so proud of you! Every application counts, ne~! ☆",
      "You're doing amazing! The right job is out there waiting for you~!",
      "Fighto! Your dedication will definitely pay off! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧"
    ]
    
    const fallbackChoices = ["Thank you, Employment-chan!", "I'm so nervous...", "Let's keep going!"]
    
    let message: string
    if (totalCount === 1) {
      message = "Your first application! Sugoi~! This is just the beginning of something great, ne~ (๑>◡<๑) ♡"
    } else if (totalCount === 10) {
      message = "Yatta~! 10 applications! You're building such amazing momentum! Ganbare! ٩(◕‿◕｡)۶"
    } else if (totalCount === 25) {
      message = "25 applications?! Sugoi sugoi~! Your persistence is truly inspiring! ☆"
    } else if (totalCount === 50) {
      message = "50 applications! You're like a job hunting hero~! I'm so proud of you! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧"
    } else if (totalCount === 100) {
      message = "100 APPLICATIONS?! SUGOI~! You're absolutely legendary! I believe in you so much! ♡♡♡"
    } else {
      message = messages[Math.floor(Math.random() * messages.length)]
    }
    
    return { message, choices: fallbackChoices }
  }

  const handleManualAdd = async () => {
    if (!manualCompany.trim() || !manualPosition.trim()) {
      return
    }

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["applicationCount", "applications"], async (result) => {
        const newCount = (result.applicationCount || 0) + 1
        const apps: ApplicationRecord[] = result.applications || []

        const newApp: ApplicationRecord = {
          timestamp: Date.now(),
          site: "Manual",
          url: "",
          company: manualCompany.trim(),
          jobTitle: manualPosition.trim()
        }

        apps.push(newApp)

        // Get today's count
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        const todayCount = apps.filter((app) => app.timestamp > oneDayAgo).length

        // Get AI dialogue (message + choices)
        const dialogue = await getAIDialogue(
          todayCount,
          newCount,
          manualPosition.trim(),
          manualCompany.trim()
        )

        chrome.storage.local.set(
          {
            applicationCount: newCount,
            applications: apps
          },
          () => {
            setManualCompany("")
            setManualPosition("")
            setShowManualForm(false)
            loadApplications()
            
            // Trigger celebration on current tab
            triggerCelebrationOnCurrentTab({
              count: newCount,
              message: dialogue.message,
              choices: dialogue.choices,
              jobTitle: manualPosition.trim(),
              company: manualCompany.trim()
            })
          }
        )
      })
    }
  }

  const handleDelete = (index: number) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const sortedApps = [...applications].sort((a, b) => b.timestamp - a.timestamp)
      const appToDelete = sortedApps[index]
      
      chrome.storage.local.get(["applicationCount", "applications"], (result) => {
        const apps: ApplicationRecord[] = result.applications || []
        const filteredApps = apps.filter((app) => {
          // Match by timestamp and company/jobTitle to ensure we delete the right one
          return !(
            app.timestamp === appToDelete.timestamp &&
            app.company === appToDelete.company &&
            app.jobTitle === appToDelete.jobTitle
          )
        })
        
        const newCount = Math.max(0, (result.applicationCount || 0) - 1)
        
        chrome.storage.local.set(
          {
            applicationCount: newCount,
            applications: filteredApps
          },
          () => {
            loadApplications()
          }
        )
      })
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const sortedApplications = [...applications].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div
      style={{
        width: 400,
        maxHeight: 600,
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src={waifuImage}
          alt="Employment-chan"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            objectFit: "cover",
            objectPosition: "top",
            border: "3px solid #ffd700",
            boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)"
          }}
        />
      </div>
      <h1
        style={{
          fontSize: 20,
          margin: "0 0 16px 0",
          textAlign: "center",
          background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700
        }}>
        Employment-chan
      </h1>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
        <button
          onClick={() => setActiveTab("stats")}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: activeTab === "stats" ? "rgba(168, 85, 247, 0.3)" : "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "8px 8px 0 0",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.2s"
          }}>
          Stats
        </button>
        <button
          onClick={() => setActiveTab("tracker")}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: activeTab === "tracker" ? "rgba(168, 85, 247, 0.3)" : "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "8px 8px 0 0",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.2s"
          }}>
          Job Tracker
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {activeTab === "stats" && (
          <>
            {/* Stats Section */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2))",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                border: "1px solid rgba(168, 85, 247, 0.3)"
              }}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 12
                }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #ffd700, #ff8e53)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}>
                  {applicationCount}
                </div>
                <div style={{ fontSize: 12, color: "#aaa" }}>Total Applications</div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  paddingTop: 12
                }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "#4ecdc4" }}>{todayCount}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Today</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "#a855f7" }}>{weekCount}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>This Week</div>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <p
              style={{
                fontSize: 12,
                color: "#ccc",
                textAlign: "center",
                margin: "0 0 16px 0",
                lineHeight: 1.5,
                fontStyle: "italic"
              }}>
              "{getMotivationalMessage()}"
            </p>

            {/* Supported Sites */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: 12
              }}>
              <h3
                style={{
                  fontSize: 12,
                  margin: "0 0 8px 0",
                  color: "#ffd700"
                }}>
                Supported Sites
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#4CAF50",
                    display: "inline-block"
                  }}
                />
                <span style={{ fontSize: 12 }}>LinkedIn</span>
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: "#666",
                  margin: "8px 0 0 0",
                  fontStyle: "italic"
                }}>
                More sites coming soon...
              </p>
            </div>
          </>
        )}

        {activeTab === "tracker" && (
          <>
            {/* Add Manual Entry Button */}
            <button
              onClick={() => setShowManualForm(true)}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 16,
                boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)"
              }}>
              + Add Manual Entry
            </button>

            {/* Manual Entry Form Modal */}
            {showManualForm && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0, 0, 0, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  padding: 20
                }}
                onClick={() => setShowManualForm(false)}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                    borderRadius: 16,
                    padding: 24,
                    width: "100%",
                    maxWidth: 320,
                    border: "2px solid #ffd700",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)"
                  }}
                  onClick={(e) => e.stopPropagation()}>
                  <h3
                    style={{
                      fontSize: 18,
                      margin: "0 0 16px 0",
                      color: "#ffd700",
                      textAlign: "center"
                    }}>
                    Add Application
                  </h3>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "#aaa",
                        marginBottom: 6
                      }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={manualCompany}
                      onChange={(e) => setManualCompany(e.target.value)}
                      placeholder="e.g., Google"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#fff",
                        fontSize: 14,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "#aaa",
                        marginBottom: 6
                      }}>
                      Position *
                    </label>
                    <input
                      type="text"
                      value={manualPosition}
                      onChange={(e) => setManualPosition(e.target.value)}
                      placeholder="e.g., Software Engineer"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#fff",
                        fontSize: 14,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        setShowManualForm(false)
                        setManualCompany("")
                        setManualPosition("")
                      }}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleManualAdd}
                      disabled={!manualCompany.trim() || !manualPosition.trim()}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background:
                          manualCompany.trim() && manualPosition.trim()
                            ? "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)"
                            : "rgba(255, 255, 255, 0.2)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: manualCompany.trim() && manualPosition.trim() ? "pointer" : "not-allowed",
                        fontSize: 14,
                        fontWeight: 600,
                        opacity: manualCompany.trim() && manualPosition.trim() ? 1 : 0.5
                      }}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Job Tracker List */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  margin: "0 0 12px 0",
                  color: "#ffd700"
                }}>
                Your Applications ({sortedApplications.length})
              </h3>
              {sortedApplications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    color: "#888",
                    fontSize: 12
                  }}>
                  No applications yet. Start applying or add one manually!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sortedApplications.map((app, index) => (
                    <div
                      key={index}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 10,
                        padding: 12,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        transition: "all 0.2s",
                        position: "relative"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"
                        e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
                      }}>
                      <button
                        onClick={() => handleDelete(index)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "rgba(255, 107, 107, 0.2)",
                          border: "1px solid rgba(255, 107, 107, 0.5)",
                          borderRadius: 6,
                          width: 24,
                          height: 24,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#ff6b6b",
                          fontSize: 14,
                          fontWeight: 600,
                          padding: 0,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 107, 107, 0.4)"
                          e.currentTarget.style.transform = "scale(1.1)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 107, 107, 0.2)"
                          e.currentTarget.style.transform = "scale(1)"
                        }}
                        title="Delete application">
                        ×
                      </button>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                          paddingRight: 32
                        }}>
                        <div style={{ flex: 1 }}>
                          {app.company && (
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#a855f7",
                                marginBottom: 4
                              }}>
                              {app.company}
                            </div>
                          )}
                          {app.jobTitle && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#4ecdc4",
                                marginBottom: 4
                              }}>
                              {app.jobTitle}
                            </div>
                          )}
                          {!app.company && !app.jobTitle && (
                            <div style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>
                              No details available
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 10,
                          color: "#666"
                        }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            background: app.site === "Manual" ? "rgba(255, 215, 0, 0.2)" : "rgba(76, 175, 80, 0.2)",
                            borderRadius: 4,
                            color: app.site === "Manual" ? "#ffd700" : "#4CAF50"
                          }}>
                          {app.site}
                        </span>
                        <span>{formatDate(app.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default IndexPopup

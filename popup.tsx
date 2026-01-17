import { useEffect, useState } from "react"

import waifuImage from "data-base64:~assets/waifu.jpeg"

interface ApplicationRecord {
  timestamp: number
  site: string
  url: string
}

function IndexPopup() {
  const [applicationCount, setApplicationCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [weekCount, setWeekCount] = useState(0)

  useEffect(() => {
    // Load stats from storage (with safety check)
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["applicationCount", "applications"], (result) => {
        setApplicationCount(result.applicationCount || 0)

        const applications: ApplicationRecord[] = result.applications || []
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

        const today = applications.filter((app) => app.timestamp > oneDayAgo).length
        const week = applications.filter((app) => app.timestamp > oneWeekAgo).length

        setTodayCount(today)
        setWeekCount(week)
      })
    }
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

  return (
    <div
      style={{
        width: 320,
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        color: "#fff"
      }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src={waifuImage}
          alt="Employment-chan"
          style={{
            width: 100,
            height: 100,
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
          margin: "0 0 8px 0",
          textAlign: "center",
          background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700
        }}>
        Employment-chan
      </h1>

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
    </div>
  )
}

export default IndexPopup

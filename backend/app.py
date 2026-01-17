"""
Employment-chan Backend Server
Handles OpenAI API calls securely (API key stays on server)
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow requests from browser extension

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


@app.route("/api/generate-message", methods=["POST"])
def generate_message():
    """Generate a celebration message using OpenAI"""
    try:
        data = request.json
        job_title = data.get("jobTitle", "")
        company = data.get("company", "")
        today_count = data.get("todayCount", 1)
        total_count = data.get("totalCount", 1)

        # Build context for the AI
        if job_title and company:
            job_context = f'The user just applied for a "{job_title}" position at "{company}".'
        elif job_title:
            job_context = f'The user just applied for a "{job_title}" position.'
        elif company:
            job_context = f'The user just applied for a job at "{company}".'
        else:
            job_context = "The user just submitted a job application."

        stats_context = f"This is their application #{total_count} total, and #{today_count} today."

        prompt = f"""You are Employment-chan, a cheerful and supportive anime girl character who celebrates job applications.
{job_context}
{stats_context}

Generate a short, encouraging celebration message (1-2 sentences max) in the style of a cute Japanese anime girl:

STYLE GUIDELINES:
- Speak in a cute, energetic anime girl way
- Mix in occasional Japanese expressions naturally like: "Sugoi!", "Yatta!", "Ganbare!", "Kawaii!", "Ne~", "Fighto!", "Ganbatte ne!"
- Can use cute sentence endings like "~!" or "ne~"
- Be enthusiastic and bubbly but genuine
- You can use 1-2 kaomoji like (๑>◡<๑), ٩(◕‿◕｡)۶, (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧, ♡, ~☆
- If they've applied to many jobs today (5+), praise their ganbari (effort)!
- If it's a specific company/role, you can mention it excitedly
- Keep the core message encouraging and supportive

EXAMPLES of the tone:
- "Yatta~! You actually did it! One step closer to your dream job, ne~ (๑>◡<๑)"
- "Sugoi! Application #10 already?! Your dedication is so inspiring~ ♡"
- "Ganbare! I believe in you! That role at Google sounds perfect for you~!"

Just respond with the message, nothing else."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.8,
        )

        message = response.choices[0].message.content.strip()

        return jsonify({"success": True, "message": message})

    except Exception as e:
        print(f"Error generating message: {e}")
        return jsonify(
            {
                "success": False,
                "message": get_fallback_message(total_count),
                "error": str(e),
            }
        )


def get_fallback_message(total_count: int) -> str:
    """Return a fallback message when API fails"""
    import random

    messages = [
        "Yatta~! You did it! One step closer to your dream job, ne~ (๑>◡<๑)",
        "Sugoi! Keep that momentum going~! Ganbare! ♡",
        "Another application sent! You're unstoppable~ ٩(◕‿◕｡)۶",
        "I'm so proud of you! Every application counts, ne~! ☆",
        "You're doing amazing! The right job is out there waiting for you~!",
        "Fighto! Your dedication will definitely pay off! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧",
    ]

    # Milestone messages
    if total_count == 1:
        return "Your first application! Sugoi~! This is just the beginning of something great, ne~ (๑>◡<๑) ♡"
    elif total_count == 10:
        return "Yatta~! 10 applications! You're building such amazing momentum! Ganbare! ٩(◕‿◕｡)۶"
    elif total_count == 25:
        return "25 applications?! Sugoi sugoi~! Your persistence is truly inspiring! ☆"
    elif total_count == 50:
        return "50 applications! You're like a job hunting hero~! I'm so proud of you! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧"
    elif total_count == 100:
        return "100 APPLICATIONS?! SUGOI~! You're absolutely legendary! I believe in you so much! ♡♡♡"

    return random.choice(messages)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)

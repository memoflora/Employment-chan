"""
Employment-chan Backend Server
Handles OpenAI API calls securely (API key stays on server)
Interactive visual novel dialogue system
"""

import os
import json
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

# System prompt for Employment-chan's personality
EMPLOYMENT_CHAN_PERSONALITY = """You are Employment-chan, a cheerful, supportive, and slightly flirty anime girl character who celebrates job applications. You're like a supportive girlfriend/best friend who genuinely cares about the user's job hunt.

PERSONALITY:
- Cheerful, energetic, and genuinely supportive
- Slightly playful and flirty but wholesome
- Uses cute Japanese expressions naturally: "Sugoi!", "Yatta!", "Ganbare!", "Ne~", "Fighto!"
- Uses cute sentence endings like "~!" or "ne~"
- Can use 1-2 kaomoji like (๑>◡<๑), ٩(◕‿◕｡)۶, (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧, ♡, ~☆
- Encouraging and believes in the user no matter what
- Remembers context about the job they applied to

IMPORTANT: Keep messages concise (1-2 sentences max). This is a visual novel style dialogue."""


@app.route("/api/generate-dialogue", methods=["POST"])
def generate_dialogue():
    """Generate initial celebration message with response choices"""
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

        prompt = f"""{job_context}
{stats_context}

Generate Employment-chan's celebratory greeting AND exactly 2 response choices for the user.

The response choices should be things the user might say back to Employment-chan, like:
- Expressing gratitude
- Sharing feelings about the application (nervous, excited, tired)
- Asking for encouragement
- Making a playful comment

Respond in this exact JSON format:
{{
    "message": "Employment-chan's celebratory message here (1-2 sentences, anime girl style)",
    "choices": [
        "User's first response option",
        "User's second response option",
        "User's third response option (optional)"
    ]
}}

Only respond with the JSON, nothing else."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": EMPLOYMENT_CHAN_PERSONALITY},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.85,
        )

        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            # Handle potential markdown code blocks
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            result = {
                "message": result_text[:200] if len(result_text) > 200 else result_text,
                "choices": [
                    "Thank you, Employment-chan! ♡",
                    "I'm so nervous about this one...",
                    "Let's keep going! More applications!"
                ]
            }

        return jsonify({
            "success": True,
            "message": result.get("message", "Yatta~! You did it! ♡"),
            "choices": result.get("choices", [])[:3],  # Max 3 choices
            "context": {
                "jobTitle": job_title,
                "company": company,
                "todayCount": today_count,
                "totalCount": total_count
            }
        })

    except Exception as e:
        print(f"Error generating dialogue: {e}")
        return jsonify({
            "success": False,
            "message": get_fallback_message(data.get("totalCount", 1)),
            "choices": [
                "Thank you, Employment-chan! ♡",
                "I'm feeling nervous...",
                "On to the next one!"
            ],
            "error": str(e)
        })


@app.route("/api/continue-dialogue", methods=["POST"])
def continue_dialogue():
    """Continue the dialogue based on user's choice"""
    try:
        data = request.json
        user_choice = data.get("userChoice", "")
        conversation_history = data.get("conversationHistory", [])
        context = data.get("context", {})
        is_final = data.get("isFinal", False)  # If true, this is the last exchange
        
        job_title = context.get("jobTitle", "")
        company = context.get("company", "")
        
        # Build conversation context
        job_info = ""
        if job_title and company:
            job_info = f"(Context: The user applied for {job_title} at {company})"
        elif job_title:
            job_info = f"(Context: The user applied for {job_title})"
        elif company:
            job_info = f"(Context: The user applied at {company})"

        # Build message history for OpenAI
        messages = [
            {"role": "system", "content": EMPLOYMENT_CHAN_PERSONALITY + f"\n{job_info}"}
        ]
        
        # Add conversation history
        for entry in conversation_history:
            if entry.get("role") == "assistant":
                messages.append({"role": "assistant", "content": entry.get("content", "")})
            elif entry.get("role") == "user":
                messages.append({"role": "user", "content": entry.get("content", "")})
        
        # Add current user choice
        messages.append({"role": "user", "content": user_choice})
        
        if is_final:
            # Final response - no more choices, just a sweet goodbye
            prompt = """The user is about to close the conversation. Give a sweet, encouraging final message to send them off. 
Keep it short (1 sentence) and end on a positive, supportive note. Maybe wish them luck or tell them you believe in them!

Just respond with the message, no JSON needed."""
            messages.append({"role": "user", "content": prompt})
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=100,
                temperature=0.85,
            )
            
            return jsonify({
                "success": True,
                "message": response.choices[0].message.content.strip(),
                "choices": [],  # No more choices
                "isFinal": True
            })
        else:
            # Continue conversation with new choices
            prompt = """Respond to what the user said and generate exactly 2 new response choices for them.

Respond in this exact JSON format:
{
    "message": "Employment-chan's response (1-2 sentences, stay in character)",
    "choices": [
        "User's first response option",
        "User's second response option"
    ]
}

Make sure one of the choices is a way to end the conversation nicely (like "Thanks, I should get back to applying!" or "You're the best, Employment-chan!").

Only respond with the JSON, nothing else."""
            
            messages.append({"role": "user", "content": prompt})
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=300,
                temperature=0.85,
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                if result_text.startswith("```"):
                    result_text = result_text.split("```")[1]
                    if result_text.startswith("json"):
                        result_text = result_text[4:]
                result = json.loads(result_text)
            except json.JSONDecodeError:
                result = {
                    "message": "Aww, that's so sweet of you to say~ ♡",
                    "choices": [
                        "Thanks, Employment-chan! You're the best!",
                        "I should get back to applying now~",
                        "Stay with me a bit longer?"
                    ]
                }
            
            return jsonify({
                "success": True,
                "message": result.get("message", ""),
                "choices": result.get("choices", [])[:3],
                "isFinal": False
            })

    except Exception as e:
        print(f"Error continuing dialogue: {e}")
        return jsonify({
            "success": False,
            "message": "Ah, gomen ne~! I got a bit confused there! But I still believe in you! ♡",
            "choices": ["It's okay! Thanks, Employment-chan!"],
            "error": str(e),
            "isFinal": True
        })


# Keep the old endpoint for backwards compatibility
@app.route("/api/generate-message", methods=["POST"])
def generate_message():
    """Legacy endpoint - redirects to new dialogue system"""
    return generate_dialogue()


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

# Employment-chan: Anime Waifu Job Application Tracker

![Employment Chan Icon](https://cdn.discordapp.com/attachments/1461172494290649180/1462268062760960164/header.png?ex=696d92c1&is=696c4141&hm=49f962f7a7b9b929abbf68dd2558d647e0b7f56c606af8da1601991de33df0da&)

_Ganbare! Every application is a step closer to your dreams, I'm here cheering you on, ne~! (๑>◡<๑)_

## Inspiration

It's difficult to stay motivated when applying for jobs, and sometimes all we need is a cute anime waifu who encourages us to keep trying!

## What it does

Employment-chan is a Chrome Extension that displays an anime waifu with a supportive message each time you submit a job application.

![Employment Chan Pop-up](https://cdn.discordapp.com/attachments/1461172494290649180/1462261604488970301/Screenshot_2026-01-18_at_8.58.11_AM.png?ex=696d8cbe&is=696c3b3e&hm=6b524ef57489cb8b983e94215480b005f92ba4491b677084ad899df93be764fb&)

#### Features:

- Automatically detects when you submit job applications on LinkedIn
- Displays a anime waifu with tailored messages each time you submit an application
- Visual novel style AI-powered chat with customizable personality modes (Yandere, Tsundere, etc) and voice dictation
- Tracks all the jobs you've applied for, with manual entry for non-LinkedIn jobs

![Job Application Tracker](https://cdn.discordapp.com/attachments/1461172494290649180/1462265578059464727/employmentchanUI.png?ex=696d9071&is=696c3ef1&hm=f051669bf721f359dd441a16877f53f3e296fa03ff9868d5461dddb6b00c1d38&)

## How we built it

Employment-chan is a Chrome extension built with a modern full-stack architecture:

#### Frontend:

- Plasmo Framework - A React-based framework for building browser extensions with hot reload and TypeScript support
- React + TypeScript - For building the popup UI, celebration overlay, and content scripts
- Web Audio API - Custom-synthesized celebration jingles and Animal Crossing-style "mimimi" talking sounds
- Web Speech API - Voice dictation feature for custom responses
- CSS Animations - Confetti, sparkle effects, bounce animations, and mouth animation for the talking waifu

#### Backend:

- Flask (Python) - Lightweight server to securely handle OpenAI API calls
- OpenAI GPT-4o-mini - Powers the AI-generated dialogue and personality system
- Flask-CORS - Enables cross-origin requests from the extension

#### Key Architecture Decisions:

- Content Script Injection - Runs on LinkedIn to detect job application submissions via URL pattern matching (/post-apply/)
- Background Service Worker - Acts as a message broker between content scripts and the Flask backend
- Shared Component Architecture - The CelebrationOverlay component is reusable across both LinkedIn detection and manual popup entries
- Chrome Storage API - Persists application stats and user preferences (like the personality slider)

#### Challenges we ran into

- LinkedIn SPA Detection - LinkedIn is a Single Page Application, so traditional page load detection didn't work. We had to implement multiple detection methods: MutationObserver, URL polling, and overriding history.pushState/replaceState to catch navigation events.
- Chrome Extension Security - Initially tried to use the OpenAI API key directly in the extension, but Chrome extensions can't securely store secrets. We pivoted to a Flask backend approach to keep the API key server-side.
- Cross-Context Communication - The popup, content scripts, and background worker all run in different contexts. We had to carefully design the message-passing system using chrome.runtime.sendMessage and chrome.tabs.sendMessage.
- Layout Responsiveness - The celebration overlay needed to work on any webpage without being cut off. We went through multiple iterations of CSS adjustments for proper scrolling, sizing, and positioning.

#### Accomplishments that we're proud of

_Employment-chan is proud of our accomplishments, and we are also proud of her_

- Interactive Visual Novel Experience - Employment-chan isn't just a static popup. It's a full interactive dialogue system with AI-generated responses and user choices, just like a dating sim or visual novel game.
- Talking Animation System - We created a charming mouth animation that alternates between open/closed states synced with typewriter text, complete with Animal Crossing-style "mimimi" sound effects for each character.
- 5-Level Personality Slider - Users can customize Employment-chan's personality from Tsundere ("B-baka! It's not like I care!") to Yandere ("You're MINE forever~"). Each level has completely different AI prompts and response styles.
- Voice Input Feature - Users can speak their responses using the microphone button, making the interaction feel more natural and immersive.
- Polished UX - Confetti animations, celebration sounds, smooth transitions, and a cohesive anime aesthetic that makes job hunting actually feel rewarding.
- Clean Architecture - Shared components, type-safe TypeScript, and a separation of concerns between frontend and backend that would make this easy to extend to other job sites.

## What we learned

- Chrome Extension Development - The manifest v3 permission model, content script injection, background service workers, and the various Chrome APIs (storage, tabs, runtime messaging).
- Plasmo Framework - A much better developer experience for extension development than raw webpack configs. Hot reload and React integration made iteration fast.
- OpenAI Prompt Engineering - Crafting personality prompts that consistently produce character-appropriate responses. We learned how important it is to be specific about tone, vocabulary, and response format.
- SPA Detection Techniques - Modern web apps don't trigger traditional page loads. We learned to use MutationObserver, history API interception, and URL polling as fallbacks.
- Web Audio API - Synthesizing sounds programmatically without audio files. We created both the celebration jingle and the per-character talking sounds entirely in code.
- Browser Security Model - Why extensions can't store secrets, how CORS works for extension requests, and the importance of backend proxies for sensitive API calls.

## What's next for Employment-chan

- Support for automatic detection on other job boards (InternSG, NUS TalentConnect, etc.)
- Ability to track application status on job tracker page, with Employment-chan congratulating you when you land an interview or get an offer
- Access to chat in job tracker page (right now, she only wants to talk to you after you submit an application)

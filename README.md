# 🐘 Venda Learn (Tshivenda)

[![Vite](https://img.shields.io/badge/vite-%23FACC15.svg?style=for-the-badge&logo=vite&logoColor=black)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%231E293B.svg?style=for-the-badge&logo=react&logoColor=%23FACC15)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-%23FACC15.svg?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

**Venda Learn** is a premium, gamified language learning platform designed to make mastering Tshivenda (Venda) engaging, interactive, and culturally immersive. Featuring a friendly mascot, interactive tours, and real-time practice hubs, it's the ultimate companion for the Venda language warrior.

---

## ✨ Key Features

### 🐘 Ndou the Mascot
*Meet Ndou*, our animated baby elephant guide! Ndou isn't just a static image; he has a range of **dynamic moods** (Happy, Excited, Sad) that react to your actions—celebrating your wins and encouraging you when you're away.

### 🧭 App Tour Guide
Never feel lost. Our custom **Viewport-Safe Tour Guide** greets new users with a step-by-step walkthrough. It automatically adjusts to your screen size and scrolls sidebar elements into view to ensure a seamless onboarding experience.

### � Structured Lessons & Quizzes
- **Bvelelani Phanda (Continue Learning)**: Pick up exactly where you left off with our smart lesson tracking.
- **Interactive Slides**: Lessons are broken down into digestible slides with Venda text, English translations, and cultural context.
- **Rapid-Fire Quizzes**: Test your knowledge at the end of each module with multiple-choice quizzes and instant feedback.

### 🎮 Cultural Games (Mitambo)
- **Picture-to-Word Matching**: A high-speed race against time to match Venda words with their visual representations.
- **Cultural Challenges**: Games that teach you about Venda traditions while you play.

### 🏆 Leaderboard & Progression
- **Top Learners (Leaderboard)**: Compete with the community! See how you rank against other Venda warriors based on your total LP.
- **Level System**: Advance through levels from **Mugudi** (Learner) to **Venda Master**. 
- **Learning Points (LP)**: Earn points for every successful lesson, quiz, or game win.

### � Practice Hub
Connect with **Native Speakers** in real-time.
- **Timed Sessions**: High-intensity 1-hour focus sessions.
- **Unread Tracking**: Never miss a reply with real-time notification badges.
- **Discussion Starters**: Get the conversation flowing with pre-built cultural prompts.

### 🔥 Daily Streak System
Keep the fire alive! The streak system tracks your daily consistency. Missing a day resets the fire, encouraging daily engagement with the language.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **Styling**: [Bootstrap 5](https://getbootstrap.com/) + Custom **Slate & Amber** Design System
- **Animations**: [Animate.css](https://animate.style/) + CSS Keyframes
- **Notifications**: [SweetAlert2](https://sweetalert2.github.io/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- Firebase Account

### Installation

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd imaginators
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture

- `/src/components`: UI components (Mascot, TourGuide, Sidebar, etc.)
- `/src/Pages`: Core application views (Home, PracticeHub, Profile, Lessons)
- `/src/services`: Business logic (Firebase config, `dataCache.ts` for performance, `updateStreak.ts`)
- `/src/config`: Static configuration (Tour steps, Level thresholds)

---

## 🛡️ Admin & Safety
The app includes a built-in **Admin Panel** for managing lessons and a robust **Reporting System** in the Practice Hub to ensure a safe learning community for everyone.

---

## 🎨 Design Philosophy
Venda Learn uses a **Premium Slate & Amber** palette. Every interaction is designed to feel alive, with subtle micro-animations and smooth transitions that respect user focus. **Note: No purple colors are used in the platform design.**

---
*Built with ❤️ for the Venda Community.*
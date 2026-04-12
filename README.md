# 🐘 Chommie Language Companion

[![Vite](https://img.shields.io/badge/vite-%23FACC15.svg?style=for-the-badge&logo=vite&logoColor=black)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%231E293B.svg?style=for-the-badge&logo=react&logoColor=%23FACC15)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-%23FACC15.svg?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

**Chommie Language Companion** is South Africa's #1 premium, gamified language quest. Built to make mastering our 11 official languages engaging, interactive, and culturally immersive, Chommie is for the whole crew. Whether you're learning IsiZulu, IsiXhosa, Afrikaans, or any other Mzansi tongue, Elphie the elephant guide is here to help you **Speak the Culture.**

---

## ✨ Key Features

### 🐘 Elphie the Mascot
*Meet Elphie*, our animated baby elephant guide! Elphie isn't just a static image; he's your personal language coach with **dynamic moods** (Happy, Excited, Sad) that react to your progress—celebrating your wins and encouraging you to keep the streak alive.

### 🧭 App Tour Guide
Never feel lost. Our custom **Viewport-Safe Tour Guide** greets new users with a step-by-step walkthrough. It automatically adjusts to your screen size and ensures a seamless onboarding experience.

### 📚 Quick Quests & Lessons
- **Bite-Sized Learning**: Pick up exactly where you left off with smart lesson tracking.
- **Interactive Slides**: Lessons are broken down into digestible slides with native text, English translations, and cultural context.
- **Rapid-Fire Quizzes**: Test your knowledge at the end of each module with instant feedback and XP rewards.

### 🎮 Lekker Games (Mitambo)
- **Word Bomb**: A high-speed race against time to master vocabulary.
- **Syllable Builder**: Construct words piece by piece to understand linguistic structure.
- **Picture Puzzles**: Match words with visual representations in a fun, arcade-style environment.

### 🏆 Leaderboards & Progression
- **Top Learners**: Compete with the community! Climb the ranks and see how you match up against other language warriors.
- **Level System**: Advance from a **Traveler** to a **Language Boss**.
- **XP & Trophies**: Earn XP for every successful quest and unlock unique trophies for your collection.

### 🔥 Daily Streak System
Keep the fire alive! The streak system tracks your daily consistency. Missing a day resets the fire, encouraging daily engagement with your chosen language.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication, Cloud Messaging)
- **Styling**: [Bootstrap 5](https://getbootstrap.com/) + Custom **Brutalist Slate & Amber** Design System
- **Animations**: [Framer Motion](https://www.framer.com/motion/) + CSS Keyframes
- **State Management**: [XState](https://stately.ai/docs/xstate) (for complex game logic)

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
- `/src/Pages`: Core application views (Home, Games, Profile, Lessons)
- `/src/services`: Business logic (Firebase config, `dataCache.ts` for performance, achievement handling)
- `/src/config`: Static configuration (Tour steps, Level thresholds)

---

## 🛡️ Admin & Safety
The app includes a built-in **Admin Panel** for managing lessons, languages, and games, ensuring high-quality content for the entire Mzansi community.

---

## 🎨 Design Philosophy
Chommie uses a **Premium Brutalist Slate & Amber** palette. Every interaction is designed to feel alive, with subtle micro-animations and smooth transitions that respect user focus. 

---
*Built with ❤️ for the Mzansi Community. Speak the Culture.*
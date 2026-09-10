# ClassApp 📚 🚧

> **Work in Progress (WIP)**  
> An interactive classroom mobile application connecting students and teachers through video lessons, doubts Q&A, and scheduled quizzes.

---

## ✨ Features

- **🔐 Authentication & Roles**: Email/password authentication with separate student and teacher experiences powered by Supabase.
- **📺 Video Lessons**: Stream curated educational videos with native YouTube integration and custom thumbnails.
- **💬 Doubts & Q&A**: Students can ask questions directly on video lessons, and teachers can review and answer them in real-time.
- **📝 Interactive Quizzes**: 
  - Teachers can create and schedule quizzes with open/close time windows and multiple-choice questions.
  - Quizzes transition automatically between **Upcoming**, **Live**, and **History**.
  - Students can take live quizzes and submit answers.
- **🎨 Native Experience**: Clean, modern interface designed for iOS and Android with unified theme tokens and smooth interactions.

---

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev) (SDK 57) + [React Native](https://reactnative.dev)
- **Backend & Database**: [Supabase](https://supabase.com) (Auth, PostgreSQL database, Realtime)
- **Navigation**: [React Navigation v7](https://reactnavigation.org) (Native Stack & Bottom Tabs)
- **Media**: `react-native-youtube-iframe`

# Notebook-Buddy

A cool AI assistant app that makes learning fast and easy. Inspired by Jupyter notebooks (because they're awesome), it helps you quickly pick up new ideas from books, docs, research papers, and more.

<details>
<summary>📚 Introduction</summary>

## About Notebook-Buddy

Notebook-Buddy is an innovative learning assistant that transforms how you interact with educational content. Whether you're studying research papers, technical documentation, or educational materials, our app provides an interactive, Jupyter-notebook-style interface to enhance your learning experience.

### Key Features

- 📝 Interactive Canvas: Create and organize your study materials in a flexible, notebook-style interface
- 🤖 AI-Powered Assistance: Get intelligent insights and explanations for complex topics
- 📊 Visual Learning: Support for rich text, code blocks, and visual elements
- 🔄 Real-time Collaboration: Share and collaborate on study materials seamlessly
- 📱 Responsive Design: Access your notes from any device

</details>

<details>
<summary>🛠️ Technical Overview</summary>

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: React with Tailwind CSS
- **State Management**: React Hooks and Context API
- **Canvas Interaction**: Custom hooks for canvas manipulation

### Backend
- **Server**: FastAPI (Python)
- **Database**: DynamoDB
- **AI Integration**: OpenAI API
- **File Storage**: AWS S3

### Infrastructure
- **Deployment**: AWS (Lambda, API Gateway)
- **Authentication**: JWT-based auth system
- **Version Control**: Git

</details>

<details>
<summary>🔍 Detailed Architecture</summary>

## Project Structure

### Client (`/client`)
- `/app`: Next.js application routes and pages
  - `/canvas`: Interactive canvas components and logic
  - `/components`: Reusable UI components
  - `/hooks`: Custom React hooks for state management
- `/public`: Static assets
- `/types`: TypeScript type definitions

### Server (`/server`)
- `/api`: FastAPI application
  - `/endpoints`: REST API endpoint definitions
  - `/services`: Business logic and database interactions
  - `/models`: Data models and schemas
- `/uploads`: Temporary file storage

## Key Components

### Canvas System
The canvas system is the core of Notebook-Buddy, providing:
- Real-time text block manipulation
- Drag-and-drop functionality
- AI-powered content analysis
- Collaborative editing features

### Database Schema
- Text blocks
- User data
- Canvas metadata
- Collaboration permissions

### API Endpoints
- `/api/text_blocks`: CRUD operations for text content
- `/api/canvas`: Canvas management
- `/api/ai`: AI processing endpoints
- `/api/users`: User management

</details>

---

## Getting Started

1. Clone the repository
2. Set up environment variables (see `.env.example`)
3. Install dependencies:
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   pip install -r requirements.txt
   ```
4. Run the development servers:
   ```bash
   # Frontend
   npm run dev

   # Backend
   uvicorn main:app --host 0.0.0.0
   ```

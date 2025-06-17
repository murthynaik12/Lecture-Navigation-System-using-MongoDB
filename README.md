# Lecture Navigation System using MongoDB

A web-based Lecture Navigation System built with **Next.js** and **MongoDB**, designed to help students browse, search, and manage educational content more efficiently.

---

## 🚀 Features

- 📚 Organize lecture notes by topic, sub-topic, and type (video, text, PDF)
- 🔍 Search functionality for quick access to content
- 📦 Backend integration with MongoDB for dynamic data handling
- 🧠 Context API for global state management
- 🎨 Styled using Tailwind CSS
- 🌐 Server-side rendering and API routing with Next.js

---

## 🛠️ Tech Stack

| Layer        | Technology        |
|--------------|-------------------|
| Frontend     | Next.js, React.js |
| Backend      | Next.js API Routes |
| Styling      | Tailwind CSS      |
| Database     | MongoDB (via Mongoose or native driver) |
| Tools        | VS Code, Git, GitHub |

---

## 📁 Folder Structure

/Lecture-Navigation-System/
├── app/ # Next.js app routes
├── components/ # Reusable UI components
├── context/ # React context for state management
├── hooks/ # Custom React hooks
├── lib/ # Database helpers (e.g., MongoDB connection)
├── public/ # Static assets
├── styles/ # Tailwind/global CSS
├── pages/ or app/ # Pages or app router (Next.js)
├── .env.local # Environment variables (not pushed)
├── package.json # Project metadata and scripts
├── tailwind.config.ts # Tailwind config
└── next.config.js # Next.js config


---

## ⚙️ Getting Started

1. **Clone the repository**  
   ```bash
   git clone https://github.com/murthynaik12/Lecture-Navigation-System-using-MongoDB.git
   cd Lecture-Navigation-System-using-MongoDB
Install dependencies

bash
Copy
Edit
npm install
Setup environment variables
Create a .env.local file and add your MongoDB connection string:

ini
Copy
Edit
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
Run the development server

bash
Copy
Edit
npm run dev
View the app
Open http://localhost:3000 in your browser.

👨‍💻 Author
Murthy Naik

![image](https://github.com/user-attachments/assets/7160b075-3de7-4515-9f33-f963068bbd6a)login page




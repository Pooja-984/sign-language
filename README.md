# Modern Sign Language Translator

A web application that allows users to train and test custom sign language gestures using their computer's webcam. It leverages machine learning (MediaPipe and TensorFlow.js) directly in the browser for real-time hand gesture recognition.

## 🌟 Features

* **Real-time Hand Tracking**: Uses Google's MediaPipe to track hand landmarks directly in the browser.
* **Custom Gesture Training**: Users can capture examples of a sign language gesture through their camera to train a custom model.
* **Sign Check / Verification**: Users can test their trained gestures in real-time, and the app will provide a confidence score matching the gesture.
* **User Authentication**: Secure user registration and login system with JWT.
* **Admin Dashboard**: Specialized interface for administrators to create and manage system-wide default skills.
* **System & Personal Skills**: Distinguishes between global skills available to everyone and personal skills trained by individual users.

## 💻 Tech Stack

### Frontend
* **React.js** (via Vite)
* **TailwindCSS** for responsive and modern styling
* **TensorFlow.js** & **MediaPipe Hands** for computer vision and machine learning
* **React Router** for navigation
* **Axios** for API requests

### Backend
* **Node.js** & **Express.js**
* **MongoDB** & **Mongoose** for database management
* **JSON Web Tokens (JWT)** for secure authentication
* **Bcrypt** for password hashing

## 🚀 Setup & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) installed
* A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB server)

### 1. Clone the repository
```bash
git clone https://github.com/Pooja-984/sign-language.git
cd sign-language
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and add your environment variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 🌐 Usage

1. Once both servers are running, open your browser and navigate to `http://localhost:5173`.
2. **Register/Login** to your account.
3. Allow camera permissions when prompted.
4. Go to **Training** to add your own sign language gestures by capturing hand poses.
5. Go to **Sign Check** to test your saved gestures in real-time!

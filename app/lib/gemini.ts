import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is not set in environment variables");
}

// Initialize Gemini with error handling
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export default genAI;
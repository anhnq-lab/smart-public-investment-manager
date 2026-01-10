import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyARbcaihpFG5i4U0z4NVVbvjgFsJu2OPIA";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isError?: boolean;
}

export const sendMessageToGemini = async (
    history: ChatMessage[],
    newMessage: string
): Promise<string> => {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyARbcaihpFG5i4U0z4NVVbvjgFsJu2OPIA";
        if (!apiKey) {
            throw new Error("VITE_GEMINI_API_KEY is not set");
        }

        // Initialize Gemini API with the available key if not already global (though we init at top level, we might want to re-init or use the key here if the top level one failed? 
        // Actually, the top level init `new GoogleGenerativeAI(...)` happened at module load. 
        // If env var was missing then, it initialized with empty string.
        // We should move the initialization INSIDE the function or update how we use it.

        // Let's re-initialize here to be safe, or check if we need to.
        // Better: Update the top level initialization to use the fallback too.
        // To keep it simple and context-aware, we can use startChat.

        const chat = model.startChat({
            history: history
                .filter(msg => !msg.isError) // Filter out error messages
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }],
                })),
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(newMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        throw error;
    }
};

export const generateProjectSummary = async (projectData: any): Promise<string> => {
    try {
        const prompt = `
            Hãy đóng vai trò là một chuyên gia quản lý dự án đầu tư công.
            Dựa trên thông tin dự án sau đây, hãy tóm tắt ngắn gọn và chỉ ra các rủi ro tiềm ẩn (nếu có):
            ${JSON.stringify(projectData, null, 2)}
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating project summary:", error);
        throw error;
    }
};

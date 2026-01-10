import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
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
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY is not set");
        }

        // Convert chat history to Gemini format if needed, 
        // but for now we'll just send the new message as prompts are stateless unless using startChat
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

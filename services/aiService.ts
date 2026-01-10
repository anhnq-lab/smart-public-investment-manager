import { GoogleGenerativeAI } from "@google/generative-ai";

const getGenAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyARbcaihpFG5i4U0z4NVVbvjgFsJu2OPIA";
    if (!apiKey) {
        throw new Error("API Key configuration failed");
    }
    return new GoogleGenerativeAI(apiKey);
};

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
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: history
                .filter(msg => !msg.isError)
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
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

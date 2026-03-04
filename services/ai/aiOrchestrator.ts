// AI Orchestrator — Xử lý vòng lặp Gemini Function Calling
// Flow: User message → Gemini (+ tools) → Function Call? → Execute → Loop → Final response

import { GoogleGenerativeAI, FunctionCallingMode, Content } from '@google/generative-ai';
import { AI_TOOLS } from './aiTools';
import { SYSTEM_PROMPT_QLDA } from './prompts';
import { ProjectService } from '../ProjectService';
import { ContractService } from '../ContractService';
import { PaymentService } from '../PaymentService';
import { DashboardService } from '../DashboardService';
import { CapitalService } from '../CapitalService';
import type { ChatMessage } from '../aiService';

const getGenAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_GEMINI_API_KEY environment variable');
    }
    return new GoogleGenerativeAI(apiKey);
};

// Model name — Gemini 1.5 Flash for speed + function calling support
const MODEL_NAME = 'gemini-2.0-flash';

/**
 * Execute a function call from Gemini
 * Maps function name to actual service calls
 */
async function executeFunctionCall(
    name: string,
    args: Record<string, unknown>
): Promise<unknown> {
    try {
        switch (name) {
            case 'get_all_projects': {
                const params: { search?: string; filters?: Record<string, unknown> } = {};
                if (args.search) params.search = args.search as string;
                if (args.status) params.filters = { status: Number(args.status) };
                const projects = await ProjectService.getAll(params);
                // Return summary to avoid token overflow
                return projects.map(p => ({
                    ProjectID: p.ProjectID,
                    ProjectName: p.ProjectName,
                    GroupCode: p.GroupCode,
                    Status: p.Status,
                    TotalInvestment: p.TotalInvestment,
                    Progress: p.Progress,
                    PaymentProgress: p.PaymentProgress,
                    InvestorName: p.InvestorName,
                }));
            }

            case 'get_project_by_id': {
                const project = await ProjectService.getById(args.projectId as string);
                return project || { error: 'Không tìm thấy dự án' };
            }

            case 'get_project_statistics': {
                return await ProjectService.getStatistics();
            }

            case 'get_all_contracts': {
                const params: { filters?: Record<string, unknown> } = {};
                if (args.status) params.filters = { status: Number(args.status) };
                const contracts = await ContractService.getAll(params);
                return contracts.map(c => ({
                    ContractID: c.ContractID,
                    ContractName: c.ContractName,
                    Value: c.Value,
                    Status: c.Status,
                    SignDate: c.SignDate,
                    AdvanceRate: c.AdvanceRate,
                    Warranty: c.Warranty,
                }));
            }

            case 'get_all_payments': {
                const params: { filters?: Record<string, unknown> } = {};
                if (args.contractId) params.filters = { contractId: args.contractId as string };
                const payments = await PaymentService.getAll(params);
                return payments.map(p => ({
                    PaymentID: p.PaymentID,
                    ContractID: p.ContractID,
                    BatchNo: p.BatchNo,
                    Type: p.Type,
                    Amount: p.Amount,
                    Status: p.Status,
                }));
            }

            case 'get_dashboard_metrics': {
                return await DashboardService.getMetrics();
            }

            case 'get_capital_info': {
                return await ProjectService.getCapitalInfo(args.projectId as string);
            }

            case 'get_dashboard_risks': {
                return await DashboardService.getRisks();
            }

            case 'get_upcoming_deadlines': {
                return await DashboardService.getDeadlines();
            }

            case 'get_bidding_packages': {
                if (args.projectId) {
                    return await ProjectService.getPackagesByProject(args.projectId as string);
                }
                return await ProjectService.getAllBiddingPackages();
            }

            default:
                return { error: `Unknown function: ${name}` };
        }
    } catch (error) {
        console.error(`Error executing function ${name}:`, error);
        return { error: `Lỗi khi truy vấn dữ liệu: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

/**
 * Send a message with full context + function calling
 * Handles the function calling loop automatically
 */
export async function sendContextAwareMessage(
    history: ChatMessage[],
    newMessage: string
): Promise<string> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: SYSTEM_PROMPT_QLDA,
        tools: [{ functionDeclarations: AI_TOOLS }],
        toolConfig: {
            functionCallingConfig: { mode: FunctionCallingMode.AUTO },
        },
    });

    // Convert chat history to Gemini format
    const validHistory = history.filter(msg => !msg.isError);
    const firstUserIndex = validHistory.findIndex(msg => msg.sender === 'user');
    const apiHistory: Content[] =
        firstUserIndex !== -1
            ? validHistory.slice(firstUserIndex).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }))
            : [];

    const chat = model.startChat({
        history: apiHistory,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.3, // Lower temp for more factual responses
        },
    });

    // Send message and handle function calling loop
    let response = await chat.sendMessage(newMessage);
    let result = response.response;

    // Loop for up to 5 function calls (safety limit)
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
        const candidate = result.candidates?.[0];
        if (!candidate?.content?.parts) break;

        // Check for function calls
        const functionCalls = candidate.content.parts.filter(
            (part) => 'functionCall' in part
        );

        if (functionCalls.length === 0) break;

        // Execute all function calls
        const functionResponses = [];
        for (const part of functionCalls) {
            if (!('functionCall' in part) || !part.functionCall) continue;
            const { name, args } = part.functionCall;
            console.log(`[AI] Calling function: ${name}`, args);

            const functionResult = await executeFunctionCall(name, (args || {}) as Record<string, unknown>);
            functionResponses.push({
                functionResponse: {
                    name,
                    response: { result: functionResult },
                },
            });
        }

        // Send function results back to Gemini
        response = await chat.sendMessage(functionResponses);
        result = response.response;
        iterations++;
    }

    return result.text();
}

/**
 * Generate AI analysis with a specific prompt (no function calling)
 * Used for risk analysis, compliance, forecasting etc.
 */
export async function generateAIAnalysis(
    prompt: string,
    data: unknown
): Promise<string> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.2, // Very low temp for structured output
        },
    });

    const fullPrompt = `${prompt}\n\nDữ liệu:\n${JSON.stringify(data, null, 2)}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
}

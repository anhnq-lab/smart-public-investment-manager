// AI Service — Entry point cho tất cả tính năng AI
// Re-exports + backward compatibility

import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendContextAwareMessage, generateAIAnalysis } from './ai/aiOrchestrator';
import { RISK_ANALYSIS_PROMPT, DOCUMENT_DRAFT_PROMPT, SUMMARY_PROMPT, COMPLIANCE_PROMPT, FORECAST_PROMPT } from './ai/prompts';

// ── Shared helpers ──────────────────────────────────────────────────
const getGenAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_GEMINI_API_KEY environment variable');
    }
    return new GoogleGenerativeAI(apiKey);
};

// ── Types ───────────────────────────────────────────────────────────
export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isError?: boolean;
}

// ── 1. Context-Aware Chatbot (GĐ 1A) ──────────────────────────────
export const sendMessageToGemini = async (
    history: ChatMessage[],
    newMessage: string
): Promise<string> => {
    // Upgraded: now uses function calling + system prompt
    return sendContextAwareMessage(history, newMessage);
};

// ── 2. Risk Intelligence (GĐ 1B) ──────────────────────────────────
export interface RiskItem {
    level: 'critical' | 'warning' | 'info';
    category: 'budget' | 'schedule' | 'legal' | 'quality' | 'resource';
    title: string;
    description: string;
    recommendation: string;
    metric?: string;
}

export interface RiskAnalysisResult {
    risks: RiskItem[];
    overallScore: number;
    summary: string;
}

export const analyzeRisks = async (projectData: unknown): Promise<RiskAnalysisResult> => {
    try {
        const raw = await generateAIAnalysis(RISK_ANALYSIS_PROMPT, projectData);
        // Extract JSON from response (may contain markdown code blocks)
        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr) as RiskAnalysisResult;
    } catch (error) {
        console.error('Error analyzing risks:', error);
        return { risks: [], overallScore: 0, summary: 'Không thể phân tích rủi ro' };
    }
};

// ── 3. Document Drafting (GĐ 1C) ──────────────────────────────────
export const draftDocument = async (
    documentType: string,
    projectData: unknown
): Promise<string> => {
    try {
        const data = { documentType, ...projectData as Record<string, unknown> };
        return await generateAIAnalysis(DOCUMENT_DRAFT_PROMPT, data);
    } catch (error) {
        console.error('Error drafting document:', error);
        throw error;
    }
};

// ── 4. Smart Summary (GĐ 2A) ──────────────────────────────────────
export const generateSummary = async (data: unknown): Promise<string> => {
    try {
        return await generateAIAnalysis(SUMMARY_PROMPT, data);
    } catch (error) {
        console.error('Error generating summary:', error);
        throw error;
    }
};

// Backward compatibility alias
export const generateProjectSummary = async (projectData: unknown): Promise<string> => {
    return generateSummary(projectData);
};

// ── 5. Compliance Check (GĐ 2B) ───────────────────────────────────
export interface ComplianceCheck {
    id: string;
    regulation: string;
    article: string;
    requirement: string;
    status: 'passed' | 'warning' | 'violation' | 'pending';
    detail: string;
    recommendation?: string;
}

export interface ComplianceResult {
    checks: ComplianceCheck[];
    complianceScore: number;
    summary: string;
}

export const checkCompliance = async (projectData: unknown): Promise<ComplianceResult> => {
    try {
        const raw = await generateAIAnalysis(COMPLIANCE_PROMPT, projectData);
        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr) as ComplianceResult;
    } catch (error) {
        console.error('Error checking compliance:', error);
        return { checks: [], complianceScore: 0, summary: 'Không thể kiểm tra tuân thủ' };
    }
};

// ── 6. Forecasting (GĐ 2C) ─────────────────────────────────────────
export interface ForecastResult {
    disbursementForecast: {
        currentRate: number;
        projectedYearEnd: number;
        scenarios: { optimistic: number; baseline: number; pessimistic: number };
        monthlyProjection: Array<{ month: string; projected: number; plan: number }>;
    };
    completionForecast: {
        plannedDate: string;
        projectedDate: string;
        delayDays: number;
        confidence: 'high' | 'medium' | 'low';
    };
    analysis: string;
}

export const forecastProgress = async (projectData: unknown): Promise<ForecastResult> => {
    try {
        const raw = await generateAIAnalysis(FORECAST_PROMPT, projectData);
        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr) as ForecastResult;
    } catch (error) {
        console.error('Error forecasting:', error);
        throw error;
    }
};

// ── Check if AI is available ────────────────────────────────────────
export const isAIAvailable = (): boolean => {
    try {
        getGenAI();
        return true;
    } catch {
        return false;
    }
};

// ── Re-export for sub-services (GĐ 3) ──────────────────────────────
export { generateAIAnalysis };

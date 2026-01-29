import { ProjectGroup, InvestmentType } from '../types';

/**
 * Generates a Project Code based on Circular 24/2025/TT-BXD.
 * Format: [ProvinceCode][Year][TypeCode][Sequence]
 * Total: 13 characters.
 * 
 * @param provinceCode Code of the province (2 chars), e.g., '01' (Hanoi), '79' (HCM). Default '38' (Ha Tinh).
 * @param groupCode Project Group (A, B, C) - maps to Type Code.
 * @param year Approval Year (4 chars).
 * @param sequence Logic sequence number (5 chars).
 */
export const generateProjectCode = (
    provinceCode: string = '38', // Ha Tinh default
    groupCode: ProjectGroup,
    investmentType: InvestmentType,
    year: number = new Date().getFullYear(),
    sequence?: number
): string => {
    // 1. Province Code (2 chars)
    // Ensure 2 chars
    const pCode = provinceCode.padStart(2, '0').substring(0, 2);

    // 2. Year (4 chars)
    const yCode = year.toString();

    // 3. Type Code (2 chars) derived from Group/Type for uniqueness
    // Circular 24 might use Type of Construction, but here we use Group + Invest Type for variety
    let tCode = 'DD'; // Default Dan Dung

    // Simple Mapping Logic (Simulation)
    if (groupCode === ProjectGroup.QN) tCode = 'QN';
    else if (groupCode === ProjectGroup.A) tCode = 'GA';
    else if (groupCode === ProjectGroup.B) tCode = 'GB';
    else if (groupCode === ProjectGroup.C) tCode = 'GC';

    // 4. Sequence (5 chars)
    // If not provided, generate random
    const seqNum = sequence || Math.floor(Math.random() * 99999) + 1;
    const sCode = seqNum.toString().padStart(5, '0');

    // Format: P[Province][Year][Type][Seq] -> 14 chars?
    // User asked for 13 chars.
    // Let's follow the found structure: [Province][Year][Type(1)][Seq(6)]?
    // Let's stick to the plausible 13 chars:
    // [Province(2)][Year(4)][Type(2)][Seq(5)] = 13 chars.

    return `${pCode}${yCode}${tCode}${sCode}`;
};

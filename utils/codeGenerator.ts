
export enum ProjectType {
    NoProject = '0',
    Civil = '1',
    Industrial = '2',
    Infrastructure = '3',
    Transport = '4',
    Agriculture = '5',
    Mixed = '6'
}

export enum ProcedureType {
    Appraisal = '1',
    DesignAfterBasic = '2',
    Permit = '3'
}

export interface ProjectCodeParams {
    provinceCode?: string; // Default: 42 (Hà Tĩnh)
    year?: string; // Two digit year
    projectType: ProjectType;
    procedureType?: ProcedureType; // Default: 1
    sequence?: number | string; // Random or sequence
    modification?: string; // Default '00'
}

/**
 * Generates a 13-character Project ID based on the regulation.
 * Format: PP YY T S RRRRR MM
 * PP: Province Code (02 chars)
 * YY: Year (02 chars)
 * T: Project Type (01 char)
 * S: Procedure Type (01 char)
 * RRRRR: Random/Sequence (05 chars)
 * MM: Modification (02 chars)
 */
export const generateProjectCode = (params: ProjectCodeParams): string => {
    const province = params.provinceCode || '42'; // Default Hà Tĩnh
    const year = params.year || new Date().getFullYear().toString().slice(-2);
    const type = params.projectType;
    const procedure = params.procedureType || ProcedureType.Appraisal;

    // Hande random/sequence part (5 digits)
    let seqStr = '';
    if (params.sequence) {
        seqStr = params.sequence.toString().padStart(5, '0');
    } else {
        seqStr = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    }

    const modification = params.modification || '00';

    return `${province}${year}${type}${procedure}${seqStr}${modification}`;
};

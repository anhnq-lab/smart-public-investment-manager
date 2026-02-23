/**
 * Temporary Auth Configuration
 * 
 * Login credentials until Supabase Auth is implemented.
 * Matches employees in Supabase DB (employee_id NV001-NV009).
 */
import { Employee, Role, EmployeeStatus } from '../types';

export interface AuthCredential {
    EmployeeID: string;
    Username: string;
    Email: string;
    Password: string;
}

/** Login lookup - minimal data for authentication only */
export const authCredentials: AuthCredential[] = [
    { EmployeeID: 'NV001', Username: 'Admin', Email: 'quocanhnguyen.ksxd@gmail.com', Password: '123456' },
    { EmployeeID: 'NV002', Username: 'HVHUNG.BGD', Email: 'hvhung@hvctqg.edu.vn', Password: '123456' },
    { EmployeeID: 'NV003', Username: 'TXBAN.BGD', Email: 'txban@hvctqg.edu.vn', Password: '123456' },
    { EmployeeID: 'NV004', Username: 'LMTUAN.KTGS', Email: 'lmtuan@hvctqg.edu.vn', Password: '123456' },
    { EmployeeID: 'NV005', Username: 'NTHNHUNG.KHTC', Email: 'nthnhung@hvctqg.edu.vn', Password: '123456' },
    { EmployeeID: 'NV006', Username: 'PVDUC.KTGS', Email: 'pvduc@hvctqg.edu.vn', Password: '123456' },
    { EmployeeID: 'NV007', Username: 'TTMANH.KHTC', Email: 'ttmanh@hvctqg.edu.vn', Password: '123456' },
    { EmployeeID: 'NV008', Username: 'DQHUNG.KTGS', Email: 'dqhung@hvctqg.edu.vn', Password: '123456' },
    { EmployeeID: 'NV009', Username: 'VTLPHUONG.HCTH', Email: 'vtlphuong@hvctqg.edu.vn', Password: '123456' },
];

/** 
 * Validate credentials and return employee ID if matched.
 * Employee profile data will be fetched from Supabase separately.
 */
export function validateCredentials(username: string, password: string): string | null {
    const match = authCredentials.find(c =>
        (c.Username === username || c.Email === username) && c.Password === password
    );
    return match?.EmployeeID ?? null;
}

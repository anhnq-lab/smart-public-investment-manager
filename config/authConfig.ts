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
    { EmployeeID: 'NV002', Username: 'HUNG.HV', Email: '', Password: '123456' },
    { EmployeeID: 'NV003', Username: 'DUAN.VD', Email: '', Password: '123456' },
    { EmployeeID: 'NV004', Username: 'LUAT.NT', Email: '', Password: '123456' },
    { EmployeeID: 'NV005', Username: 'VINH.NH', Email: '', Password: '123456' },
    { EmployeeID: 'NV006', Username: 'THUY.DX', Email: '', Password: '123456' },
    { EmployeeID: 'NV007', Username: 'MINH.LT', Email: '', Password: '123456' },
    { EmployeeID: 'NV008', Username: 'PHUONG.NN', Email: '', Password: '123456' },
    { EmployeeID: 'NV009', Username: 'LINH.HT', Email: '', Password: '123456' },
    { EmployeeID: 'NV010', Username: 'ANH.NTL', Email: '', Password: '123456' },
    { EmployeeID: 'NV011', Username: 'TOAN.PT', Email: '', Password: '123456' },
    { EmployeeID: 'NV012', Username: 'TUNG.LT', Email: '', Password: '123456' },
    { EmployeeID: 'NV013', Username: 'HA.DH', Email: '', Password: '123456' },
    { EmployeeID: 'NV014', Username: 'HUNG.NM', Email: '', Password: '123456' },
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

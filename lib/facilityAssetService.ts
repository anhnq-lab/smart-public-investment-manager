/**
 * Facility Asset Service — CRUD for building assets/equipment
 * Table: facility_assets
 */
import { supabase } from './supabase';

export interface FacilityAsset {
    asset_id: string;
    project_id: string;
    asset_code: string | null;
    asset_name: string;
    category: string | null;
    location: string | null;
    manufacturer: string | null;
    model: string | null;
    install_date: string | null;
    warranty_expiry: string | null;
    last_maintenance: string | null;
    next_maintenance: string | null;
    maintenance_cycle_days: number | null;
    status: 'Active' | 'Maintenance' | 'Broken' | 'Retired';
    condition: 'Good' | 'Fair' | 'Poor' | 'Critical';
    notes: string | null;
    bim_element_id: string | null;
    created_at: string;
    updated_at: string;
}

export type FacilityAssetInsert = Omit<FacilityAsset, 'asset_id' | 'created_at' | 'updated_at'>;
export type FacilityAssetUpdate = Partial<Omit<FacilityAsset, 'asset_id' | 'project_id' | 'created_at' | 'updated_at'>>;

// ── Asset categories ──
export const ASSET_CATEGORIES = [
    'Cơ điện',
    'PCCC',
    'HVAC',
    'Thang máy',
    'Cấp thoát nước',
    'Máy phát điện',
    'Năng lượng',
    'Khác',
] as const;

// ── Get all assets for a project ──
export async function getProjectAssets(projectId: string): Promise<FacilityAsset[]> {
    const { data, error } = await supabase
        .from('facility_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as FacilityAsset[];
}

// ── Create asset ──
export async function createAsset(asset: FacilityAssetInsert): Promise<FacilityAsset> {
    const { data, error } = await supabase
        .from('facility_assets')
        .insert(asset)
        .select()
        .single();

    if (error) throw error;
    return data as FacilityAsset;
}

// ── Update asset ──
export async function updateAsset(assetId: string, updates: FacilityAssetUpdate): Promise<FacilityAsset> {
    const { data, error } = await supabase
        .from('facility_assets')
        .update(updates)
        .eq('asset_id', assetId)
        .select()
        .single();

    if (error) throw error;
    return data as FacilityAsset;
}

// ── Delete asset ──
export async function deleteAsset(assetId: string): Promise<void> {
    const { error } = await supabase
        .from('facility_assets')
        .delete()
        .eq('asset_id', assetId);

    if (error) throw error;
}

// ── Đếm số asset có bim_element_id (đã được extract từ BIM) ──
export async function getProjectBimAssetCount(projectId: string): Promise<number> {
    const { count, error } = await supabase
        .from('facility_assets')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .not('bim_element_id', 'is', null);

    if (error) return 0;
    return count || 0;
}

import * as OBC from '@thatopen/components';
import * as WEBIFC from 'web-ifc';
import { FacilityAssetInsert, createAsset, getProjectBimAssetCount } from '../../../../../lib/facilityAssetService';

// ── Standalone web-ifc (reuse cached instance) ──
let _ifcApi: WEBIFC.IfcAPI | null = null;
let _initP: Promise<WEBIFC.IfcAPI> | null = null;
async function getIfcApi(): Promise<WEBIFC.IfcAPI> {
    if (_ifcApi) return _ifcApi;
    if (_initP) return _initP;
    _initP = (async () => {
        const api = new WEBIFC.IfcAPI();
        api.SetWasmPath('/');
        await api.Init();
        _ifcApi = api;
        return api;
    })();
    return _initP;
}

// ── Danh sách IFC type codes của thiết bị MEP cụ thể ──
// Chỉ giữ thiết bị LỚN cần quản lý vận hành (bỏ sensor, valve, outlet, cable, light...)
const MEP_IFC_TYPES: number[] = [
    WEBIFC.IFCCHILLER, WEBIFC.IFCPUMP, WEBIFC.IFCFAN, WEBIFC.IFCAIRTERMINAL, WEBIFC.IFCBOILER,
    WEBIFC.IFCCOMPRESSOR, WEBIFC.IFCCONDENSER, WEBIFC.IFCCOOLINGTOWER, WEBIFC.IFCDAMPER,
    WEBIFC.IFCELECTRICDISTRIBUTIONBOARD, WEBIFC.IFCELECTRICGENERATOR, WEBIFC.IFCELECTRICMOTOR,
    WEBIFC.IFCENGINE, WEBIFC.IFCFLOWSTORAGEDEVICE,
    WEBIFC.IFCHEATEXCHANGER, WEBIFC.IFCSOLARDEVICE,
    WEBIFC.IFCTANK, WEBIFC.IFCTRANSFORMER, WEBIFC.IFCTRANSPORTELEMENT,
    WEBIFC.IFCUNITARYEQUIPMENT, WEBIFC.IFCFIRESUPPRESSIONTERMINAL,
    WEBIFC.IFCMEDICALDEVICE
].filter(Boolean);

// ── Danh sách IFC type codes CHUNG (proxy, distribution, v.v.) ──
// Nhiều file IFC thực tế dùng các loại generic này cho thiết bị
// Chỉ giữ proxy và energy conversion (bỏ flow fitting, flow segment, control elements nhỏ)
const GENERIC_IFC_TYPES: number[] = [
    WEBIFC.IFCBUILDINGELEMENTPROXY,     // 979105199 — catch-all
    WEBIFC.IFCDISTRIBUTIONELEMENT,      // Generic distribution element
    WEBIFC.IFCDISTRIBUTIONFLOWELEMENT,   // Generic flow
    WEBIFC.IFCENERGYCONVERSIONDEVICE,   // Energy devices
].filter(Boolean);

// ── Từ khóa nhận diện thiết bị qua Name / ObjectType ──
// Hỗ trợ cả tiếng Việt và tiếng Anh
interface KeywordRule {
    keywords: string[];
    category: string;
}

// Chỉ giữ keywords thiết bị LỚN — bỏ đèn, ổ cắm, cáp, cảm biến, van
const KEYWORD_RULES: KeywordRule[] = [
    // Máy phát điện
    { keywords: ['mayphatdien', 'máy phát điện', 'generator', 'genset', 'diesel gen', 'máy phát'], category: 'Máy phát điện' },
    // Biến áp / Transformer
    { keywords: ['bienap', 'biến áp', 'transformer', 'máy biến áp', 'trạm biến áp'], category: 'Cơ điện' },
    // Tủ điện
    { keywords: ['tudien', 'tủ điện', 'tủ phân phối', 'distribution board', 'switchboard', 'panel board', 'mdb', 'db-', 'sdb', 'switchgear', 'tủ ats', 'ats'], category: 'Cơ điện' },
    // UPS
    { keywords: ['ups', 'lưu điện', 'uninterruptible'], category: 'Cơ điện' },
    // Thang máy / Elevator
    { keywords: ['thangmay', 'thang máy', 'elevator', 'lift', 'escalator', 'thang cuốn'], category: 'Thang máy' },
    // Chiller / Điều hòa
    { keywords: ['chiller', 'điều hòa', 'dieu hoa', 'air conditioning', 'ahu', 'fcu', 'air handling', 'fan coil', 'cooling'], category: 'HVAC' },
    // Quạt lớn (hệ thống)
    { keywords: ['quạt hút', 'quạt cấp', 'quạt thông gió', 'exhaust fan', 'supply fan', 'ventilation fan'], category: 'HVAC' },
    // Bơm / Pump
    { keywords: ['bom', 'bơm', 'pump', 'máy bơm'], category: 'Cấp thoát nước' },
    // PCCC
    { keywords: ['pccc', 'phòng cháy', 'fire', 'sprinkler', 'chữa cháy', 'fire alarm', 'fire pump'], category: 'PCCC' },
    // Bể nước / Tank
    { keywords: ['bể', 'tank', 'bồn', 'bể nước', 'water tank', 'bể chứa'], category: 'Cấp thoát nước' },
    // Năng lượng mặt trời
    { keywords: ['solar', 'năng lượng mặt trời', 'pin mặt trời', 'solar panel'], category: 'Năng lượng' },
];

/**
 * Nhận diện thiết bị dựa trên tên/objectType và trả về category.
 * Trả về null nếu không khớp (nghĩa là không phải thiết bị).
 */
function matchEquipmentByName(name: string, objectType: string): string | null {
    const combined = `${name} ${objectType}`.toLowerCase().replace(/[^a-z0-9àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ ]/g, ' ');

    for (const rule of KEYWORD_RULES) {
        for (const kw of rule.keywords) {
            if (combined.includes(kw.toLowerCase())) {
                return rule.category;
            }
        }
    }
    return null;
}

/**
 * Phân loại tài sản dựa trên tên IFC Class (cho MEP types cụ thể)
 */
function categorizeByIfcType(ifcType: string): string {
    const type = ifcType.toLowerCase();

    if (type.includes('transport') || type.includes('elevator') || type.includes('escalator')) return 'Thang máy';
    if (type.includes('fire') || type.includes('suppression')) return 'PCCC';
    if (type.includes('electric') || type.includes('transformer') || type.includes('audio') || type.includes('communication') || type.includes('sensor') || type.includes('motor') || type.includes('distribution')) return 'Cơ điện';
    if (type.includes('chiller') || type.includes('fan') || type.includes('air') || type.includes('boiler') || type.includes('cooling') || type.includes('condenser') || type.includes('hvac') || type.includes('compressor') || type.includes('damper') || type.includes('heat')) return 'HVAC';
    if (type.includes('sanitary') || type.includes('pump') || type.includes('tank') || type.includes('valve') || type.includes('flow') || type.includes('meter')) return 'Cấp thoát nước';

    return 'Khác';
}

/**
 * Extract CIC_FacilityManagement properties for an element.
 * Returns map of CIC_FM_* property names to their values.
 */
function extractCicFmProps(
    ifcApi: WEBIFC.IfcAPI, modelID: number, expressID: number
): Record<string, string> {
    const result: Record<string, string> = {};
    try {
        const relIds = ifcApi.GetLineIDsWithType(modelID, 4186316022); // IFCRELDEFINESBYPROPERTIES
        for (let i = 0; i < relIds.size(); i++) {
            const relId = relIds.get(i);
            const rel = ifcApi.GetLine(modelID, relId, false);
            if (!rel?.RelatedObjects) continue;
            const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
            if (!related.some((r: any) => (r?.value ?? r) === expressID)) continue;
            const psetId = rel.RelatingPropertyDefinition?.value;
            if (!psetId) continue;
            const pset = ifcApi.GetLine(modelID, psetId, false);
            if (!pset?.Name?.value) continue;
            const psetName = pset.Name.value as string;
            if (!psetName.startsWith('CIC_') && !psetName.includes('Facility')) continue;
            if (pset.HasProperties) {
                const props = Array.isArray(pset.HasProperties) ? pset.HasProperties : [pset.HasProperties];
                for (const propRef of props) {
                    const propId = propRef?.value ?? propRef;
                    if (!propId) continue;
                    try {
                        const prop = ifcApi.GetLine(modelID, propId, false);
                        if (prop?.Name?.value && prop?.NominalValue?.value !== undefined) {
                            result[prop.Name.value] = String(prop.NominalValue.value);
                        }
                    } catch { /* skip */ }
                }
            }
        }
    } catch { /* skip */ }
    return result;
}

/**
 * Tự động tìm và lưu Tài sản / Thiết bị từ mô hình IFC.
 * 
 * Chiến lược 2 lớp:
 *   1. Quét các IFC type cụ thể (IfcPump, IfcChiller, ...) → luôn lấy
 *   2. Quét các IFC type chung (IfcBuildingElementProxy, ...) → lọc bằng tên
 */
export async function extractFacilityAssetsFromIFC(
    projectId: string,
    ifcData: Uint8Array,
    _ifcLoader?: OBC.IfcLoader  // kept for API compat, unused
): Promise<number> {
    let ifcApi: WEBIFC.IfcAPI;
    try {
        ifcApi = await getIfcApi();
    } catch (err) {
        console.warn('[AutoExtractor] Failed to init web-ifc:', err);
        return 0;
    }

    // Kiểm tra xem project đã có asset BIM chưa (tránh trùng lặp khi reload trang)
    try {
        const existingCount = await getProjectBimAssetCount(projectId);
        if (existingCount > 0) {
            return 0;
        }
    } catch { /* ignore check errors, proceed with extraction */ }

    let extractedCount = 0;
    const seenIds = new Set<number>(); // Tránh trùng lặp

    try {
        const modelID = ifcApi.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });


        try {
            const assetsToInsert: FacilityAssetInsert[] = [];

            // ═══ LỚP 1: Quét các MEP type cụ thể ═══
            for (const typeCode of MEP_IFC_TYPES) {
                try {
                    const ids = ifcApi.GetLineIDsWithType(modelID, typeCode);
                    if (ids.size() === 0) continue;

                    const typeName = ifcApi.GetNameFromTypeCode(typeCode) || 'Unknown';
                    const category = categorizeByIfcType(typeName);


                    for (let i = 0; i < ids.size(); i++) {
                        const id = ids.get(i);
                        if (seenIds.has(id)) continue;
                        seenIds.add(id);

                        try {
                            const line = ifcApi.GetLine(modelID, id, false);
                            if (!line) continue;

                            const name = line.Name?.value || line.LongName?.value || `${typeName} #${id}`;
                            const tag = line.Tag?.value || '';

                            // Try to get CIC_FM properties
                            const cicFm = extractCicFmProps(ifcApi, modelID, id);

                            assetsToInsert.push({
                                project_id: projectId,
                                asset_name: name,
                                asset_code: cicFm['CIC_FM_AssetCode'] || tag || `BIM-${id}`,
                                category: cicFm['CIC_FM_Category'] || category,
                                location: cicFm['CIC_FM_Location'] || null,
                                manufacturer: cicFm['CIC_FM_Manufacturer'] || null,
                                model: cicFm['CIC_FM_Model'] || null,
                                install_date: null,
                                warranty_expiry: null,
                                last_maintenance: null,
                                next_maintenance: null,
                                maintenance_cycle_days: cicFm['CIC_FM_MaintenanceCycle'] ? parseInt(cicFm['CIC_FM_MaintenanceCycle']) : 180,
                                status: (cicFm['CIC_FM_Status'] as any) || 'Active',
                                condition: (cicFm['CIC_FM_Condition'] as any) || 'Good',
                                notes: `IFC: ${typeName}`,
                                bim_element_id: String(id)
                            });
                        } catch { /* skip invalid line */ }
                    }
                } catch { /* type not in model */ }
            }

            // ═══ LỚP 2: Quét loại CHUNG → lọc bằng tên ═══
            for (const typeCode of GENERIC_IFC_TYPES) {
                try {
                    const ids = ifcApi.GetLineIDsWithType(modelID, typeCode);
                    if (ids.size() === 0) continue;

                    const typeName = ifcApi.GetNameFromTypeCode(typeCode) || 'GenericElement';


                    for (let i = 0; i < ids.size(); i++) {
                        const id = ids.get(i);
                        if (seenIds.has(id)) continue;

                        try {
                            const line = ifcApi.GetLine(modelID, id, false);
                            if (!line) continue;

                            const name = line.Name?.value || line.LongName?.value || '';
                            const objectType = line.ObjectType?.value || '';
                            const tag = line.Tag?.value || '';

                            // Chỉ lấy nếu tên khớp thiết bị
                            const category = matchEquipmentByName(name, objectType);
                            if (!category) continue;

                            seenIds.add(id);

                            // Try to get CIC_FM properties
                            const cicFm = extractCicFmProps(ifcApi, modelID, id);

                            assetsToInsert.push({
                                project_id: projectId,
                                asset_name: name || `${objectType} #${id}`,
                                asset_code: cicFm['CIC_FM_AssetCode'] || tag || `BIM-${id}`,
                                category: cicFm['CIC_FM_Category'] || category,
                                location: cicFm['CIC_FM_Location'] || null,
                                manufacturer: cicFm['CIC_FM_Manufacturer'] || null,
                                model: cicFm['CIC_FM_Model'] || null,
                                install_date: null,
                                warranty_expiry: null,
                                last_maintenance: null,
                                next_maintenance: null,
                                maintenance_cycle_days: cicFm['CIC_FM_MaintenanceCycle'] ? parseInt(cicFm['CIC_FM_MaintenanceCycle']) : 180,
                                status: (cicFm['CIC_FM_Status'] as any) || 'Active',
                                condition: (cicFm['CIC_FM_Condition'] as any) || 'Good',
                                notes: `IFC: ${typeName} | ObjectType: ${objectType}`,
                                bim_element_id: String(id)
                            });
                        } catch { /* skip */ }
                    }
                } catch { /* type not in model */ }
            }



            // ═══ Batch insert ═══
            const BATCH_SIZE = 50;
            for (let i = 0; i < assetsToInsert.length; i += BATCH_SIZE) {
                const batch = assetsToInsert.slice(i, i + BATCH_SIZE);
                const results = await Promise.allSettled(batch.map(asset => createAsset(asset)));
                const success = results.filter(r => r.status === 'fulfilled').length;
                extractedCount += success;

                await new Promise(res => setTimeout(res, 50));
            }

        } finally {
            ifcApi.CloseModel(modelID);
        }
    } catch (err) {
        console.error('[AutoExtractor] Lỗi khi trích xuất tài sản:', err);
    }


    return extractedCount;
}

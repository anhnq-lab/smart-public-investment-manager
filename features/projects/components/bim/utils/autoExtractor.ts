import * as OBC from '@thatopen/components';
import * as WEBIFC from 'web-ifc';
import { FacilityAssetInsert, createAsset } from '../../../../../lib/facilityAssetService';

// Danh sách các loại IFC được xem là Tài sản/Thiết bị (Facility Asset)
const ASSET_IFC_TYPES = [
    WEBIFC.IFCCHILLER, WEBIFC.IFCPUMP, WEBIFC.IFCFAN, WEBIFC.IFCAIRTERMINAL, WEBIFC.IFCBOILER,
    WEBIFC.IFCCOMPRESSOR, WEBIFC.IFCCONDENSER, WEBIFC.IFCCOOLINGTOWER, WEBIFC.IFCDAMPER,
    WEBIFC.IFCELECTRICDISTRIBUTIONBOARD, WEBIFC.IFCELECTRICGENERATOR, WEBIFC.IFCELECTRICMOTOR,
    WEBIFC.IFCENGINE, WEBIFC.IFCFLOWCONTROLLER, WEBIFC.IFCFLOWMETER, WEBIFC.IFCFLOWMOVINGDEVICE,
    WEBIFC.IFCFLOWSTORAGEDEVICE, WEBIFC.IFCFLOWTERMINAL, WEBIFC.IFCFLOWTREATMENTDEVICE,
    WEBIFC.IFCHEATEXCHANGER, WEBIFC.IFCSANITARYTERMINAL, WEBIFC.IFCSENSOR, WEBIFC.IFCSOLARDEVICE,
    WEBIFC.IFCTANK, WEBIFC.IFCTRANSFORMER, WEBIFC.IFCTRANSPORTELEMENT, WEBIFC.IFCUNITARYCONTROLELEMENT,
    WEBIFC.IFCUNITARYEQUIPMENT, WEBIFC.IFCVALVE, WEBIFC.IFCFIRESUPPRESSIONTERMINAL,
    WEBIFC.IFCAUDIOVISUALAPPLIANCE, WEBIFC.IFCCOMMUNICATIONSAPPLIANCE, WEBIFC.IFCMEDICALDEVICE
];

/**
 * Phân loại tài sản tự động dựa trên tên IFC Class
 */
function categorizeAsset(ifcType: string): string {
    const type = ifcType.toLowerCase();

    if (type.includes('transport') || type.includes('elevator') || type.includes('escalator')) return 'Thang máy';
    if (type.includes('fire') || type.includes('suppression')) return 'PCCC';
    if (type.includes('electric') || type.includes('transformer') || type.includes('audio') || type.includes('communication') || type.includes('sensor') || type.includes('motor') || type.includes('distribution')) return 'Cơ điện';
    if (type.includes('chiller') || type.includes('fan') || type.includes('air') || type.includes('boiler') || type.includes('cooling') || type.includes('condenser') || type.includes('hvac') || type.includes('compressor') || type.includes('damper') || type.includes('heat')) return 'HVAC';
    if (type.includes('sanitary') || type.includes('pump') || type.includes('tank') || type.includes('valve') || type.includes('flow') || type.includes('meter')) return 'Cấp thoát nước';

    return 'Khác';
}

/**
 * Tự động tìm và lưu các Tài sản / Thiết bị (Facility Assets) từ mô hình IFC.
 */
export async function extractFacilityAssetsFromIFC(
    projectId: string,
    ifcData: Uint8Array,
    ifcLoader: OBC.IfcLoader
): Promise<number> {
    if (!ifcLoader?.webIfc) return 0;

    let extractedCount = 0;

    try {
        const modelID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });

        try {
            const assetsToInsert: FacilityAssetInsert[] = [];

            for (const typeCode of ASSET_IFC_TYPES) {
                if (!typeCode) continue;

                let ids: WEBIFC.Vector<number>;
                try {
                    ids = ifcLoader.webIfc.GetLineIDsWithType(modelID, typeCode);
                } catch {
                    continue; // Type might not exist in this model
                }

                const typeName = ifcLoader.webIfc.GetNameFromTypeCode(typeCode) || 'Unknown';
                const category = categorizeAsset(typeName);

                for (let i = 0; i < ids.size(); i++) {
                    const id = ids.get(i);
                    try {
                        const line = ifcLoader.webIfc.GetLine(modelID, id, false);
                        if (!line) continue;

                        const name = line.Name?.value || line.LongName?.value || `${typeName} #${id}`;
                        const tag = line.Tag?.value || '';

                        assetsToInsert.push({
                            project_id: projectId,
                            asset_name: name,
                            asset_code: tag,
                            category: category,
                            location: null,
                            manufacturer: null,
                            model: null,
                            install_date: null,
                            warranty_expiry: null,
                            last_maintenance: null,
                            next_maintenance: null,
                            maintenance_cycle_days: 180, // Default 6 months
                            status: 'Active',
                            condition: 'Good',
                            notes: `Dữ liệu gốc từ IFC: ${typeName}`,
                            bim_element_id: String(id)
                        });
                    } catch (e) {
                        // Skip geometry errors for invalid lines
                    }
                }
            }

            // Gửi dữ liệu theo các đợt nhỏ (Batch insert) để tránh nghẽn
            const BATCH_SIZE = 50;
            for (let i = 0; i < assetsToInsert.length; i += BATCH_SIZE) {
                const batch = assetsToInsert.slice(i, i + BATCH_SIZE);
                await Promise.allSettled(batch.map(asset => createAsset(asset)));
                await new Promise(res => setTimeout(res, 50)); // Break event loop
                extractedCount += batch.length;
            }

        } finally {
            ifcLoader.webIfc.CloseModel(modelID);
        }
    } catch (err) {
        console.error('Lỗi khi tự động trích xuất tài sản BIMO&M:', err);
    }

    return extractedCount;
}

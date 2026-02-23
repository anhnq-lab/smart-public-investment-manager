-- 014_seed_facility_assets.sql
-- Thêm dữ liệu mẫu Quản lý Vận hành (Facility Assets) cho dự án Trường Chính trị Trần Phú

DO $$
DECLARE
    v_project_id uuid;
BEGIN
    -- Lấy ID của dự án Trường Chính trị Trần Phú trong db
    SELECT id INTO v_project_id FROM projects WHERE project_code = 'PR250006006B' LIMIT 1;

    IF v_project_id IS NULL THEN
        RAISE NOTICE 'Project PR250006006B not found. Skipping facility_assets seed.';
        RETURN;
    END IF;

    RAISE NOTICE 'Seeding facility_assets for project %', v_project_id;

    INSERT INTO facility_assets (
        project_id, asset_code, asset_name, category, location, manufacturer, 
        model, install_date, warranty_expiry, last_maintenance, next_maintenance, 
        maintenance_cycle_days, status, condition, notes
    ) VALUES
    -- Thang máy
    (
        v_project_id, 'ELV-01', 'Thang máy hành khách số 1', 'Thang máy', 'Tòa nhà A - Sảnh chính', 'Mitsubishi',
        'NEXIEZ-MRL', '2025-10-15', '2028-10-15', '2026-01-20', '2026-02-20',
        30, 'Active', 'Good', 'Bảo trì định kỳ hàng tháng. Hợp đồng số 12/HD-BT.'
    ),
    (
        v_project_id, 'ELV-02', 'Thang máy hành khách số 2', 'Thang máy', 'Tòa nhà A - Trục Tây', 'Mitsubishi',
        'NEXIEZ-MRL', '2025-10-15', '2028-10-15', '2026-01-22', '2026-02-22',
        30, 'Active', 'Good', 'Bảo trì định kỳ hàng tháng.'
    ),
    (
        v_project_id, 'ELV-03', 'Thang máy tải hàng', 'Thang máy', 'Tòa nhà B - Khu dịch vụ', 'Schindler',
        'Schindler 3300', '2025-11-20', '2027-11-20', '2026-01-10', '2026-03-10',
        60, 'Active', 'Fair', 'Cấm chở quá khối lượng. Thỉnh thoảng có tiếng ồn cửa tầng 2.'
    ),
    
    -- Hệ thống HVAC
    (
        v_project_id, 'CHL-01', 'Chiller trung tâm 01', 'HVAC', 'Tầng mái Tòa nhà A', 'Daikin',
        'EWWH-VZ', '2025-11-05', '2027-11-05', '2026-01-15', '2026-04-15',
        90, 'Active', 'Good', 'Hoạt động công suất 80% ban ngày.'
    ),
    (
        v_project_id, 'CHL-02', 'Chiller trung tâm 02', 'HVAC', 'Tầng mái Tòa nhà A', 'Daikin',
        'EWWH-VZ', '2025-11-05', '2027-11-05', '2026-01-15', '2026-04-15',
        90, 'Maintenance', 'Fair', 'Đang thay thế lọc sơ cấp và kiểm tra rò rỉ gas.'
    ),
    (
        v_project_id, 'AC-HALL', 'Cụm Điều hòa sảnh chính', 'HVAC', 'Lobby Tòa nhà A', 'Panasonic',
        'FSQ250', '2025-11-15', '2026-11-15', '2026-02-05', '2026-05-05',
        90, 'Active', 'Good', ''
    ),
    
    -- Trạm Điện & Máy phát
    (
        v_project_id, 'TRF-01', 'Trạm biến áp T1', 'Cơ điện', 'Khu kỹ thuật ngoài trời', 'Thibidi',
        'TBD-1500kVA', '2025-09-10', '2027-09-10', '2025-12-10', '2026-06-10',
        180, 'Active', 'Good', 'Trạm cấp nguồn chính cho toàn khu.'
    ),
    (
        v_project_id, 'GEN-01', 'Máy phát điện dự phòng', 'Máy phát điện', 'Phòng máy phát tầng hầm', 'Cummins',
        'C1000D5', '2025-09-25', '2027-09-25', '2026-02-01', '2026-03-01',
        30, 'Active', 'Good', 'Test chạy không tải mỗi ngày 1, kiểm tra có tải mỗi 3 tháng.'
    ),
    
    -- PCCC
    (
        v_project_id, 'FP-PUMP', 'Cụm bơm chữa cháy', 'PCCC', 'Tầng hầm B1 - Phòng bơm', 'Ebara',
        'FSA 100x80', '2025-10-01', '2026-10-01', '2026-01-25', '2026-04-25',
        90, 'Active', 'Good', 'Bao gồm bơm điện, bơm bù áp.'
    ),
    (
        v_project_id, 'FP-PUMP-DIE', 'Bơm chữa cháy Diesel', 'PCCC', 'Tầng hầm B1 - Phòng bơm', 'Hyundai',
        'D4DA', '2025-10-01', '2026-10-01', '2026-01-25', '2026-02-25',
        30, 'Maintenance', 'Poor', 'Lỗi rò rỉ nhớt, đang chờ kỹ thuật viên của hãng kiểm tra.'
    ),
    (
        v_project_id, 'FALARM', 'Tủ trung tâm báo cháy', 'PCCC', 'Phòng kỹ thuật an ninh', 'Hochiki',
        'HCV-8', '2025-10-10', '2026-10-10', '2026-02-10', '2026-03-10',
        30, 'Active', 'Good', 'Hệ thống báo cháy địa chỉ toàn nhà.'
    ),

    -- IT / Camera
    (
        v_project_id, 'SRV-01', 'Máy chủ Quản lý Tòa nhà (BMS)', 'Hệ thống IT/Mạng', 'Phòng Server Tầng 3', 'Dell',
        'PowerEdge R740', '2025-11-20', '2028-11-20', '2026-01-15', '2026-07-15',
        180, 'Active', 'Good', 'Lưu trữ database access control và BMS.'
    ),
    (
        v_project_id, 'CAM-01', 'Camera giám sát khu vực sảnh', 'Camera/An ninh', 'Sảnh A', 'Hikvision',
        'DS-2CD2T86G2', '2025-12-05', '2027-12-05', '2026-02-20', '2026-05-20',
        90, 'Broken', 'Critical', 'Mất tín hiệu kết nối.'
    ),
    (
        v_project_id, 'CAM-02', 'Camera giám sát hầm xe', 'Camera/An ninh', 'Hầm B1', 'Hikvision',
        'DS-2CD2T86G2', '2025-12-05', '2027-12-05', '2026-02-20', '2026-05-20',
        90, 'Active', 'Fair', 'Tầm nhìn thi thoảng bị nhiễu do bụi.'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Done inserting 14 dummy facility assets.';

END $$;

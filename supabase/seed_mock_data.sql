-- ============================================================
-- SEED DATA: Migrate mockData.ts → Supabase
-- Project: smart-public-investment-manager (omsewsmqihqvsahbpqup)
-- Generated: 2026-02-23
--
-- NOTE: Uses ON CONFLICT DO NOTHING to be idempotent.
-- Existing data (employees, projects, contractors, bidding_packages,
-- documents, tasks, project_members) will NOT be overwritten.
-- ============================================================

-- ============================================================
-- 1. ADDITIONAL CONTRACTORS (not already in DB)
-- DB has 24 contractors already. Adding mock-specific ones.
-- ============================================================

INSERT INTO contractors (contractor_id, full_name, cap_cert_code, is_foreign, address, contact_info)
VALUES
    ('LD-PR2500062685-07', 'Liên danh nhà thầu thi công Tu bổ, tôn tạo đình Vụ Bản, xã Minh Trí', 'LD-VUBAN', false, 'Hà Nội', 'liendanh.vuban@example.com'),
    ('vn0104426593', 'CÔNG TY CỔ PHẦN TƯ VẤN VÀ XÂY DỰNG MÊ LINH', 'MN044265', false, 'Hà Nội', 'melinh@example.com'),
    ('vn0304422444', 'TỔNG CÔNG TY CỔ PHẦN BẢO HIỂM TOÀN CẦU', 'MN044224', false, 'Hà Nội', 'baohiemtoancau@example.com'),
    ('3001328159', 'CÔNG TY CP TƯ VẤN VÀ ĐẦU TƯ XÂY DỰNG VINAXIM', 'CC1328159', false, 'Hà Nội', 'vinaxim@example.com')
ON CONFLICT (contractor_id) DO NOTHING;


-- ============================================================
-- 2. BIDDING PACKAGES (17 gói thầu dự án Nhà ở học viên)
-- DB already has 3 packages for PR2500060068.
-- Adding 17 packages for project 0121131131600 (Nhà ở học viên).
-- ============================================================

INSERT INTO bidding_packages (package_id, project_id, package_number, package_name, price, selection_method, bid_type, contract_type, status, field, duration, capital_source)
VALUES
    ('PKG-NOHV-01', '0121131131600', '01', 'Tư vấn thiết kế nội thất', 912752000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Consultancy', '60 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-02', '0121131131600', '02', 'Tư vấn thẩm tra thiết kế và dự toán nội thất', 113204000, 'Appointed', 'Offline', 'LumpSum', 'Awarded', 'Consultancy', '30 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-03', '0121131131600', '03', 'Tư vấn thẩm định giá nội thất', 50000000, 'Appointed', 'Offline', 'LumpSum', 'Awarded', 'Consultancy', '20 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-04', '0121131131600', '04', 'Tư vấn lập hồ sơ mời thầu, đánh giá hồ sơ dự thầu các gói thầu', 470177000, 'Appointed', 'Offline', 'LumpSum', 'Awarded', 'Consultancy', '340 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-05', '0121131131600', '05', 'Tư vấn thẩm định hồ sơ mời thầu, thẩm định kết quả lựa chọn nhà thầu các gói thầu', 217024000, 'Appointed', 'Offline', 'LumpSum', 'Awarded', 'Consultancy', '260 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-06', '0121131131600', '06', 'Giám sát thi công xây dựng, lắp đặt thiết bị và nội thất', 6073498000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Consultancy', '720 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-07', '0121131131600', '07', 'Quan trắc lún', 719505000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Consultancy', '720 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-08', '0121131131600', '08', 'Kiểm toán công trình', 1195194000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Consultancy', '360 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-09', '0121131131600', '09', 'Thí nghiệm cọc', 1218805000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Consultancy', '60 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-10', '0121131131600', '10', 'Bảo hiểm công trình xây dựng và thiết bị', 643493000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'NonConsultancy', '720 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-11', '0121131131600', '11', 'Phòng chống mối', 462486000, 'Appointed', 'Offline', 'LumpSum', 'Awarded', 'Construction', '180 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-12', '0121131131600', '12', 'Thi công xây dựng công trình', 428692341000, 'OpenBidding', 'Online', 'UnitPrice', 'Awarded', 'Construction', '720 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-13', '0121131131600', '13', 'Cung cấp lắp đặt thiết bị điều hòa không khí', 28288678000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Goods', '360 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-14', '0121131131600', '14', 'Cung cấp, lắp đặt thiết bị hệ thống thang máy, thang cuốn', 30416440000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Goods', '360 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-15', '0121131131600', '15', 'Cung cấp, lắp đặt thiết bị hệ thống điện nhẹ, âm thanh, camera giám sát', 8157768000, 'OpenBidding', 'Online', 'LumpSum', 'Bidding', 'Goods', '90 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-16', '0121131131600', '16', 'Cung cấp, lắp đặt thiết bị hệ thống máy phát điện, trạm biến áp', 15991945000, 'OpenBidding', 'Online', 'LumpSum', 'Awarded', 'Goods', '180 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo'),
    ('PKG-NOHV-17', '0121131131600', '17', 'Cung cấp, lắp đặt hệ thống trang thiết bị nội thất', 27292979000, 'OpenBidding', 'Online', 'LumpSum', 'Bidding', 'Goods', '45 ngày', 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo')
ON CONFLICT (package_id) DO NOTHING;


-- ============================================================
-- 3. CONTRACTS (5 hợp đồng dự án Nhà ở học viên)
-- Maps: ContractStatus.Executing = 1
-- Contractor mapping from existing DB:
--   mockContractors[0] = '3000109186'
--   mockContractors[1] = 'vn0107740913' (Bảo tồn Di sản VH Trung Hưng)
--   mockContractors[2] = 'vn0108622278' (Tu bổ Tôn tạo CT Văn hóa)
--   mockContractors[3] = 'vn0107128531' (Công nghệ Số 1 VN)
--   mockContractors[4] = 'vn0107008523' (Minh Châu)
-- ============================================================

INSERT INTO contracts (contract_id, package_id, contractor_id, project_id, contract_name, sign_date, value, advance_rate, warranty, status, has_vat)
VALUES
    ('HD-NOHV-12/XL', 'PKG-NOHV-12', '3000109186', '0121131131600', 'HĐ Thi công xây dựng công trình', '2023-03-15', 420000000000, 15, 24, 1, true),
    ('HD-NOHV-06/TV', 'PKG-NOHV-06', 'vn0107740913', '0121131131600', 'HĐ Giám sát thi công xây dựng', '2023-04-01', 5900000000, 30, 0, 1, true),
    ('HD-NOHV-13/HH', 'PKG-NOHV-13', 'vn0108622278', '0121131131600', 'HĐ Cung cấp lắp đặt điều hòa không khí', '2023-09-20', 27500000000, 15, 12, 1, true),
    ('HD-NOHV-14/HH', 'PKG-NOHV-14', 'vn0107128531', '0121131131600', 'HĐ Cung cấp lắp đặt thang máy, thang cuốn', '2024-01-10', 29800000000, 15, 24, 1, true),
    ('HD-NOHV-16/HH', 'PKG-NOHV-16', 'vn0107008523', '0121131131600', 'HĐ Cung cấp máy phát điện, trạm biến áp', '2024-03-15', 15500000000, 15, 12, 1, true)
ON CONFLICT (contract_id) DO NOTHING;


-- ============================================================
-- 4. PAYMENTS (9 khoản thanh toán)
-- PaymentType: 'Advance', 'Volume'
-- PaymentStatus: 'Pending', 'Transferred'
-- payment_id uses sequence, we specify explicit IDs
-- ============================================================

INSERT INTO payments (payment_id, contract_id, project_id, batch_no, type, amount, treasury_ref, status, description)
VALUES
    -- Gói 12: Thi công XD
    (101, 'HD-NOHV-12/XL', '0121131131600', 1, 'Advance', 63000000000, 'KB-NOHV-12-001', 'Transferred', 'Tạm ứng 15% HĐ thi công xây dựng'),
    (102, 'HD-NOHV-12/XL', '0121131131600', 2, 'Volume', 84000000000, 'KB-NOHV-12-002', 'Transferred', 'Thanh toán đợt 1 - Móng + Tầng hầm'),
    (103, 'HD-NOHV-12/XL', '0121131131600', 3, 'Volume', 105000000000, 'KB-NOHV-12-003', 'Transferred', 'Thanh toán đợt 2 - Kết cấu tầng 1-8'),
    (104, 'HD-NOHV-12/XL', '0121131131600', 4, 'Volume', 84000000000, 'KB-NOHV-12-004', 'Pending', 'Thanh toán đợt 3 - Kết cấu tầng 9-16 + Hoàn thiện'),
    -- Gói 06: Giám sát
    (201, 'HD-NOHV-06/TV', '0121131131600', 1, 'Advance', 1770000000, 'KB-NOHV-06-001', 'Transferred', 'Tạm ứng 30% HĐ giám sát'),
    -- Gói 13: Điều hòa
    (301, 'HD-NOHV-13/HH', '0121131131600', 1, 'Advance', 4125000000, 'KB-NOHV-13-001', 'Transferred', 'Tạm ứng 15% HĐ điều hòa'),
    -- Gói 14: Thang máy
    (401, 'HD-NOHV-14/HH', '0121131131600', 1, 'Advance', 4470000000, 'KB-NOHV-14-001', 'Transferred', 'Tạm ứng 15% HĐ thang máy'),
    -- Gói 16: Máy phát điện
    (501, 'HD-NOHV-16/HH', '0121131131600', 1, 'Advance', 2325000000, 'KB-NOHV-16-001', 'Transferred', 'Tạm ứng 15% HĐ máy phát điện')
ON CONFLICT (payment_id) DO NOTHING;

-- Update payment_id sequence to avoid conflicts with auto-increment
SELECT setval('payments_payment_id_seq', (SELECT COALESCE(MAX(payment_id), 0) + 1 FROM payments), false);


-- ============================================================
-- 5. FOLDERS (CDE - Common Data Environment)
-- folder_id is UUID in DB but mock uses string IDs.
-- We use deterministic UUIDs for reproducibility.
-- ============================================================

INSERT INTO folders (folder_id, parent_id, name, type, path)
VALUES
    ('a0000000-0000-0000-0000-000000000001', NULL, 'Dự án Nhà ở học viên (0121131131600)', 'Container', '/'),
    ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '01-WIP (Work In Progress)', 'Container', '/01-WIP'),
    ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '02-SHARED (Chia sẻ)', 'Container', '/02-SHARED'),
    ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '03-PUBLISHED (Đã phát hành)', 'Container', '/03-PUBLISHED'),
    ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '04-ARCHIVED (Lưu trữ)', 'Container', '/04-ARCHIVED'),
    ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', '10. Pháp lý', 'Folder', '/02-SHARED/10. Pháp lý'),
    ('a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', '20. Thiết kế', 'Folder', '/02-SHARED/20. Thiết kế'),
    ('a0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', '30. QL Chất lượng', 'Folder', '/02-SHARED/30. QL Chất lượng')
ON CONFLICT (folder_id) DO NOTHING;


-- ============================================================
-- 6. CAPITAL PLANS (Kế hoạch vốn)
-- Using project_id '0121131131600' (corrected from mock's PR2400031160)
-- ============================================================

INSERT INTO capital_plans (plan_id, project_id, year, amount, decision_number, date_assigned, source, disbursed_amount, status)
VALUES
    ('CP-2023-NOHV', '0121131131600', 2023, 50000000000, '112/QĐ-UBND', '2023-01-15', 'Ngân sách Tỉnh', 50000000000, 'Approved'),
    ('CP-2024-NOHV', '0121131131600', 2024, 85000000000, '15/QĐ-UBND', '2024-01-20', 'Ngân sách Trung ương', 45000000000, 'Approved'),
    ('CP-2025-NOHV', '0121131131600', 2025, 18173978000, '05/QĐ-UBND', '2025-01-10', 'Ngân sách Tỉnh', 0, 'Approved'),
    -- Kế hoạch vốn dự án Trường Chính trị Trần Phú
    ('CP-2025-TCTTP', 'PR2500060068', 2025, 10000000000, '2810/QĐ-UBND', '2025-11-11', 'Ngân sách địa phương', 0, 'Approved'),
    ('CP-2026-TCTTP', 'PR2500060068', 2026, 25000000000, '01/QĐ-UBND', '2026-01-05', 'Ngân sách địa phương', 2500000000, 'Approved')
ON CONFLICT (plan_id) DO NOTHING;


-- ============================================================
-- 7. DISBURSEMENTS (Giải ngân)
-- ============================================================

INSERT INTO disbursements (disbursement_id, project_id, capital_plan_id, amount, date, treasury_code, form_type, status, type, description)
VALUES
    ('DIS-001', '0121131131600', 'CP-2023-NOHV', 15000000000, '2023-03-20', 'KB-HT-23001', '03a', 'Approved', 'TamUng', 'Giải ngân tạm ứng đợt 1'),
    ('DIS-002', '0121131131600', 'CP-2023-NOHV', 35000000000, '2023-09-15', 'KB-HT-23055', '03a', 'Approved', 'ThanhToanKLHT', 'Giải ngân thanh toán KLHT đợt 1'),
    ('DIS-003', '0121131131600', 'CP-2024-NOHV', 20000000000, '2024-02-10', 'KB-HT-24012', '03a', 'Approved', 'ThanhToanKLHT', 'Giải ngân KLHT quý I/2024'),
    ('DIS-004', '0121131131600', 'CP-2024-NOHV', 25000000000, '2024-06-20', 'KB-HT-24089', '03a', 'Approved', 'ThanhToanKLHT', 'Giải ngân KLHT quý II/2024'),
    -- Giải ngân dự án Trường Chính trị Trần Phú
    ('DIS-005', 'PR2500060068', 'CP-2026-TCTTP', 2500000000, '2026-01-20', 'KB-HT-26005', '03a', 'Approved', 'TamUng', 'Tạm ứng tư vấn TKBVTC')
ON CONFLICT (disbursement_id) DO NOTHING;


-- ============================================================
-- 8. AUDIT LOGS
-- ============================================================

INSERT INTO audit_logs (action, target_entity, target_id, changed_by, timestamp, details)
VALUES
    ('Create', 'Employee', 'NV009', 'admin', '2024-03-01 08:30:00+07', 'Tạo tài khoản mới cho nhân viên Vũ Thị Lan Phương'),
    ('Update', 'Project', '0121131131600', 'NV002', '2024-06-15 14:20:00+07', 'Cập nhật tiến độ dự án Nhà ở học viên'),
    ('Create', 'Contract', 'HD-NOHV-12/XL', 'NV005', '2023-03-15 09:00:00+07', 'Ký hợp đồng thi công xây dựng công trình'),
    ('Update', 'BiddingPackage', 'PKG-NOHV-12', 'NV004', '2023-02-28 16:30:00+07', 'Cập nhật kết quả đấu thầu gói XL chính'),
    ('Create', 'Payment', '101', 'NV007', '2023-04-01 10:00:00+07', 'Tạm ứng hợp đồng thi công XD');


-- ============================================================
-- 9. PACKAGE ISSUES
-- ============================================================

INSERT INTO package_issues (package_id, title, description, status, severity, reported_date, reporter)
VALUES
    ('PKG-NOHV-12', 'Vướng mắc mặt bằng thi công phân khu 2', 'Chưa bàn giao được 500m2 đất nông nghiệp do hộ dân chưa đồng ý phương án đền bù.', 'Open', 'High', '2024-05-20', 'Ban GPMB'),
    ('PKG-NOHV-15', 'Chậm tiến độ phê duyệt HSMT', 'Hồ sơ mời thầu gói điện nhẹ, camera chưa được phê duyệt do thiếu ý kiến PCCC.', 'Open', 'Medium', '2025-03-10', 'Phòng KHKT'),
    ('PKG-PR2500060068-01', 'Cần bổ sung khảo sát địa chất khu vực phía Đông', 'Vùng đất phía Đông khu xây dựng có dấu hiệu đất yếu, cần khoan thăm dò bổ sung.', 'Resolved', 'High', '2025-04-25', 'Tư vấn địa chất');


-- ============================================================
-- 10. VARIATION ORDERS (Pending - need to check if table exists)
-- ============================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'variation_orders') THEN
        EXECUTE $sql$
            INSERT INTO variation_orders (vo_id, contract_id, number, sign_date, content, adjusted_amount, adjusted_duration)
            VALUES
                ('VO-01', 'HD-NOHV-12/XL', 'PL-01', '2023-11-15', 'Bổ sung khối lượng san lấp mặt bằng do thay đổi thiết kế cao độ', 500000000, 15),
                ('VO-02', 'HD-NOHV-06/TV', 'PL-01/TV', '2024-09-10', 'Điều chỉnh nhân sự tư vấn chủ chốt', 0, 0)
            ON CONFLICT DO NOTHING;
        $sql$;
    END IF;
END $$;


-- ============================================================
-- DONE. Summary:
--   Contractors: +4 new (total ~28)
--   Bidding Packages: +17 new (total ~20)
--   Contracts: +5 new
--   Payments: +8 new (IDs 101-501)
--   Folders: +8 new (CDE structure)
--   Capital Plans: +5 new (2023-2026)
--   Disbursements: +5 new
--   Audit Logs: +5 new
--   Package Issues: +3 new
--   Variation Orders: +2 new (if table exists)
-- ============================================================

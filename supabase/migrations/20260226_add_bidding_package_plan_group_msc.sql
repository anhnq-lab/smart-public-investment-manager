-- Migration: Add Plan Group, MSC Integration, and Sort Order to bidding_packages
-- Context: Support grouping packages by KHLCNT plan, muasamcong.vn links, and drag reorder

-- Plan Group fields (grouping by KHLCNT/QĐ phê duyệt)
ALTER TABLE bidding_packages ADD COLUMN IF NOT EXISTS plan_group_name text;
ALTER TABLE bidding_packages ADD COLUMN IF NOT EXISTS plan_decision_number text;
ALTER TABLE bidding_packages ADD COLUMN IF NOT EXISTS plan_decision_date date;

-- Muasamcong.vn integration fields
ALTER TABLE bidding_packages ADD COLUMN IF NOT EXISTS msc_plan_code text;
ALTER TABLE bidding_packages ADD COLUMN IF NOT EXISTS msc_package_link text;
ALTER TABLE bidding_packages ADD COLUMN IF NOT EXISTS msc_publish_status text DEFAULT 'NotDone';

-- Sort order for drag-reorder
ALTER TABLE bidding_packages ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_bidding_packages_sort_order ON bidding_packages (project_id, sort_order);

-- Comment
COMMENT ON COLUMN bidding_packages.plan_group_name IS 'Tên nhóm KHLCNT (giai đoạn)';
COMMENT ON COLUMN bidding_packages.plan_decision_number IS 'Số QĐ phê duyệt kế hoạch LCNT';
COMMENT ON COLUMN bidding_packages.plan_decision_date IS 'Ngày QĐ phê duyệt kế hoạch LCNT';
COMMENT ON COLUMN bidding_packages.msc_plan_code IS 'Mã KHLCNT trên muasamcong.vn';
COMMENT ON COLUMN bidding_packages.msc_package_link IS 'Link gói thầu trên muasamcong.vn';
COMMENT ON COLUMN bidding_packages.msc_publish_status IS 'Trạng thái đăng tải trên muasamcong';
COMMENT ON COLUMN bidding_packages.sort_order IS 'Thứ tự sắp xếp do user drag-reorder';

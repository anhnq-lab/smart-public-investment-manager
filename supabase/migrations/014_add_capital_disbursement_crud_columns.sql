-- Migration: Add missing columns for Capital & Disbursement CRUD
-- Date: 2026-02-18

-- ═══════════════════════════════════════════════════════════
-- 1. DISBURSEMENTS — thêm cột cho CRUD đầy đủ
-- ═══════════════════════════════════════════════════════════

ALTER TABLE disbursements
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'ThanhToanKLHT',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS contract_number text,
  ADD COLUMN IF NOT EXISTS cumulative_before numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_balance numeric DEFAULT 0;

COMMENT ON COLUMN disbursements.type IS 'Loại giải ngân: TamUng, ThanhToanKLHT, ThuHoiTamUng';
COMMENT ON COLUMN disbursements.description IS 'Nội dung/mô tả';
COMMENT ON COLUMN disbursements.contract_number IS 'Số hợp đồng liên quan';
COMMENT ON COLUMN disbursements.cumulative_before IS 'Lũy kế thanh toán trước đợt này';
COMMENT ON COLUMN disbursements.advance_balance IS 'Số dư tạm ứng chưa thu hồi';

-- ═══════════════════════════════════════════════════════════
-- 2. CAPITAL_PLANS — thêm cột status
-- ═══════════════════════════════════════════════════════════

ALTER TABLE capital_plans
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Approved';

COMMENT ON COLUMN capital_plans.status IS 'Trạng thái: Draft, Approved, Allocated, Closed';

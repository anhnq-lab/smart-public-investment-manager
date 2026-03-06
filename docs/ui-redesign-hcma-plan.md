# Kế hoạch Redesign Giao diện — Theo phong cách hcma.vn

> Tạo: 2026-03-06 | Trạng thái: Chưa thực hiện

Chuyển đổi giao diện ứng dụng **Quản lý Dự án Đầu tư công** theo phong cách cổng thông tin của [Học viện Chính trị Quốc gia HCM](https://hcma.vn/).

---

## Bảng thông số thiết kế (trích từ hcma.vn)

| Thuộc tính | Giá trị | Mục đích sử dụng |
|------------|---------|-------------------|
| **Màu chính (Đỏ cờ)** | `#AE1E23` | Header, thương hiệu, nút bấm, sidebar |
| **Màu chính đậm** | `#8B181C` | Hiệu ứng hover |
| **Màu chính nhạt** | `#D42A30` | Điểm nhấn đỏ nhạt |
| **Gradient Vàng/Cam** | `#F99715 → #EC6710` | Thanh tiện ích trên cùng, badge, tiêu đề mục |
| **Vàng nhấn** | `#D4A843` | Trang trí |
| **Nền trang** | `#FFFFFF` | Nền chính |
| **Mặt card** | `#F5F5F5` | Nền card, ô nhập liệu |
| **Chữ chính** | `#1A1A1A` | Nội dung chính |
| **Chữ phụ** | `#3E4144` | Menu, nội dung phụ |
| **Font tiêu đề** | `Noto Serif, serif` | Tiêu đề tổ chức (h1–h3) |
| **Font nội dung** | `Roboto, sans-serif` | Menu, body, nút bấm |

---

## Danh sách file cần sửa (6 file)

### 1. Design Token
- **tailwind.config.js** — Đổi primary sang đỏ, thêm gold, đổi font
- **index.css** — Cập nhật biến CSS, shadow, heading font
- **index.html** — Thêm Google Fonts (Noto Serif + Roboto)

### 2. Layout
- **layouts/Sidebar.tsx** — Logo đỏ, menu active đỏ, badge vàng
- **components/common/Header.tsx** — Avatar đỏ

### 3. Trang đăng nhập
- **features/auth/Login.tsx** — Header đỏ, nút đỏ, link đỏ, focus ring đỏ

---

> **Ghi chú**: Chỉ thay đổi giao diện, không ảnh hưởng logic/dữ liệu/API.
> Khi muốn thực hiện, gõ `/visualize` và nói "thực hiện kế hoạch redesign hcma".

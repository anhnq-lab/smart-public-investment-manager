# TÀI LIỆU MÔ TẢ ĐẶC TÍNH KỸ THUẬT VÀ TÍNH NĂNG PHẦN MỀM

## SMART PUBLIC INVESTMENT MANAGER (CIC.QLDA)
### Phần Mềm Quản Lý Đầu Tư Công Thông Minh

---

## MỤC LỤC

1. [Giới Thiệu Chung](#1-giới-thiệu-chung)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Mô Tả Các Module Chức Năng](#4-mô-tả-các-module-chức-năng)
5. [Cấu Trúc Dữ Liệu](#5-cấu-trúc-dữ-liệu)
6. [Yêu Cầu Hệ Thống](#6-yêu-cầu-hệ-thống)
7. [Hướng Dẫn Cài Đặt](#7-hướng-dẫn-cài-đặt)

---

## 1. GIỚI THIỆU CHUNG

### 1.1. Mục Đích
**Smart Public Investment Manager (CIC.QLDA)** là phần mềm quản lý đầu tư công thông minh, được thiết kế để hỗ trợ các Ban Quản Lý Dự Án (BQLDA) trong việc:

- Quản lý toàn bộ vòng đời dự án đầu tư công
- Theo dõi tiến độ thực hiện và giải ngân vốn
- Quản lý hợp đồng, nhà thầu và thanh toán
- Lưu trữ hồ sơ tài liệu theo chuẩn CDE/ISO 19650
- Xem mô hình BIM 3D trực tiếp trên web
- Tra cứu quy chế, quy định nội bộ

### 1.2. Phạm Vi Áp Dụng
Phần mềm áp dụng cho:
- Dự án đầu tư công sử dụng vốn ngân sách nhà nước
- Dự án sử dụng vốn nhà nước ngoài đầu tư công
- Dự án theo hình thức đối tác công tư (PPP)
- Các dự án khác theo quy định

### 1.3. Căn Cứ Pháp Lý
Phần mềm được xây dựng dựa trên:
- Luật Đầu tư công
- Luật Xây dựng (thay thế)
- Nghị định 175/NĐ-CP
- Nghị định 111/NĐ-CP
- Thông tư 06/2021/TT-BXD
- Thông tư 24/2025/TT-BXD
- Quyết định 409 - Suất vốn đầu tư 2025
- Sổ tay đầu tư công Hải Dương 2025
- QCVN về Phòng cháy chữa cháy (PCCC)

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────────┐
│                      GIAO DIỆN NGƯỜI DÙNG                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Dashboard  │ │  Projects   │ │  Documents  │ │  BIM Viewer ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Contracts  │ │  Employees  │ │   Reports   │ │ Regulations ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TẦNG DỊCH VỤ (SERVICES)                    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │ProjectService │ │ContractService│ │DocumentService│          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │EmployeeService│ │ PaymentService│ │  AuthService  │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TẦNG DỮ LIỆU (DATA LAYER)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Mock Data / API Integration                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. Cấu Trúc Thư Mục

```
CIC.QLDA/
├── components/           # Các thành phần giao diện
│   ├── Dashboard.tsx     # Trung tâm điều hành
│   ├── ProjectList.tsx   # Danh sách dự án
│   ├── ProjectDetail.tsx # Chi tiết dự án
│   ├── BIMViewer.tsx     # Xem mô hình BIM 3D
│   ├── DocumentManager.tsx # Quản lý tài liệu CDE
│   ├── ContractList.tsx  # Danh sách hợp đồng
│   ├── EmployeeList.tsx  # Quản lý nhân sự
│   ├── AIChatbot.tsx     # Trợ lý AI
│   ├── Regulations.tsx   # Quy chế nội bộ
│   └── ui/               # Các component UI dùng chung
├── services/             # Tầng dịch vụ
│   ├── ProjectService.ts
│   ├── ContractService.ts
│   ├── DocumentService.ts
│   ├── EmployeeService.ts
│   ├── PaymentService.ts
│   └── AuthService.ts
├── hooks/                # React Hooks tùy chỉnh
├── types/                # Định nghĩa kiểu dữ liệu TypeScript
├── context/              # React Context (Auth, State)
├── config/               # Cấu hình ứng dụng
├── utils/                # Hàm tiện ích
└── Doccument/            # Tài liệu pháp lý tham khảo
```

---

## 3. CÔNG NGHỆ SỬ DỤNG

### 3.1. Frontend Framework

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **React** | 19.2.3 | Thư viện xây dựng giao diện người dùng |
| **TypeScript** | ~5.8.2 | Ngôn ngữ lập trình có kiểu tĩnh |
| **Vite** | 6.2.0 | Công cụ build và dev server hiệu năng cao |
| **React Router DOM** | 7.10.1 | Điều hướng ứng dụng Single Page Application |

### 3.2. Thư Viện Giao Diện

| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| **Lucide React** | 0.561.0 | Bộ icon hiện đại, nhẹ |
| **Recharts** | 3.6.0 | Biểu đồ tương tác (AreaChart, PieChart, BarChart) |
| **TailwindCSS** | - | Framework CSS utility-first (inline styles) |

### 3.3. Công Nghệ 3D/BIM

| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| **Three.js** | 0.149.0 | Thư viện đồ họa 3D WebGL |
| **@types/three** | 0.182.0 | TypeScript definitions cho Three.js |
| **web-ifc-three** | 0.0.126 | Đọc và hiển thị file IFC (BIM) |

### 3.4. Tích Hợp AI

| Công nghệ | Mô tả |
|-----------|-------|
| **Google Gemini API** | Trợ lý AI thông minh hỗ trợ tư vấn |

---

## 4. MÔ TẢ CÁC MODULE CHỨC NĂNG

### 4.1. TRUNG TÂM ĐIỀU HÀNH (Dashboard)

**Mục đích:** Cung cấp cái nhìn tổng quan về tình hình thực hiện dự án đầu tư công.

**Các chức năng chính:**

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Thẻ thống kê tổng hợp** | Hiển thị tổng vốn đầu tư, giá trị giải ngân, giá trị nghiệm thu, cảnh báo rủi ro |
| 2 | **Biểu đồ giải ngân** | So sánh tiến độ giải ngân thực tế với kế hoạch theo tháng (AreaChart) |
| 3 | **Biểu đồ trạng thái dự án** | Phân loại dự án theo trạng thái: Chuẩn bị, Thực hiện, Hoàn thành, Vận hành (PieChart) |
| 4 | **Biểu đồ nhóm dự án** | Phân loại theo nhóm A, B, C và Quan trọng quốc gia |
| 5 | **Cảnh báo rủi ro** | Hiển thị các cảnh báo về ngân sách, tiến độ, pháp lý |
| 6 | **Công việc sắp đến hạn** | Danh sách các nhiệm vụ cần hoàn thành trong 7 ngày tới |
| 7 | **Nhà thầu chính** | Tóm tắt thông tin các nhà thầu đang thi công |

**Giao diện:**
- Header với chức năng tìm kiếm, thông báo, thông tin người dùng
- Bố cục responsive: 4 cột thẻ thống kê, 2/3 biểu đồ chính + 1/3 sidebar cảnh báo

---

### 4.2. QUẢN LÝ DỰ ÁN (Project Management)

**Mục đích:** Quản lý toàn bộ thông tin và vòng đời của các dự án đầu tư công.

#### 4.2.1. Danh Sách Dự Án (ProjectList)

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Hiển thị danh sách** | Bảng/thẻ hiển thị tổng quan các dự án |
| 2 | **Lọc và tìm kiếm** | Lọc theo trạng thái, nhóm, loại hình đầu tư |
| 3 | **Sắp xếp** | Theo tên, tổng mức đầu tư, tiến độ |
| 4 | **Thêm dự án mới** | Form nhập thông tin dự án |

#### 4.2.2. Chi Tiết Dự Án (ProjectDetail)

**Các tab chức năng:**

| Tab | Chức năng |
|-----|-----------|
| **Tổng quan** | Thông tin cơ bản, chỉ số tiến độ, biểu đồ |
| **Gói thầu** | Danh sách gói thầu thuộc dự án, trạng thái KHLCNT |
| **Hợp đồng** | Các hợp đồng đã ký, tiến độ thực hiện |
| **Công việc** | Quản lý task theo Kanban board, Gantt chart |
| **Tài liệu** | Hồ sơ pháp lý, thiết kế, nghiệm thu |
| **Nguồn lực** | Nhân sự tham gia, phân công RACI |
| **Ma trận RACI** | Phân công trách nhiệm theo giai đoạn dự án |
| **Vốn & Giải ngân** | Kế hoạch vốn, tiến độ giải ngân |
| **Mô hình BIM** | Xem mô hình 3D công trình |

**Chức năng nâng cao:**
- Đồng bộ dữ liệu với Cổng thông tin Quốc gia
- Tạo báo cáo giám sát, quyết toán tự động
- Upload và quản lý hồ sơ pháp lý
- Quản lý thành viên dự án

---

### 4.3. QUẢN LÝ GÓI THẦU (Package Management)

**Mục đích:** Quản lý chi tiết các gói thầu trong dự án.

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Thông tin gói thầu** | Mã TBMT, giá gói thầu, phương thức lựa chọn |
| 2 | **Tiến trình đấu thầu** | Trạng thái: Trong kế hoạch → Mời thầu → Xét thầu → Có KQLCNT |
| 3 | **Đánh giá sức khỏe** | Điểm số rủi ro, khuyến nghị hành động |
| 4 | **Quản lý vấn đề** | Ghi nhận và theo dõi issue phát sinh |
| 5 | **Tích hợp muasamcong.mpi.gov.vn** | Đồng bộ thông tin từ Cổng thông tin Đấu thầu |

---

### 4.4. QUẢN LÝ HỢP ĐỒNG (Contract Management)

**Mục đích:** Theo dõi và quản lý các hợp đồng xây dựng.

#### 4.4.1. Danh Sách Hợp Đồng (ContractList)

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Danh sách hợp đồng** | Hiển thị theo dạng bảng với filter |
| 2 | **Trạng thái hợp đồng** | Đang thực hiện, Tạm dừng, Đã thanh lý |
| 3 | **Giá trị, tỷ lệ tạm ứng** | Thông tin tài chính hợp đồng |

#### 4.4.2. Chi Tiết Hợp Đồng (ContractDetail)

| Tab | Chức năng |
|-----|-----------|
| **Thông tin chung** | Số hợp đồng, ngày ký, giá trị, thời hạn bảo hành |
| **Phụ lục hợp đồng** | Các PLHĐ, điều chỉnh giá trị/tiến độ |
| **Thanh toán** | Lịch sử thanh toán, tạo yêu cầu thanh toán mới |
| **Tiến độ** | Biểu đồ S-Curve, so sánh thực hiện/kế hoạch |

---

### 4.5. QUẢN LÝ THANH TOÁN (Payment Management)

**Mục đích:** Quản lý các đợt thanh toán và giải ngân.

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Danh sách thanh toán** | Hiển thị tất cả các đợt thanh toán |
| 2 | **Loại thanh toán** | Tạm ứng (Advance), Thanh toán khối lượng (Volume) |
| 3 | **Trạng thái** | Chờ duyệt (Pending), Đã chuyển tiền (Transferred) |
| 4 | **Mã giao dịch Kho bạc** | Liên kết với hệ thống Kho bạc Nhà nước |
| 5 | **Biểu mẫu 03a/04a** | Hỗ trợ các biểu mẫu kho bạc theo quy định |

---

### 4.6. QUẢN LÝ NHÀ THẦU (Contractor Management)

**Mục đích:** Quản lý thông tin các nhà thầu tham gia dự án.

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Danh sách nhà thầu** | Thông tin cơ bản, mã số thuế |
| 2 | **Chứng chỉ năng lực** | Mã chứng chỉ, hạng năng lực |
| 3 | **Nhà thầu nước ngoài** | Số giấy phép hoạt động |
| 4 | **Lịch sử tham gia** | Các dự án, gói thầu đã thực hiện |
| 5 | **Đánh giá nhà thầu** | Tiêu chí đánh giá hiệu suất |

---

### 4.7. QUẢN LÝ NHÂN SỰ (Employee Management)

**Mục đích:** Quản lý cán bộ, nhân viên Ban QLDA.

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Danh sách nhân viên** | Thông tin cơ bản, phòng ban, chức danh |
| 2 | **Phân quyền** | Admin, Manager, Staff |
| 3 | **Tình trạng** | Đang làm việc (Active), Nghỉ việc (Inactive) |
| 4 | **Phân công dự án** | Các dự án được phân công |
| 5 | **Xác thực** | Đăng nhập bằng Username/Password |

---

### 4.8. QUẢN LÝ TÀI LIỆU - CDE (Document Management)

**Mục đích:** Lưu trữ và quản lý hồ sơ theo tiêu chuẩn ISO 19650.

#### 4.8.1. Cấu Trúc Thư Mục CDE

```
Common Data Environment (CDE)
├── 01. Hồ sơ Pháp lý dự án
├── 02. Hồ sơ Thiết kế & Khảo sát
├── 03. Hồ sơ Đấu thầu
├── 04. Hồ sơ Quản lý chất lượng
└── 05. Hồ sơ Thanh quyết toán
```

#### 4.8.2. Trạng Thái Tài Liệu ISO 19650

| Mã | Trạng thái | Mô tả |
|----|------------|-------|
| S0 | WIP | Đang xử lý (Work in Progress) |
| S1 | Shared - Coordination | Chia sẻ - Phối hợp |
| S2 | Shared - Information | Chia sẻ - Thông tin |
| S3 | Shared - Review | Chia sẻ - Xem xét |
| A1 | Published - Construction | Phát hành - Thi công |
| A2 | Published - Handover | Phát hành - Bàn giao |
| A3 | Published - Asset Mgmt | Phát hành - Quản lý tài sản |
| B1 | Archived | Lưu trữ |

#### 4.8.3. Các Chức Năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Upload tài liệu** | Tải lên file từ máy tính |
| 2 | **Xem trước file** | Preview PDF, hình ảnh, video |
| 3 | **Ký số** | Tích hợp chữ ký số (USB Token/HSM) |
| 4 | **Quản lý phiên bản** | Lịch sử thay đổi, revision |
| 5 | **Quy trình phê duyệt** | Workflow duyệt tài liệu |
| 6 | **Tìm kiếm** | Tìm theo tên, loại, dự án |
| 7 | **Lọc theo danh mục** | Pháp lý, Chất lượng, Hoàn công, BIM |

---

### 4.9. XEM MÔ HÌNH BIM 3D (BIM Viewer)

**Mục đích:** Hiển thị và tương tác với mô hình BIM 3D công trình.

#### 4.9.1. Công Nghệ

- **Three.js**: Engine đồ họa 3D WebGL
- **OrbitControls**: Điều khiển xoay, zoom, pan camera
- **web-ifc-three**: Đọc file IFC (Industry Foundation Classes)

#### 4.9.2. Các Chức Năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Hiển thị mô hình demo** | Mô hình tòa nhà 5 tầng với các IFC element |
| 2 | **Upload file IFC** | Tải và hiển thị file IFC thực tế |
| 3 | **Điều khiển camera** | Xoay, phóng to/thu nhỏ, di chuyển |
| 4 | **Chọn đối tượng** | Click để chọn và highlight đối tượng |
| 5 | **Hiển thị/Ẩn lớp** | Toggle visibility theo loại (Wall, Slab, Door...) |
| 6 | **Model Tree** | Cây phân cấp các đối tượng trong mô hình |
| 7 | **Góc nhìn preset** | Top, Front, Right, Isometric |
| 8 | **Cắt mặt bằng** | Section plane để xem cắt công trình |
| 9 | **Đo kích thước** | Công cụ đo khoảng cách |
| 10 | **Reset view** | Trở về góc nhìn ban đầu |

#### 4.9.3. Màu Sắc IFC Elements

| Loại | Màu | Mô tả |
|------|-----|-------|
| IfcFooting | Xám đậm | Móng |
| IfcColumn | Nâu xám | Cột |
| IfcSlab | Xám nhạt | Sàn |
| IfcWall | Vàng kem | Tường |
| IfcWindow | Cyan | Cửa sổ |
| IfcDoor | Nâu | Cửa đi |
| IfcRoof | Đỏ | Mái |
| IfcBeam | Xám | Dầm |
| IfcStair | Xám nhạt | Cầu thang |

---

### 4.10. QUẢN LÝ CÔNG VIỆC (Task Management)

**Mục đích:** Theo dõi và phân công công việc trong dự án.

#### 4.10.1. Các Chế Độ Hiển Thị

| Chế độ | Mô tả |
|--------|-------|
| **Kanban Board** | Bảng công việc theo trạng thái (Todo, InProgress, Review, Done) |
| **Gantt Chart** | Biểu đồ tiến độ theo thời gian |
| **List View** | Danh sách công việc dạng bảng |

#### 4.10.2. Thuộc Tính Công Việc

| Trường | Mô tả |
|--------|-------|
| TaskID | Mã định danh |
| Title | Tiêu đề công việc |
| Description | Mô tả chi tiết |
| ProjectID | Dự án liên quan |
| AssigneeID | Người thực hiện |
| DueDate | Hạn hoàn thành |
| Status | Trạng thái |
| Priority | Mức độ ưu tiên (Low, Medium, High, Urgent) |
| LegalBasis | Căn cứ pháp lý |
| OutputDocument | Sản phẩm đầu ra |
| DurationDays | Số ngày thực hiện |
| PredecessorTaskID | Công việc tiền quyết |
| SubTasks | Công việc con |
| SyncStatus | Trạng thái đồng bộ quốc gia |

---

### 4.11. TRỢ LÝ AI (AI Chatbot)

**Mục đích:** Hỗ trợ người dùng tra cứu thông tin nhanh chóng.

#### 4.11.1. Công Nghệ
- **Google Gemini Pro API**: Mô hình ngôn ngữ lớn

#### 4.11.2. Các Chức Năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Hỏi đáp tự nhiên** | Nhập câu hỏi bằng ngôn ngữ tự nhiên |
| 2 | **Gợi ý câu hỏi** | Các câu hỏi mẫu phổ biến |
| 3 | **Tra cứu dữ liệu** | Tổng vốn đầu tư, tiến độ giải ngân... |
| 4 | **Cấu hình API Key** | Thiết lập Gemini API Key |

#### 4.11.3. Ví Dụ Câu Hỏi
- "Tổng vốn đầu tư bao nhiêu?"
- "Dự án nào lớn nhất?"
- "Tiến độ giải ngân hiện tại?"
- "Danh sách nhà thầu uy tín?"

---

### 4.12. QUY CHẾ NỘI BỘ (Regulations)

**Mục đích:** Tra cứu quy chế làm việc và phân công nhiệm vụ của Ban QLDA.

#### 4.12.1. Cấu Trúc Nội Dung

| Chương | Nội dung |
|--------|----------|
| Chương I | Những quy định chung |
| Chương II | Tổ chức bộ máy, chức năng nhiệm vụ |
| Chương III | Quy trình làm việc |
| ... | ... |

#### 4.12.2. Các Chức Năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Tìm kiếm** | Tìm theo từ khóa trong quy chế |
| 2 | **Điều hướng** | Mục lục, chuyển nhanh đến điều khoản |
| 3 | **Biểu đồ tổ chức** | Sơ đồ cơ cấu Ban QLDA |
| 4 | **Quy trình trình duyệt** | Flowchart các bước xử lý hồ sơ |
| 5 | **Bình luận** | Ghi chú, thảo luận về điều khoản |
| 6 | **Chi tiết phòng ban** | Nhiệm vụ cụ thể của từng phòng |

---

### 4.13. TRUNG TÂM BÁO CÁO (Report Center)

**Mục đích:** Tạo và xuất các báo cáo định kỳ.

| STT | Loại báo cáo | Mô tả |
|-----|--------------|-------|
| 1 | Báo cáo giám sát | Tình hình thực hiện dự án |
| 2 | Báo cáo quyết toán | Số liệu tài chính quyết toán |
| 3 | Báo cáo tiến độ | So sánh thực hiện với kế hoạch |
| 4 | Báo cáo rủi ro | Cảnh báo và phân tích rủi ro |

---

### 4.14. QUẢN LÝ VỐN (Capital Manager)

**Mục đích:** Theo dõi kế hoạch vốn và tiến độ giải ngân.

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | **Kế hoạch vốn năm** | Số quyết định, số tiền được giao |
| 2 | **Tiến độ giải ngân** | So sánh thực hiện với kế hoạch |
| 3 | **Nguồn vốn** | Phân loại theo nguồn (NSNN, ODA...) |
| 4 | **Biểu mẫu kho bạc** | Mẫu 03a, 04a |

---

## 5. CẤU TRÚC DỮ LIỆU

### 5.1. Bảng Dữ Liệu Chính

#### 5.1.1. Projects (Dự án)

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| ProjectID | CHAR(13) | Mã dự án (PK) |
| ProjectName | NVARCHAR(500) | Tên dự án |
| GroupCode | CHAR(2) | Nhóm dự án (QN, A, B, C) |
| InvestmentType | TINYINT | Loại hình đầu tư |
| TotalInvestment | DECIMAL(18,2) | Tổng mức đầu tư |
| CapitalSource | NVARCHAR(255) | Nguồn vốn |
| LocationCode | VARCHAR(10) | Mã địa điểm |
| ApprovalDate | DATE | Ngày phê duyệt |
| Status | TINYINT | Trạng thái |
| IsEmergency | BIT | Dự án cấp bách |

#### 5.1.2. BiddingPackages (Gói thầu)

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| PackageID | VARCHAR(20) | Mã gói thầu (PK) |
| ProjectID | CHAR(13) | Mã dự án (FK) |
| PackageNumber | VARCHAR(50) | Số hiệu gói thầu |
| PackageName | NVARCHAR(255) | Tên gói thầu |
| Price | DECIMAL(18,2) | Giá gói thầu |
| SelectionMethod | NVARCHAR(100) | Phương thức lựa chọn |
| Status | VARCHAR(20) | Trạng thái đấu thầu |

#### 5.1.3. Contracts (Hợp đồng)

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| ContractID | VARCHAR(50) | Mã hợp đồng (PK) |
| PackageID | VARCHAR(20) | Mã gói thầu (FK) |
| ContractorID | VARCHAR(20) | Mã nhà thầu (FK) |
| SignDate | DATE | Ngày ký |
| Value | DECIMAL(18,2) | Giá trị hợp đồng |
| AdvanceRate | DECIMAL(5,2) | Tỷ lệ tạm ứng |
| Warranty | INT | Thời hạn bảo hành (tháng) |
| Status | TINYINT | Trạng thái |

#### 5.1.4. Payments (Thanh toán)

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| PaymentID | INT | Mã thanh toán (PK) |
| ContractID | VARCHAR(50) | Mã hợp đồng (FK) |
| BatchNo | INT | Đợt thanh toán |
| Type | VARCHAR(20) | Loại (Advance/Volume) |
| Amount | DECIMAL(18,2) | Số tiền |
| TreasuryRef | VARCHAR(50) | Mã giao dịch kho bạc |
| Status | VARCHAR(20) | Trạng thái |

#### 5.1.5. Employees (Nhân viên)

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| EmployeeID | VARCHAR(20) | Mã nhân viên (PK) |
| FullName | NVARCHAR(100) | Họ và tên |
| Department | NVARCHAR(100) | Phòng ban |
| Position | NVARCHAR(100) | Chức vụ |
| Email | VARCHAR(100) | Email |
| Phone | VARCHAR(20) | Số điện thoại |
| Status | TINYINT | Tình trạng |
| Role | VARCHAR(20) | Vai trò hệ thống |
| Username | VARCHAR(50) | Tên đăng nhập |

#### 5.1.6. Documents (Tài liệu)

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| DocID | INT | Mã tài liệu (PK) |
| ReferenceID | VARCHAR(50) | Mã tham chiếu |
| ProjectID | CHAR(13) | Mã dự án (FK) |
| Category | TINYINT | Danh mục |
| DocName | NVARCHAR(255) | Tên tài liệu |
| StoragePath | NVARCHAR(500) | Đường dẫn lưu trữ |
| ISOStatus | VARCHAR(10) | Trạng thái ISO 19650 |
| Revision | VARCHAR(10) | Phiên bản |

### 5.2. Enum Values

#### 5.2.1. ProjectGroup (Nhóm dự án)

| Mã | Giá trị | Mô tả |
|----|---------|-------|
| QN | QN | Quan trọng quốc gia |
| A | A | Nhóm A |
| B | B | Nhóm B |
| C | C | Nhóm C |

#### 5.2.2. ProjectStatus (Trạng thái dự án)

| Mã | Giá trị | Mô tả |
|----|---------|-------|
| 1 | Preparation | Chuẩn bị đầu tư |
| 2 | Execution | Đang thực hiện |
| 3 | Finished | Hoàn thành |
| 4 | Operation | Vận hành |

#### 5.2.3. InvestmentType (Loại hình đầu tư)

| Mã | Giá trị | Mô tả |
|----|---------|-------|
| 1 | Public | Đầu tư công |
| 2 | StateNonPublic | Vốn nhà nước ngoài ĐTC |
| 3 | PPP | Đối tác công tư |
| 4 | Other | Khác |

#### 5.2.4. TaskPriority (Mức độ ưu tiên)

| Mã | Mô tả |
|----|-------|
| Low | Thấp |
| Medium | Trung bình |
| High | Cao |
| Urgent | Khẩn cấp |

---

## 6. YÊU CẦU HỆ THỐNG

### 6.1. Máy Chủ / Máy Phát Triển

| Thành phần | Yêu cầu tối thiểu |
|------------|-------------------|
| **Hệ điều hành** | Windows 10/11, macOS, Linux |
| **Node.js** | Phiên bản 18.x trở lên |
| **RAM** | 4 GB trở lên |
| **Ổ cứng** | 1 GB dung lượng trống |

### 6.2. Trình Duyệt Hỗ Trợ

| Trình duyệt | Phiên bản |
|-------------|-----------|
| Google Chrome | 90+ |
| Mozilla Firefox | 90+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |

### 6.3. Yêu Cầu Kết Nối

| Dịch vụ | Mô tả |
|---------|-------|
| Internet | Kết nối ổn định để sử dụng AI Chatbot |
| Gemini API Key | Bắt buộc cho tính năng AI |

---

## 7. HƯỚNG DẪN CÀI ĐẶT

### 7.1. Cài Đặt Dependencies

```bash
# Di chuyển vào thư mục dự án
cd CIC.QLDA

# Cài đặt các package
npm install
```

### 7.2. Cấu Hình Environment

Tạo hoặc chỉnh sửa file `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 7.3. Chạy Ứng Dụng

```bash
# Chế độ phát triển
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

### 7.4. Truy Cập Ứng Dụng

Sau khi chạy `npm run dev`, mở trình duyệt và truy cập:

```
http://localhost:5173
```

---

## PHỤ LỤC

### A. Danh Sách Components

| Component | Đường dẫn | Mô tả |
|-----------|-----------|-------|
| AIChatbot | components/AIChatbot.tsx | Trợ lý AI |
| BIMViewer | components/BIMViewer.tsx | Xem mô hình 3D |
| CapitalManager | components/CapitalManager.tsx | Quản lý vốn |
| CDEManager | components/CDEManager.tsx | Quản lý CDE |
| ContractDetail | components/ContractDetail.tsx | Chi tiết hợp đồng |
| ContractList | components/ContractList.tsx | Danh sách hợp đồng |
| ContractorDetail | components/ContractorDetail.tsx | Chi tiết nhà thầu |
| ContractorList | components/ContractorList.tsx | Danh sách nhà thầu |
| Dashboard | components/Dashboard.tsx | Trung tâm điều hành |
| DocumentManager | components/DocumentManager.tsx | Quản lý tài liệu |
| EmployeeDetail | components/EmployeeDetail.tsx | Chi tiết nhân viên |
| EmployeeList | components/EmployeeList.tsx | Danh sách nhân viên |
| Login | components/Login.tsx | Đăng nhập |
| PackageDetail | components/PackageDetail.tsx | Chi tiết gói thầu |
| PaymentList | components/PaymentList.tsx | Danh sách thanh toán |
| ProjectDetail | components/ProjectDetail.tsx | Chi tiết dự án |
| ProjectList | components/ProjectList.tsx | Danh sách dự án |
| Regulations | components/Regulations.tsx | Quy chế nội bộ |
| ReportCenter | components/ReportCenter.tsx | Trung tâm báo cáo |
| Sidebar | components/Sidebar.tsx | Menu điều hướng |
| TaskDetail | components/TaskDetail.tsx | Chi tiết công việc |
| TaskList | components/TaskList.tsx | Danh sách công việc |

### B. Danh Sách Services

| Service | Đường dẫn | Mô tả |
|---------|-----------|-------|
| AuthService | services/AuthService.ts | Xác thực & phân quyền |
| CapitalService | services/CapitalService.ts | Quản lý vốn |
| ContractService | services/ContractService.ts | Quản lý hợp đồng |
| ContractorService | services/ContractorService.ts | Quản lý nhà thầu |
| DocumentService | services/DocumentService.ts | Quản lý tài liệu |
| EmployeeService | services/EmployeeService.ts | Quản lý nhân sự |
| NationalGatewayService | services/NationalGatewayService.ts | Đồng bộ CSDL quốc gia |
| PaymentService | services/PaymentService.ts | Quản lý thanh toán |
| ProjectService | services/ProjectService.ts | Quản lý dự án |
| taskService | services/taskService.ts | Quản lý công việc |
| taskTemplates | services/taskTemplates.ts | Template công việc |

---

**Ngày cập nhật:** 04/01/2026  
**Phiên bản tài liệu:** 1.0  
**Người biên soạn:** CIC - Trung tâm Công nghệ Thông tin

---

*© 2026 Smart Public Investment Manager. All rights reserved.*

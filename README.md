# PathSync-AI

PathSync-AI là một nền tảng lập kế hoạch du học và hỗ trợ chuẩn bị hồ sơ ứng tuyển, với cốt lõi là Cố vấn AI (Persona Lab) tích hợp sâu vào quy trình (Human-in-the-loop). 

Dự án không chỉ đơn thuần là một công cụ chat, mà AI được nhúng vào quy trình: AI phân tích mục tiêu, tư vấn, trích xuất dữ liệu, cung cấp trích dẫn nguồn (Citations) và **đề xuất hành động (Proposed Actions)** để người dùng xác nhận và lưu vào hệ thống quản lý (Kanban Board).

## Mục tiêu Dự án
- Xây dựng một không gian làm việc (Workspace) cá nhân hóa cho học sinh.
- Rút ngắn thời gian tìm kiếm thông tin trường học bằng cách cung cấp dữ liệu minh bạch, có nguồn gốc rõ ràng.
- Sử dụng AI để đồng hành, gợi ý và lên lộ trình hồ sơ, nhưng quyết định cuối cùng và thao tác cập nhật dữ liệu luôn thuộc về người dùng (Human-in-the-loop).

## Kiến trúc Hệ thống (4 Tầng)
Dự án được chia thành 4 tầng kiến trúc rõ rệt:
1. **Layer 1 (Frontend)**: Ứng dụng React/Vite, xử lý UI/UX, giao tiếp với backend và render các cấu trúc phản hồi phức tạp từ AI.
2. **Layer 2 (Backend Services)**: Hệ thống Microservices viết bằng Golang (Gin), gồm: `api-gateway`, `auth-service`, `application-service`, `university-service`, `document-service`, `ai-agent-service`.
3. **Layer 3 (AI Pipeline)**: Trái tim thông minh của hệ thống (`ai-agent-service`), tích hợp mô hình Gemini để phân tích ngữ nghĩa, gọi Tool (Lấy danh sách trường, lập roadmap) và trả về format chuẩn.
4. **Layer 4 (Data Layer)**: Cơ sở dữ liệu SQLite/PostgreSQL lưu trữ profile, Kanban board và thông tin trường học crawl từ các trang chính thức.

---

## Hướng dẫn Cài đặt & Chạy Dự án (Run Demo)

Để chạy được toàn bộ dự án với đầy đủ tính năng (đặc biệt là tính năng Cố vấn AI), bạn làm theo các bước dưới đây. Nên chạy từng Service trên các cửa sổ Terminal riêng biệt để dễ dàng theo dõi log.

### 1. Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (Khuyên dùng v18 hoặc mới hơn).
- [Golang](https://go.dev/) (Khuyên dùng v1.21 hoặc mới hơn).
- Môi trường bash/terminal (Git Bash trên Windows, hoặc Terminal trên macOS/Linux).
- Một Gemini API Key hợp lệ (lấy từ [Google AI Studio](https://aistudio.google.com/)).

### 2. Khởi động Backend (Microservices)
Bạn cần mở 5 cửa sổ Terminal khác nhau để chạy các service cốt lõi. Trong thư mục gốc của dự án, lần lượt chạy:

**Terminal 1 (API Gateway - Port 8000)**:
```bash
cd backend/api-gateway
go run main.go
```

**Terminal 2 (Auth Service - Port 8001)**:
```bash
cd backend/auth-service
go run main.go
```

**Terminal 3 (Application Service - Port 8002)**:
```bash
cd backend/application-service
go run handlers/application.go # Hoặc go run main.go nếu đã gộp
```

**Terminal 4 (University Service - Port 8004)**:
```bash
cd backend/university-service
go run main.go
```

**Terminal 5 (AI Agent Service - Port 8005)**:
*Lưu ý: Bắt buộc phải có `GEMINI_API_KEY` để AI hoạt động.*
```bash
cd backend/ai-agent-service
export GEMINI_API_KEY="AIzaSy_Gõ_Key_Của_Bạn_Vào_Đây"
go run main.go
```
*(Nếu dùng PowerShell trên Windows: `$env:GEMINI_API_KEY="AIzaSy..."`)*

### 3. Khởi động Frontend
Mở **Terminal 6**:
```bash
cd frontend
npm install
npm run dev
```

### 4. Trải nghiệm
- Mở trình duyệt tại địa chỉ: `http://localhost:5173`.
- Bấm **"Khám phá workspace mẫu"** để vào thẳng giao diện mà không cần tạo tài khoản.
- Truy cập vào tính năng **Cố vấn AI (Persona Lab)** ở menu bên trái.
- Bắt đầu chat với Cố vấn (VD: *"Tìm cho mình trường có ngành Khoa học máy tính"*).
- Xem cách AI trả về Trích dẫn (Citations), và quan trọng nhất là click vào các nút **Xác nhận** tại các block *Hành động đề xuất (Proposed Actions)* để đưa thông tin trường vào Kanban Board (Board Hồ sơ).

---

## Cấu trúc Thư mục

```text
PathSync-AI/
├── frontend/               # Mã nguồn React (Tầng 1)
│   ├── src/pages/          # Các màn hình chính (PersonaLabPage.jsx, ...)
│   ├── src/context/        # Global state (Auth, ...)
│   └── src/services/       # API integration
├── backend/                # Mã nguồn Golang Microservices (Tầng 2 & 3)
│   ├── api-gateway/        # Cổng định tuyến API
│   ├── ai-agent-service/   # Xử lý Logic AI (Orchestrator, Tools)
│   ├── university-service/ # API tra cứu trường, crawler dữ liệu gốc
│   ├── application-service/# Quản lý Kanban board hồ sơ
│   ├── auth-service/       # Quản lý người dùng
│   └── document-service/   # (Đang phát triển) Xử lý OCR/PDF
└── docs/                   # Tài liệu chi tiết kiến trúc (1, 2, 3, 4)
```

Xem thêm tài liệu chi tiết trong thư mục `docs/`.

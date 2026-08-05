# 🚀 PATHSYNC AI - HƯỚNG DẪN VẬN HÀNH & NĂNG LỰC HỆ THỐNG (SYSTEM USER GUIDE)

Tài liệu này tổng hợp toàn bộ Kiến trúc Microservices, Tài khoản Test, Hướng dẫn khởi chạy và Cách sử dụng chi tiết tất cả các tính năng của dự án **PathSync AI - Nền tảng Du học Thông minh**.

---

## 📌 1. TỔNG QUAN KIẾN TRÚC MICROSERVICES

Hệ thống được thiết kế theo kiến trúc **Microservices (Go Backend)** kết hợp **Vite React Frontend**, đảm bảo tính mô-đun hóa, khả năng mở rộng cao và độ tin cậy tuyệt đối:

| Dịch vụ Backend | Cổng (Port) | Cơ sở dữ liệu SQLite | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8000` | N/A | Điều hướng API request từ Frontend tới các Microservices |
| **Auth Service** | `8001` | `auth.db` | Định danh User, JWT Token, Phân quyền Roles & Booking Mentor |
| **AI Service** | `8002` | N/A | Chấm điểm bài luận, Smart Match AI & Gemini Multi-Key Rotation Pool |
| **Document Service** | `8003` | `document.db` | Lưu trữ file PDF/DOCX, Bóc tách CV & Lịch sử bản nháp SOP History |
| **University Service** | `8004` | `university.db` | CSDL 72+ trường đại học, Web Crawler & Smart Seeding Fallback |
| **AI Agent Service** | `8005` | `pathsync-agent.db` | Luồng Multi-Agent Swarm 5 Sub-Agents, Live Stream & Session Log |

---

## 🔑 2. TÀI KHOẢN THỬ NGHIỆM (TEST ACCOUNTS)

Hệ thống đã có sẵn 3 loại tài khoản đại diện cho 3 Vai trò (Roles) trong dự án:

1. 🎓 **Học sinh (Role Student)**:
   - Email: `student@pathsync.ai`
   - Mật khẩu: `Student123!@#`
   - *Giao diện*: Xem Bảng lộ trình Kanban, Viết luận SOP, Smart Match, Tải CV, Đặt lịch Mentor.

2. 👨‍🏫 **Cố vấn Du học (Role Mentor)**:
   - Email: `mentor@pathsync.ai`
   - Mật khẩu: `Mentor123!@#`
   - *Giao diện*: Sidebar tối giản (1 Menu Portal duy nhất), Thống kê số lượng học sinh chờ duyệt/đang cố vấn, Xem hồ sơ & bài luận nháp của học sinh, Gửi tin nhắn Inbox trực tiếp.

3. 🛡️ **Quản trị viên (Role Admin)**:
   - Email: `admin@pathsync.ai`
   - Mật khẩu: `Admin123!@#`
   - *Giao diện*: Sidebar tối giản, Thống kê 4 thẻ chỉ số tổng quan, Quản lý tài khoản & phân quyền, Kích hoạt Crawler dữ liệu nguồn chính thức (`US News 2026 / Official Portal`), Giám sát sức khỏe 5 Backend Services.

---

## 🚀 3. HƯỚNG DẪN KHỞI CHẠY DỰ ÁN (QUICK START)

### Bước 1: Khởi chạy toàn bộ Go Backend Services
Mở cửa sổ Terminal (PowerShell / Command Prompt) tại thư mục gốc dự án:
```powershell
cd backend
.\start.bat
```
*(Lệnh này sẽ tự động biên dịch và khởi động 5 Microservices + API Gateway trên các Cổng 8000 - 8005)*.

### Bước 2: Khởi chạy React Vite Frontend
Mở một cửa sổ Terminal khác tại thư mục `frontend`:
```powershell
cd frontend
npm run dev
```
Truy cập giao diện Web tại địa chỉ: **`http://localhost:5173`**

---

## 🌟 4. HƯỚNG DẪN CHI TIẾT CÁC TÍNH NĂNG CHÍNH

### 1. 📌 Bảng Quản Lý Hồ Sơ Kanban (`/applications`)
- **Giao diện**: Được việt hóa 100% (Cần làm, Đang xử lý, Hoàn thành).
- **Hạng mục công việc động (Dynamic Subtasks)**: Mỗi trường học tự động có các hạng mục công việc chuẩn hóa theo chuyên ngành (SOP, LOR, GRE/GMAT, Portfolio, Visa).
- **Tương tác thông minh**: Bấm trực tiếp vào từng hạng mục công việc để mở Trợ lý SOP, Hướng dẫn LOR hoặc chuyển sang Quản lý Tài Liệu.
- **Auto-Check Completed**: Bấm nút **`Hoàn Thành & Đóng`** trong Popup bài luận sẽ tự động đánh dấu hoàn thành (tick xanh ✅) và cập nhật thanh Tiến độ.

### 2. 🤖 Trợ Lý Viết Luận SOP & Chấm Điểm AI (`/essay-copilot`)
- Đánh giá bài luận trên thang điểm 100 dựa trên **4 tiêu chí tuyển sinh**: Structure, Authenticity, Impact và Alignment with Prompt.
- Hỗ trợ lưu nhiều phiên bản nháp (**Draft History V1, V2...**) để học sinh khôi phục lại bất kỳ lúc nào.

### 3. 🎯 Gợi Ý Trường Thông Minh Smart Match AI (`/smart-match`)
- Phân tích độ tương thích giữa hồ sơ ứng viên (GPA, IELTS, Ngành mong muốn, Khu vực) với CSDL các trường.
- Hiển thị **Thanh tổng quan tiêu chí đang lọc** và **Bóc tách điểm chi tiết**: Học thuật (Academic Fit), Tài chính (Financial Fit), Chuyên ngành (Program Fit).

### 4. 📄 Tài Liệu Của Tôi & Trích Xuất CV (`/documents`)
- Cho phép upload các file PDF, DOCX chứng chỉ và học bạ.
- Bấm nút **`✨ Trích Xuất CV & Đồng Bộ Smart Match`** để AI tự động đọc file CV và cập nhật chỉ số năng lực sang thuật toán gợi ý trường.

### 5. ⚡ Multi-Agent Swarm Workstream (`/agent-stream`)
- Mô phỏng luồng làm việc song song của **5 AI Sub-Agents** (Profiler, Crawler, Matching Engine, Scholarship Matcher, Strategy Advisor).
- Nút đề xuất từ Swarm tự động mở **1-Click Booking Modal** với Mentor Nguyễn Minh Anh (Harvard Alumni).

### 6. 🏛️ Khám Phá Trường Đại Học & Web Link Chính Thức (`/universities`)
- Bấm vào chi tiết bất kỳ trường học nào để xem:
  - 🌐 **Nút bấm Trang Web Chính Thức**: Mở trực tiếp website chính chủ `.edu` của trường.
  - 🔗 **Link nguồn cào dữ liệu gốc**: Trỏ trực tiếp đến trang xếp hạng uy tín US News 2026.
  - 📊 Tỷ lệ trúng tuyển (Acceptance Rate), Hạn nộp hồ sơ, Học phí dự kiến và Chương trình đào tạo / Học bổng đi kèm.

---

## 🛠️ 5. CƠ CHẾ DỰ PHÒNG & XỬ LÝ LỖI (FALLBACK MECHANISMS)

1. **Smart Seeding Fallback (Trường học bị trống)**:
   Nếu trình cào dữ liệu gặp sự cố mạng khi gọi LLM ngoài, `university-service` sẽ tự động kích hoạt hàm `SeedProgramsForEmptyUniversities()` để gieo mầm dữ liệu dự phòng chất lượng cao, đảm bảo giao diện luôn hiển thị đầy đủ thông tin cho người dùng.

2. **Gemini Multi-Key Rotation Pool**:
   Trường hợp 1 API Key của Gemini bị dính Rate Limit (HTTP 429), `ai-service` sẽ tự động xoay vòng ngầm sang các API Key backup khác trong file `.env` mà không làm gián đoạn trải nghiệm người dùng.

---
*Bản quyền tài liệu thuộc về Antigravity Agentic Engineering Team - PathSync AI.*

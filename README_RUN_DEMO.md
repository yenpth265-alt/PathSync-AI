# 🚀 PathSync-AI: Hướng Dẫn Khởi Chạy Dự Án & Kịch Bản Demo

PathSync-AI là nền tảng hỗ trợ du học thông minh, tự động hóa tra cứu thông tin trường đại học, học bổng chuẩn xác từ các trang nguồn chính thức bằng AI Crawler, tích hợp trợ lý AI đồng hành cùng học sinh trong suốt hành trình ứng tuyển.

---

## 🏗️ 1. Kiến Trúc Hệ Thống (Microservices)

Hệ thống được thiết kế theo kiến trúc **Microservices** hiện đại:

- **Frontend**: React (Vite) + Framer Motion + Lucide Icons (`http://localhost:5173`)
- **API Gateway**: Quản lý định tuyến và CORS tập trung (`http://localhost:8000`)
- **Auth Service**: Đăng ký, Đăng nhập, Xác thực OTP (`http://localhost:8001`)
- **User Service**: Quản lý Hồ sơ cá nhân (`http://localhost:8002`)
- **University Service**: Tra cứu Trường, Ngành học, Học bổng & AI Crawler (`http://localhost:8003`)
- **Application Service**: Bảng Kanban Quản lý Hồ sơ & SOP Editor (`http://localhost:8004`)
- **AI Service**: Tích hợp Ollama / LLM Cloud (`gpt-oss:120b-cloud`) cho Smart Match, Essay Copilot, AI Mentor (`http://localhost:8005`)
- **Document Service**: Quản lý tệp tài liệu du học (`http://localhost:8006`)

---

## 💻 2. Hướng Dẫn Khởi Chạy Dễ Dàng

### Bước 1: Chạy toàn bộ 7 Microservices Backend
Chúng mình đã chuẩn bị sẵn script khởi chạy tự động toàn bộ Backend trong 1 click:

1. Mở terminal tại thư mục gốc dự án `PathSync-AI`.
2. Chạy file batch:
   ```bash
   .\backend\start.bat
   ```
3. Script sẽ tự động mở 7 cửa sổ CMD tương ứng với 7 dịch vụ microservices. Bạn có thể dễ dàng theo dõi log hệ thống ở các cửa sổ này.

### Bước 2: Chạy ứng dụng Frontend
1. Mở một terminal mới:
   ```bash
   cd frontend
   npm run dev
   ```
2. Truy cập ứng dụng tại trình duyệt: `http://localhost:5173`

---

## 🎯 3. Kịch Bản Demo Chi Tiết (Demo Script)

### A. Demo Role User / Học Sinh
1. **Đăng Ký & Xác Thực OTP**:
   - Bấm **Đăng ký** -> Nhập Tên, Email, Mật khẩu.
   - Nhập mã OTP (Mã OTP được hiển thị trực tiếp trên giao diện/terminal để thuận tiện cho việc test nhanh).
2. **Khám Phá Trường Đại Học (`/universities`)**:
   - Truy cập menu **Khám phá Trường**.
   - Tìm kiếm các trường top đầu (VD: *Harvard University*, *MIT*, *NUS*...).
   - Click vào một trường bất kỳ để mở **Detail Modal**: Xem Học phí ($/năm), Hạn nộp (Deadline), Yêu cầu GPA/IELTS, và các gói Học bổng.
   - Click nút **"Thêm vào Hồ Sơ"** ngay tại modal.
3. **Quản Lý Hồ Sơ Kanban (`/applications`)**:
   - Chuyển sang menu **Quản lý Hồ sơ**.
   - Kéo thả các thẻ trường qua các cột: *Target* -> *In Progress* -> *Submitted* -> *Result*.
   - Mở chi tiết thẻ để chỉnh sửa bài luận SOP và dùng tính năng **AI Review / Assist**.
4. **Gợi Ý Thông Minh (`/smart-match`)**:
   - Nhập GPA (VD: `3.8`), IELTS (VD: `7.5`), Ngành học (*Computer Science*).
   - Bấm **Phân tích với AI**: Hệ thống sẽ tự động phân loại danh sách các trường thành 3 nhóm: *Safe (An toàn)*, *Target (Phù hợp)*, *Reach (Thử thách)*.
5. **Cố Vấn AI Mentor (`/persona-lab`)**:
   - Trò chuyện trực tiếp với AI Mentor để định hình mục tiêu cá nhân và xây dựng cây kỹ năng du học.

---

### B. Demo Role Admin / Quản Trị Viên
1. **Chuyển Vai Trò Admin**:
   - Đăng nhập bằng tài khoản có quyền Admin (hoặc đổi role từ bảng Admin Dashboard).
2. **Trang Quản Trị (`/admin`)**:
   - Xem bảng thống kê tổng quan (Tổng người dùng, Số trường đã đồng bộ, Trạng thái Microservices).
   - **Quản lý Trường & Học Bổng**: Xem Bảng dữ liệu thực tế (Data Table) của các trường đã được cào về. Thêm trường/học bổng mới qua Popup Modal.
   - **Kích Hoạt AI Official Crawler**: Bấm nút *"Kích hoạt Crawler Nguồn Gốc"* để hệ thống AI tự động quét dữ liệu tuyển sinh chính thức ở background.

---

## 🏆 Chúc Bạn Có Buổi Demo Rực Rỡ & Thành Công! 🚀

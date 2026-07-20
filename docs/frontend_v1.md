# PathSync AI - Frontend Version 1.0 (Premium UI)

Tài liệu này mô tả chi tiết về cấu trúc, công nghệ và các tính năng của giao diện người dùng (Frontend) phiên bản 1.0 của ứng dụng PathSync AI.

## 1. Công nghệ & Thông số kỹ thuật (Tech Stack)
- **Core Framework:** React 18 + Vite (Javascript).
- **Routing:** `react-router-dom` v6 (Kiến trúc Single Page Application - SPA).
- **Styling:** 
  - Pure / Vanilla CSS. 
  - Áp dụng triệt để CSS Variables (Design Tokens) làm source-of-truth cho theme.
  - Ngôn ngữ thiết kế: **Premium Glassmorphism** (Mờ ảo, đổ bóng mềm, viền kính).
- **Animation & Transitions:** `framer-motion` (Page transitions, Stagger animations).
- **Data Visualization:** `recharts` (Responsive charts).
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (Cho Kanban Board).
- **Icons:** `lucide-react`.

## 2. Hệ thống Theme & Responsive
### 2.1. Light / Dark Mode
Hệ thống sử dụng CSS Variables để quản lý toàn bộ mã màu. Có một nút gạt (Toggle) ở Sidebar cho phép chuyển đổi tức thì giữa 2 chế độ:
- **Light Mode:** Tone màu trắng - xám nhạt (`#f8fafc`) thanh lịch, viền kính xám nhạt.
- **Dark Mode (Midnight Blue):** Tone màu xanh đen sâu (`#0b1120`), tạo cảm giác "tươi tắn", công nghệ cao và cao cấp tương tự giao diện của Vercel hay Linear. Các thành phần được cân chỉnh màu sắc để đảm bảo độ tương phản (Contrast) hoàn hảo.

### 2.2. Responsive Design
- Ứng dụng hỗ trợ tốt trên đa thiết bị (Desktop, Tablet, Mobile).
- **Mobile View (<768px):** Sidebar sẽ tự động chuyển đổi thành dải điều hướng linh hoạt, các Layout dạng Grid (như Bento box ở Dashboard) sẽ tự động xếp chồng (stack) thành 1 cột. Bảng Kanban hỗ trợ vuốt ngang (horizontal scroll).

## 3. Chức năng chi tiết các trang (Pages)

### 3.1. Dashboard (`/`)
Trang tổng quan dạng **Bento Grid** hiện đại, bao gồm:
- **Next Deadline:** Thẻ Highlight làm nổi bật hạn chót sắp tới bằng dải gradient bắt mắt.
- **Stat Cards:** Các chỉ số cơ bản (Target Schools, Overall Readiness).
- **Readiness Over Time:** Biểu đồ dạng vùng (Area Chart) vẽ bằng Recharts để theo dõi tiến độ. Tích hợp tính năng Toggle giữa "Xem số liệu thu gọn" và "Xem biểu đồ chi tiết".
- **Task Status:** Biểu đồ tròn (Pie Chart) hiển thị tỷ lệ trạng thái công việc hiện tại.
- **Quick Actions:** Nút thao tác nhanh để review bài luận hoặc tìm trường.

### 3.2. Applications (`/applications`)
Hệ thống theo dõi hồ sơ dạng **Kanban Board**, bao gồm:
- **Stat Cards:** 4 thẻ thống kê ở trên cùng (Tổng hồ sơ, Đang xử lý, Hoàn thành, Hạn chót khẩn cấp).
- **Bảng kéo thả (Drag & Drop):** Các cột (To Do, In Progress, Completed).
- **Kanban Cards:** Mỗi thẻ hồ sơ chứa thông tin chi tiết: Tên trường, Quốc gia, Loại hồ sơ (Học bổng/Early Action), Hạn chót (có cảnh báo đỏ nếu gấp), Thanh tiến độ (Progress bar).
- **Sub-tasks:** Bên trong mỗi thẻ có danh sách công việc con (Checklist) với trạng thái hoàn thành trực quan.

### 3.3. Documents (`/documents`)
Khu vực quản lý giấy tờ ứng tuyển:
- Giao diện Grid các thẻ tài liệu (Personal Statement, Letter of Recommendation, CV, Transcript).
- Hiệu ứng xuất hiện lần lượt (Stagger Animation) mượt mà.
- Mỗi tài liệu có badge trạng thái (Ready, Needs Review, Processing), loại tài liệu, và ngày cập nhật gần nhất.

### 3.4. Universities (`/universities`)
Trang tra cứu các trường đại học mục tiêu:
- Danh sách các trường hiển thị với hiệu ứng Stagger.
- Cung cấp thông tin quan trọng: Acceptance Rate (Tỷ lệ đỗ), Tuition (Học phí), Location (Địa điểm).
- Điểm đặc biệt: Có điểm đánh giá **Match Score** (Độ phù hợp) với 3 nhãn (Safety, Target, Reach).

### 3.5. Essay Copilot (`/essay-copilot`)
Trợ lý AI viết luận với giao diện **Split-screen** (chia đôi màn hình):
- **Bên trái (Editor):** Khung văn bản mô phỏng trang giấy trắng truyền thống (font Times New Roman), nơi người dùng soạn thảo bài luận.
- **Bên phải (Chat):** Khung chat AI, nơi người dùng có thể yêu cầu AI nhận xét, sửa lỗi ngữ pháp hoặc gợi ý ý tưởng. Giao diện chat chuẩn mực với bọt thoại (chat bubble) phân biệt rõ ràng giữa User và AI.

### 3.6. Smart Match AI (`/smart-match`)
Công cụ tìm trường bằng AI với giao diện **Multi-step Wizard**:
- Thu thập hồ sơ học thuật: GPA, IELTS/TOEFL.
- Thu thập nguyện vọng: Chuyên ngành, Vị trí địa lý.
- **Animation Phân tích AI:** Hiệu ứng radar quét giả lập quá trình AI đang phân tích dữ liệu 4,200+ trường.
- Hiển thị kết quả: Đề xuất top 3 trường phù hợp nhất kèm tỷ lệ Match Score và loại trường (Reach/Target/Safety).

## 4. Tổng kết
Frontend Version 1.0 đã hoàn thiện bộ khung UI/UX ở mức độ "Premium". Khắc phục mọi lỗi liên quan đến Dark/Light mode, Responsive. Sẵn sàng tích hợp API từ Backend để đưa dữ liệu thật vào hệ thống.

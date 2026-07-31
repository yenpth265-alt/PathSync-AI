# Tầng 1: Client Layer (Frontend React)

Tài liệu thiết kế Tầng 1 - Giao diện người dùng (UI/UX) của PathSync-AI.

## 1. Công nghệ
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS & Vanilla CSS (tùy chỉnh sâu)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 2. Luồng UI chính (Main Workflows)
- **Onboarding**: Người dùng mới bắt buộc phải điền form Onboarding. Nếu cố gắng truy cập trang khác, sẽ bị redirect thông qua `ProtectedRoute`.
- **Persona Lab**: Giao diện chat với AI, chia đôi màn hình:
  - Nửa trái: Chat với AI Mentor. Khung chat phân tích và hiển thị linh hoạt các `citations` (nguồn trích dẫn), `safety_notice` (cảnh báo) và `proposedActions` (Hành động đề xuất).
  - Nửa phải: Story Canvas, vẽ ra các điểm sáng của người dùng.
- **Universities / Explore**: Nơi người dùng tìm kiếm thông tin trường đại học tĩnh hoặc thông qua trợ lý.
- **Kanban Board (Applications)**: Nơi học sinh kéo thả và theo dõi tiến độ nộp hồ sơ. Nhận dữ liệu sinh ra từ `ProposedActions` của AI (Layer 1 -> 4).

## 3. Kiến trúc Components
- Các trang được tách riêng biệt trong thư mục `src/pages`.
- Các hook và Auth logic nằm tại `src/context/AuthContext.jsx`.
- Gọi API tập trung tại `src/services/api.js`.

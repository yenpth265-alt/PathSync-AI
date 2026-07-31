# Tầng 3: AI & Integration Layer (AI Agent Pipeline)

Đây là tài liệu kiến trúc của Tầng 3 (AI Pipeline) trong hệ thống PathSync-AI, chịu trách nhiệm cho mọi tương tác thông minh.

## 1. Mục Tiêu (Objective)
Cung cấp một "AI Admissions Counselor" (Cố vấn Tuyển sinh AI) thông qua một Orchestrator. AI này không "ảo tưởng" (hallucinate) thông tin về học phí, hạn nộp, hay thứ hạng trường mà bắt buộc phải sử dụng các Tool (Công cụ) để lấy dữ liệu từ Layer 4 thông qua Layer 2.

## 2. Các Thành Phần Chính
- **LLM Orchestrator (`ai-agent-service`)**: Sử dụng mô hình `gemini-1.5-flash` để trò chuyện và lập luận.
- **Workflow / Agent Loop**: Không dùng ReAct truyền thống (vì kém ổn định). Hệ thống tự phát hiện ý định (`intent`) qua regex nhanh, phân luồng:
  - `university_search`: Gọi Tool tìm kiếm trường học (`university-service`).
  - `roadmap`: Gọi Tool khởi tạo checklist lộ trình du học.
  - `converse`: Trò chuyện thông thường (thu thập mục tiêu của học sinh vào `Story Canvas`).
- **Tools**:
  - `search_universities`: Tìm kiếm chương trình học dựa trên ngành, ngân sách, quốc gia.
  - `generate_roadmap_tasks`: Lập lộ trình từ năm hiện tại đến thời điểm nhập học mục tiêu.

## 3. Human-in-the-Loop (Xác nhận hành động)
AI **không bao giờ tự ý sửa đổi Database**. Thay vào đó, AI trả về một mảng `ProposedActions`.
Frontend sẽ render mảng này thành các nút bấm "Xác nhận". Khi người dùng ấn nút, frontend mới gửi API request cập nhật dữ liệu. Điều này đảm bảo an toàn hệ thống và cho phép người dùng tùy chỉnh/từ chối quyết định của AI.

## 4. Dữ liệu Đầu ra (AgentResponse Schema)
AI phản hồi bằng cấu trúc JSON chặt chẽ:
- `reply`: Câu thoại trả về cho người dùng.
- `citations`: Trích dẫn nguồn thông tin gốc (tăng tính minh bạch).
- `proposed_actions`: Hành động đề xuất.
- `nodes`: Các điểm sáng được rút ra từ câu chuyện của người dùng (Persona Lab).
- `safety_notice`: Cảnh báo trách nhiệm.

# AI Agent Flow

Tài liệu này mô tả luồng của `backend/ai-agent-service`, tức lớp agent điều phối tool và sinh câu trả lời cuối cùng cho các tình huống tư vấn du học.

## Vai trò của agent

Agent không phải là một chatbot chung chung. Nó nên đóng vai trò:

- tư vấn định hướng học tập;
- gọi tool khi cần dữ liệu thật;
- tổng hợp kết quả theo ngữ cảnh học sinh;
- trả về cả `reply` và `nodes` để UI có thể dựng lại insight hoặc milestone.

## Entry point

Request đi vào:

- `POST /api/v1/agent/counsel`

Payload hiện tại gồm:

- `session_id`
- `messages`
- `profile`

Handler tạo `AdmissionsCounselorAgent`, sau đó chạy ReAct loop và trả về:

- `reply`
- `nodes`

## Vòng xử lý chính

1. Nhận messages và profile của user.
2. Ghép system prompt, tool list, profile context, và history.
3. Gọi Gemini để xin quyết định tiếp theo.
4. Nếu model chọn `tool_name`, agent thực thi tool tương ứng.
5. Đưa output của tool quay lại model để tổng hợp câu trả lời cuối.
6. Nếu model đã đủ thông tin, trả về trực tiếp `response`.

## Tool hiện có

- `search_universities`: tìm program thật từ university service.
- `generate_roadmap_tasks`: sinh roadmap chuẩn bị theo mốc thời gian.

Hai tool này đại diện cho hai loại nhu cầu khác nhau:

- truy xuất dữ liệu thực tế;
- tạo khung kế hoạch có cấu trúc.

## Quy tắc quan trọng của agent

- Khi nói về trường, chương trình, học phí, agent phải ưu tiên tool thật thay vì phán đoán.
- Nếu source từ university-service có `source_url` và `last_verified_at`, agent nên ưu tiên những record đó khi giải thích cho người dùng.
- Nếu tool không trả được dữ liệu, agent cần nói rõ là chưa có đủ dữ liệu.
- Không được để model “bịa” nguồn chính thức.
- `nodes` chỉ nên chứa các điểm nổi bật có ích cho UI, không phải log nội bộ.

## Các lớp dữ liệu

- `messages`: lịch sử hội thoại.
- `profile`: bối cảnh học sinh.
- `tool output`: dữ liệu được xác thực từ service khác.
- `final response`: câu trả lời đã được tổng hợp để người dùng đọc.

## Hướng mở rộng tiếp

Khi thiết kế tiếp, agent nên tách rõ hơn thành 4 tầng:

1. Intent detection.
2. Tool selection.
3. Data validation / normalization.
4. Response synthesis.

Điều này giúp sau này thêm các agent khác như:

- scholarship analyst;
- document reviewer;
- application planner;
- persona coach.

## Ràng buộc thiết kế

- Agent không nên giữ state nghiệp vụ dài hạn nếu state đó đã thuộc về domain service.
- Agent không nên tự query trực tiếp database nghiệp vụ nếu đã có service API.
- Agent không nên là nơi duy nhất chứa logic chất lượng dữ liệu.
- Nếu output dùng cho UI, schema phải ổn định và có version rõ ràng.

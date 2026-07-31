# Tầng 3: AI & Integration Layer (AI Agent Pipeline)

Tài liệu này giải thích cực kỳ chi tiết về kiến trúc AI Agent trong PathSync-AI. Nó được viết riêng cho team/phụ trách tầng AI để nắm rõ Agent được xây dựng nhằm giải quyết bài toán gì, nhúng vào quy trình ở đâu, và các luồng tương tác thực tế như thế nào.

## 1. Bài toán và Mục đích của AI Agent
Trong các hệ thống tư vấn truyền thống, AI thường mắc lỗi **"Ảo giác" (Hallucination)** — tự bịa ra mức học phí, deadline không có thật, hoặc các yêu cầu đầu vào sai lệch. Điều này cực kỳ nguy hiểm đối với lĩnh vực tư vấn du học.

**Mục đích của AI Agent trong PathSync-AI:**
1. **Không phải Bách khoa toàn thư**: AI không được phép tự trả lời các thông tin "Fact" (Sự thật khách quan) về các trường Đại học.
2. **Cố vấn & Định hướng (Counselor)**: AI đóng vai trò khơi gợi, trò chuyện để bóc tách các "Điểm sáng" (Nodes) trong câu chuyện cá nhân của học sinh. 
3. **Người vận hành Công cụ (Tool Operator)**: Khi người dùng hỏi thông tin cụ thể (Ví dụ: *"Trường nào ở Mỹ có ngành Khoa học máy tính?"*), AI bắt buộc phải "Gọi Tool" (SearchUniversitiesTool) để lấy dữ liệu tĩnh từ `university-service`. AI chỉ format lại dữ liệu đó chứ không được tự bịa ra.
4. **Human-in-the-loop (Người dùng là trọng tâm)**: AI không có quyền tự động Ghi/Xóa dữ liệu (Database). Nó chỉ **đề xuất hành động (Proposed Actions)**, người dùng ấn xác nhận thì hệ thống (Frontend) mới đẩy Data xuống Backend.

## 2. Vị trí của AI trong Kiến trúc
AI Agent là một Microservice viết bằng Golang (Nằm tại `backend/ai-agent-service`).
Nó là Layer thứ 3 trong kiến trúc 4 tầng:
- **Nhận Input**: Từ `frontend` qua `api-gateway` (POST `/api/v1/agent/counsel`). Input bao gồm `messages` (Lịch sử chat) và `profile` (Bối cảnh học sinh).
- **Xử lý LLM**: Sử dụng `gemini-1.5-flash` thông qua REST API của Google Generative Language.
- **Trích xuất dữ liệu**: Giao tiếp nội bộ (Internal API call) với `university-service` (Port 8004) để lấy thông tin.
- **Trả kết quả**: Trả về cấu trúc JSON chặt chẽ (AgentResponse Schema) lại cho Frontend. Frontend sẽ render UI (Các dòng chat, nút bấm, nguồn trích dẫn).

## 3. Workflow & Luồng Thực thi (Agent Loop)
Thay vì sử dụng ReAct (Reasoning and Acting) loop phức tạp và dễ bị kẹt, hệ thống dùng **Intent Routing (Điều hướng theo ý định)**:

1. **Phân tích User Message**: Hệ thống lấy tin nhắn cuối cùng của User, chạy qua một hàm regex/keyword detector nhanh (`detectIntent`).
2. **Phân luồng**:
   - Nếu Ý định = `university_search`: Agent gọi `SearchUniversitiesTool` -> Lấy dữ liệu từ DB -> Ráp vào Context -> Gọi LLM -> LLM sinh ra `ProposedActions` loại `save_program` (Thêm trường vào Kanban).
   - Nếu Ý định = `roadmap`: Agent gọi `GenerateRoadmapTasksTool` -> Sinh ra checklist -> LLM sinh ra `ProposedActions` loại `create_roadmap`.
   - Nếu Ý định = `conversation` (Trò chuyện bình thường): Agent dùng system prompt để phỏng vấn, khơi gợi câu chuyện, sinh ra các `Nodes` (Đại diện cho 1 insight của học sinh).

## 4. Cấu trúc Trả về (AgentResponse Schema)
Để team AI dễ dàng nâng cấp mô hình, hãy đảm bảo mọi model mới đều tuân thủ chặt chẽ Output Schema này:

```json
{
  "schema_version": "2026-07",
  "reply": "Câu thoại text đơn thuần của AI, viết bằng ngôn ngữ của người dùng.",
  "nodes": [
    {
      "id": "node-1",
      "label": "Đam mê lập trình",
      "category": "Bản sắc & Mục tiêu",
      "description": "Học sinh có kinh nghiệm làm web từ cấp 3"
    }
  ],
  "suggestions": ["Làm sao để viết luận về web?", "Có nên thi thêm SAT?"],
  "citations": [
    {
      "label": "MIT — nguồn chính thức",
      "url": "https://oge.mit.edu/...",
      "last_verified_at": "2026-07-31T00:00:00Z"
    }
  ],
  "proposed_actions": [
    {
      "id": "save-program-mit-cs",
      "type": "save_program",
      "title": "Thêm vào danh sách theo dõi",
      "description": "Tạo nháp hồ sơ ứng tuyển cho MIT.",
      "payload": {
        "university_id": "mit",
        "university_name": "MIT",
        "program_name": "Khoa học máy tính",
        "deadline": "2026-12-31"
      },
      "requires_confirmation": true
    }
  ],
  "safety_notice": "Học phí, yêu cầu và deadline có thể thay đổi. Hãy xác nhận lại tại nguồn chính thức..."
}
```

## 5. Nhiệm vụ Tương lai cho Team AI
Nếu bạn là người tiếp quản tầng AI này, đây là những việc cần phát triển tiếp:
1. **Nâng cấp công cụ OCR & Embedding (Document Service)**: Tích hợp RAG để đọc các file PDF/Bảng điểm học sinh upload, từ đó giúp LLM hiểu chính xác hơn về Profile.
2. **Dynamic Tools Calling**: Thay vì dùng Regex cứng nhắc (`detectIntent`), hãy chuyển sang sử dụng tính năng **Function Calling** chuẩn của Gemini API để model tự quyết định khi nào cần gọi Tool.
3. **Cá nhân hóa theo Profile**: Truyền các thông số từ hồ sơ học sinh (GPA, Ngân sách) vào Tool `SearchUniversities` để bộ lọc ở database chính xác hơn, LLM đỡ phải filter chay.

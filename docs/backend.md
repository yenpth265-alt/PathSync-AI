# Tầng 2: Application Layer (Backend Golang)

Tài liệu thiết kế Tầng 2 - Logic và Dịch vụ (Backend) của PathSync-AI.

## 1. Kiến trúc Microservices
Backend được thiết kế theo dạng Microservices viết bằng Golang (Gin Framework). Các service bao gồm:
- **API Gateway (`api-gateway`)**: Định tuyến mọi yêu cầu từ frontend tới các microservices phía sau. Port mặc định: 8000.
- **Auth Service (`auth-service`)**: Quản lý JWT Token, Login, Register, và cấu hình Profile của user. Chứa thông tin Onboarding. Port: 8001.
- **Application Service (`application-service`)**: Quản lý dữ liệu Kanban Board, quản lý hồ sơ ứng tuyển của từng trường. Port: 8002.
- **Document Service (`document-service`)**: Upload và trích xuất dữ liệu tài liệu cá nhân. Port: 8003.
- **University Service (`university-service`)**: Cung cấp API tra cứu thông tin trường đại học (nhận data từ crawler). Port: 8004.
- **AI Agent Service (`ai-agent-service`)**: Node AI chính cung cấp endpoints cho việc tương tác LLM Orchestration. Port: 8005.

## 2. Orchestrator
Có một script Orchestrator trung tâm tại thư mục root backend (`main.go`), giúp tự động cấp phát, khởi chạy tất cả 6 microservice trên background song song thay vì phải chạy tay từng service.

## 3. Kết nối với AI Pipeline
Backend không tự đưa ra các quyết định thông minh, mà uỷ quyền cho Tầng 3 (AI Pipeline). API Gateway sẽ định tuyến `POST /api/v1/agent/counsel` vào AI Agent Service. Mọi prompt, tool parsing đều được thực thi tại đây rồi trả về chuẩn JSON Schema.

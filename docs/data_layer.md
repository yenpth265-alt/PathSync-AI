# Tầng 4: Data Layer (Cơ sở dữ liệu)

Tài liệu thiết kế Tầng 4 - Cấu trúc lưu trữ dữ liệu của PathSync-AI.

## 1. Relational Database (Cơ sở dữ liệu quan hệ)
Mỗi microservice có khả năng đóng gói DB của riêng mình (hiện tại trong môi trường phát triển đang dùng SQLite cục bộ cho nhanh, nhưng thiết kế gốc tương thích với PostgreSQL).
- **Users / Profiles (Auth Service)**: Bảng lưu thông tin trạng thái học sinh (GPA, Ngân sách, Onboarding boolean, ...).
- **Boards / Lists / Cards (Application Service)**: Bảng lưu cấu trúc Kanban, theo dõi lộ trình và deadline nộp hồ sơ. Nhận dữ liệu đề xuất từ AI Agent.
- **University Programs (University Service)**: Bảng lưu dữ liệu vĩ mô (Học phí, yêu cầu đầu vào IELTS/SAT, quốc gia) được trích xuất từ các website chính thức. Nguồn dữ liệu này được AI truy vấn (thông qua Tool) nhằm giảm thiểu khả năng Hallucination.

## 2. Dòng chảy Dữ liệu (Data Flow) từ AI
- Tầng 3 (AI Pipeline) sinh ra các `ProposedActions` và trả về Tầng 1 (Frontend UI).
- Tại Tầng 1, người dùng ấn **Xác nhận**.
- Tầng 1 gửi HTTP POST đến Tầng 2 (Backend APIs - VD: `/api/v1/applications`).
- Tầng 2 validate dữ liệu và INSERT vào Tầng 4 (Database). 

## 3. Storage
- Tương lai: Tích hợp S3/Local Storage để lưu file PDF, chứng chỉ ngoại ngữ mà user upload lên để OCR bóc tách (Layer 3).

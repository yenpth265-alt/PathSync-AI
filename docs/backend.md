# Backend Architecture

Backend hiện tại được tổ chức như một cụm microservice tối thiểu với API Gateway ở cổng `8000`.

## Thành phần chính

- `backend/api-gateway`: nhận request từ frontend và proxy tới từng service.
- `backend/auth-service`: đăng ký, đăng nhập, và hồ sơ người dùng.
- `backend/application-service`: hồ sơ ứng tuyển, task con, SOP, metrics.
- `backend/document-service`: quản lý tài liệu tải lên và tải xuống.
- `backend/university-service`: trường, chương trình, học bổng, fit score.
- `backend/ai-service`: các endpoint AI ngắn gọn cho chat, SOP assist, essay review, smart match.
- `backend/ai-agent-service`: agent đóng vai trò điều phối tool và suy luận theo luồng ReAct.
- `backend/main.go`: orchestrator local, chạy các service bằng `go run .` cho môi trường dev.

## Luồng request

Frontend gọi vào gateway tại `/api/v1/...`.
Gateway proxy tới đúng service đích theo prefix route:

- `/auth`, `/profile` -> auth-service
- `/applications`, `/subtasks` -> application-service
- `/documents` -> document-service
- `/universities`, `/programs`, `/scholarships` -> university-service
- `/ai` -> ai-service
- `/agent` -> ai-agent-service

## Mục tiêu kiến trúc

Thiết kế backend nên phục vụ 3 thứ:

1. Tính đúng của dữ liệu và quyền truy cập.
2. Tốc độ phản hồi đủ tốt cho trải nghiệm planning.
3. Khả năng mở rộng từng mảng riêng, đặc biệt là university data và AI assistant.

## Hợp đồng dữ liệu

- `auth-service` là nguồn cho user profile và JWT.
- `application-service` là nguồn cho application board, subtasks, SOP nội bộ.
- `document-service` là nguồn cho file metadata và download link.
- `university-service` là nguồn cho program/scholarship/university catalogue.
- `ai-service` và `ai-agent-service` chỉ nên tiêu thụ dữ liệu đã có, không tự bịa nguồn sự thật.

## Nguồn dữ liệu chính thống cho university-service

University service hiện được thiết kế để sync từ các seed URL chính thức của từng trường.
Mỗi record cần đi kèm provenance:

- `source_url`
- `source_label`
- `source_type`
- `last_verified_at`

API hỗ trợ:

- `GET /api/v1/sources` để xem danh sách nguồn đang được cấu hình.
- `GET /api/v1/programs` và `GET /api/v1/scholarships` để tra cứu dữ liệu đã chuẩn hoá.

Các seed mặc định đang thiên về official public pages của một số trường lớn như MIT, Harvard, Stanford và NUS. Khi mở rộng, nên thêm nguồn bằng cấu hình thay vì hardcode logic vào handler.

## Vấn đề cần giữ thẳng thắn

Thiết kế hiện tại là MVP và vẫn còn nhiều chỗ chưa đủ chặt để gọi là production-ready.

- Chưa có lớp auth chung xuyên qua toàn bộ service.
- Một số service vẫn dựa vào SQLite local nên dữ liệu chưa thật sự được đồng bộ theo mô hình production.
- Gateway hiện tại chỉ proxy, chưa chuẩn hoá identity propagation và policy enforcement.
- AI agent đang đọc dữ liệu qua tool thay vì có một lớp domain service thống nhất.

## Hướng thiết kế tiếp

Nếu tiếp tục refactor, backend nên đi theo thứ tự:

1. Chuẩn hoá auth và identity propagation.
2. Tách hợp đồng request/response thành tài liệu rõ ràng.
3. Làm sạch application/document/university data ownership.
4. Tách phần AI ra khỏi business logic thuần.
5. Viết test cho contract và các đường đi quan trọng.

## Nguyên tắc vận hành

- Không để service tự định nghĩa lại cùng một khái niệm bằng nhiều schema khác nhau.
- Không để AI service ghi đè truth data của domain service.
- Không để gateway trở thành nơi có logic nghiệp vụ phức tạp.
- Không để các route public/privileged lẫn lộn mà thiếu kiểm tra quyền.

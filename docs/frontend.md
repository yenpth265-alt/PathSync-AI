# Frontend Architecture

Frontend của PathSync có hai chế độ chạy song song, nhưng chỉ một trong hai là dữ liệu thật.

- `Connected mode` gọi `VITE_API_BASE_URL` (mặc định `http://localhost:8000/api/v1`) và phụ thuộc vào backend đang chạy.
- `Sample workspace mode` khởi tạo từ màn Login, lưu workspace cục bộ trong browser storage để có thể trải nghiệm toàn bộ journey mà không cần backend. Chế độ này phải được hiển thị như dữ liệu minh hoạ, không được ám chỉ là dữ liệu tuyển sinh đã xác thực.

`src/services/api.js` là ranh giới network duy nhất của app. Component không nên gọi `fetch` trực tiếp, ngoại trừ 2 màn đăng nhập/đăng ký khi gửi credentials. Chế độ mẫu được triển khai trong `src/services/demoStore.js` và trả về các response shape gần giống backend để UI không phải viết hai bộ logic khác nhau.

## Mục tiêu trải nghiệm

Frontend không chỉ là danh sách tính năng; nó phải dẫn người dùng theo một hành trình có ý nghĩa:

1. Xác định profile học tập.
2. Khám phá chương trình và học bổng theo mục tiêu thật.
3. Đưa một lựa chọn phù hợp vào bảng kế hoạch.
4. Theo dõi deadline và checklist cho từng hồ sơ.
5. Chuẩn bị tài liệu, SOP, và các hỗ trợ AI với tinh thần “AI hỗ trợ, con người quyết định”.

## Cấu trúc màn hình

- `Public pages`: Landing, About, Features, Login, Register.
- `Private flow`: Dashboard, Onboarding, Profile, Explore, Universities, Smart Match, Applications, Documents, Essay Copilot, Persona Lab.
- `Shared UI`: Sidebar, Header, cards, modal, kanban board, stat cards.

## Quy tắc thiết kế sản phẩm

- Fit score là tín hiệu gợi ý, không phải dự đoán đầu vào/đầu ra tuyển sinh.
- Program, scholarship, fee, deadline chỉ được xem như dữ liệu thật khi có nguồn và mốc xác thực rõ ràng.
- AI output chỉ là hỗ trợ nội dung. Không được trình bày như yêu cầu chính thức, tư vấn pháp lý, hay đảm bảo trúng tuyển.
- Nếu auth/profile fetch lỗi, route bảo vệ phải quay về login thay vì đứng ở trạng thái loading vô hạn.

## Luồng dữ liệu chính

1. User đăng nhập hoặc vào sample workspace.
2. `AuthContext` giữ token và profile hiện tại.
3. Page gọi service layer trong `src/services/api.js`.
4. Service layer quyết định đi backend thật hay demo workspace.
5. UI chỉ render theo dữ liệu đã được chuẩn hoá.

## Những chỗ cần giữ sạch khi refactor tiếp

- Không để nhiều page tự xử lý base URL hoặc auth token.
- Không để dữ liệu minh hoạ lẫn vào dữ liệu thật mà không có nhãn.
- Không để fallback “điền bừa” thành dữ liệu sản phẩm chính.
- Nếu thêm route hoặc module mới, cần nói rõ nó thuộc public flow hay private flow.


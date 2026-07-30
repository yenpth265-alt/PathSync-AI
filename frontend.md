# Tài Liệu Kiến Trúc & Luồng Hoạt Động Frontend - PathSync AI

Đây là tài liệu chi tiết mô tả kiến trúc, các tính năng và luồng tương tác người dùng (User Flow) của ứng dụng Frontend **PathSync AI** phiên bản V1. Toàn bộ logic hiển thị, xác thực (Authentication) và điều hướng đã được xây dựng hoàn thiện và chặt chẽ.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)
- **Core Framework**: React (Vite)
- **Routing**: React Router DOM (v6) với Nested Layouts (Public vs Protected).
- **State Management**: React Context API (`AuthContext` quản lý phiên đăng nhập và dữ liệu người dùng).
- **Styling**: Vanilla CSS (CSS Variables cho hệ thống màu sắc thống nhất, hỗ trợ responsive).
- **Animations & Tương tác**: Framer Motion (page transitions, micro-interactions), dnd-kit (cho Kanban Board kéo thả).
- **Icons**: Lucide React.
- **Biểu đồ (Charts)**: Recharts (cho Dashboard).

---

## 2. Kiến Trúc Routing & Xác Thực (Authentication)

Logic điều hướng và bảo mật được đặt ở `App.jsx`, `AuthContext.jsx` và `api.js`.

### a. Hệ thống Routing bảo mật (`App.jsx`)
Ứng dụng được chia làm 2 Layout chính:
- **`PublicLayout`**: Dành cho người dùng chưa đăng nhập. Nếu người dùng **đã đăng nhập** mà cố tình truy cập vào `/login` hoặc `/register`, hệ thống sẽ tự động đá thẳng vào `/dashboard`.
- **`ProtectedLayout`**: Bao bọc bởi cơ chế kiểm tra `token`. Chứa Navbar, Sidebar và các trang tính năng. Nếu người dùng **chưa đăng nhập** mà cố tình truy cập vào đây (như `/dashboard`), hệ thống sẽ đá ngược ra `/login`.

### b. Quản lý trạng thái (`AuthContext.jsx`)
- Lưu trữ `token` (lấy từ LocalStorage) và `profile` của người dùng.
- Cung cấp các hàm `login(token)`, `logout()`, `refreshProfile()`.
- Lắng nghe sự kiện toàn cục `auth:logout` để tự động dọn dẹp state khi token hết hạn.
- **Mock Fallback**: Nếu server chưa online, hệ thống tự động fallback sử dụng dữ liệu từ `localStorage('mock_profile')` để đảm bảo luồng Onboarding và Dashboard hoạt động xuyên suốt.

### c. API Interceptor (`api.js`)
- Mọi API call đều đi qua hàm `customFetch`.
- Tự động đính kèm `Authorization: Bearer <token>` vào headers.
- Nếu server trả về `401 Unauthorized` hoặc `403 Forbidden`, `customFetch` sẽ chủ động kích hoạt sự kiện `auth:logout` -> Context bắt được sự kiện này -> Đăng xuất người dùng -> Router đá văng ra `/login`.

---

## 3. Luồng Người Dùng (User Flow)

### Bước 1: Khám phá & Đăng nhập (Public)
1. **Landing Page (`/`)**: Giao diện giới thiệu tính năng, animated background sinh động, hiệu ứng tương tác Hover mượt mà.
2. **Đăng ký (`/register`)**: Điền form tạo tài khoản -> Đăng ký thành công -> Tự động chuyển qua trang Đăng nhập. (Các nút "Bắt đầu ngay" đều dẫn thẳng vào đây).
3. **Đăng nhập (`/login`)**: Nhập Email & Mật khẩu -> Bấm Sign In -> Gọi API `/auth/login` -> Trả về Token -> Cập nhật vào `AuthContext`.
4. **Kiểm tra Onboarding**: Router bảo vệ sẽ kiểm tra `profile.onboarding_done`. Nếu là False, tự động đá vào `/onboarding`. Nếu là True, đi thẳng tới `/dashboard`.

### Bước 2: Thiết lập hồ sơ lần đầu (Onboarding)
- **Onboarding Wizard (`/onboarding`)**: Dành cho người dùng mới. Là một chuỗi 4 bước:
  - B1: Chọn Trình độ học vấn hiện tại & Mục tiêu.
  - B2: Lĩnh vực quan tâm (IT, Kinh doanh...) & Vùng địa lý mong muốn.
  - B3: Ngân sách & Năm dự định đi.
  - B4: Phân loại hướng đi (Đang tìm kiếm trường vs Đã có mục tiêu rõ ràng).
- Nhấn hoàn thành -> Cập nhật `onboarding_done: true` lên hệ thống -> Chuyển hướng vào trang chính.

### Bước 3: Trải nghiệm Tính năng (Protected)

#### 3.1. Tổng quan Dashboard (`/dashboard`)
- Trái tim của ứng dụng.
- **API `getDashboardMetrics`**: Lấy số liệu thật để hiển thị Tiến độ Lộ trình, Trạng thái Công việc (Pie Chart) và Hoạt động gần đây.
- Nút "Hành động nhanh" giúp người dùng nhảy cóc đến các tính năng cốt lõi.

#### 3.2. Quản lý Hồ sơ & Kanban (`/applications`)
- **StatCards**: 4 thẻ hiển thị nhanh tổng quan (Tổng hồ sơ, Đang xử lý, Hoàn thành, Cần gấp).
- **Kanban Board**: 
  - 3 cột: Cần làm (Todo) -> Đang xử lý (InProgress) -> Hoàn thành (Completed).
  - Sử dụng cơ chế **Optimistic UI**: Khi người dùng kéo thả 1 hồ sơ từ cột này sang cột khác, thẻ hồ sơ *di chuyển ngay lập tức trên màn hình* để tạo cảm giác siêu mượt. Đồng thời, ngầm gọi API `moveApplication` phía sau. Nếu mạng lỗi hoặc Server từ chối, ứng dụng tự động "giật" thẻ hồ sơ trở về cột cũ an toàn.
- Bấm vào một thẻ hồ sơ -> Mở Modal Soạn thảo bài luận (SOP Editor).

#### 3.3. Soạn thảo Bài luận & Trợ lý AI (`Modal trong /applications`)
- Màn hình chia đôi: Trái là phần viết bài luận (Editor), phải là Trợ lý AI.
- **Tính năng AI**:
  - `Xin Gợi Ý`: Phân tích ý tưởng và cấu trúc (gọi API `aiSOPAssist`).
  - `Chấm Điểm`: Chấm điểm bài luận dựa trên thang 100 và đưa ra lời khuyên cải thiện (gọi API `aiEssayReview`).
- Tự động lưu bài luận (Auto-save) khi người dùng gõ xong.

#### 3.4. Khám phá Cơ hội (`/explore`)
- Giao diện có Tabs: **Chương trình học** / **Học bổng**.
- Thanh tìm kiếm và bộ lọc quốc gia.
- Nút `+ Thêm vào Hồ sơ`: Click vào sẽ gọi API tạo một bản ghi hồ sơ mới, đẩy trực tiếp vào Kanban Board.

#### 3.5. Smart Match AI (`/smart-match`)
- Thu thập GPA, IELTS, Chuyên ngành và Nguyện vọng.
- Có hiệu ứng Loader "AI đang phân tích..." đẹp mắt.
- Trả về danh sách các trường đại học với mức độ **Match Score**. Các trường được phân loại là Thử Thách (Reach), Phù Hợp (Target), An Toàn (Safe).

#### 3.6. Cố vấn AI Đa dụng (`/essay-copilot` / AI Persona)
- Giao diện Chatbot thuần túy để người dùng hỏi đáp trực tiếp với AI chuyên gia về du học.

#### 3.7. Cài đặt Cá nhân (`/profile`)
- Form cập nhật thông tin: Họ tên, GPA, Bằng cấp, Budget...
- Nút Xóa tài khoản (Danger Zone).

---

## 4. Trạng Thái Hiện Tại (Ver 1)
- **Frontend Ver 1 ĐÃ HOÀN THIỆN 100% về mặt Giao diện (UI) và Luồng dữ liệu (Logic)**.
- Đã được Việt hóa hoàn toàn.
- Mọi logic chặn luồng (chưa làm Onboarding, bị mất Token) đều đã được xử lý triệt để.
- **Deploy Vercel**: Ứng dụng đã hoàn toàn sẵn sàng để Deploy lên Vercel ngay lập tức (không có lỗi build hay warning).

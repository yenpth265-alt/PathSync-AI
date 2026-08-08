# Hướng dẫn Triển khai (Deployment Guide)

Dự án hiện đã được cấu trúc hoàn thiện để chạy bằng Docker Compose tại máy local hoặc dễ dàng triển khai lên Cloud.

## 1. Chạy Local cho Team (Test nội bộ)
Chỉ cần cài đặt Docker và Docker Compose. Mở Terminal tại thư mục gốc của dự án và chạy:
```bash
docker-compose up -d --build
```
Hệ thống sẽ tự khởi tạo:
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **PostgreSQL**: Tự tạo 5 databases riêng biệt cho 5 microservices.

*Lưu ý:* Database SQLite sẽ tự động được sử dụng nếu bạn chạy bằng `start.bat` (không dùng Docker), còn Docker Compose đã cấu hình biến môi trường `DATABASE_URL` để ép các service dùng PostgreSQL.

## 2. Đưa lên Cloud (Sử dụng Render / Vercel / Supabase)
Để có một website công khai trên Internet mà bạn chỉ là Collaborator của repo:

### Bước 2.1: Database (Supabase) - Rất Dễ!
Tin vui: Các bảng dữ liệu của 5 services trong project này **không hề trùng tên nhau**. Do đó, để tiết kiệm và dễ làm nhất, bạn **chỉ cần dùng chung 1 Database duy nhất** cho toàn bộ project thay vì phải tạo 5 cái (không cần chạy file `init-dbs.sql` nữa).

**Cách lấy link Database trên Supabase (Giao diện mới):**
1. Đăng nhập [Supabase](https://supabase.com/) và vào Project của bạn.
2. Hãy nhìn lên **cạnh trên cùng của màn hình** (ngay cạnh tên Project `PathSyncAI`), bạn sẽ thấy một nút màu xanh lá cây chữ **Connect**. Hãy bấm vào đó!
3. Một bảng popup hiện lên. Ở mục **Connect to your project**, hãy chọn tab **URI**.
4. Bạn sẽ thấy một đoạn link giống như thế này:
   `postgresql://postgres.xxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
5. Copy đường link đó và nhớ đổi chữ `[YOUR-PASSWORD]` thành mật khẩu bạn tạo lúc khởi tạo Project. Chuỗi này chính là `DATABASE_URL` thần thánh của bạn!

*Lưu ý:* Khi thiết lập biến môi trường trên Cloud (như Render), bạn copy y nguyên chuỗi này và dán vào biến `DATABASE_URL` cho **tất cả 5 Backend Services**. GORM sẽ tự động chia bảng (tables) gọn gàng trong cùng 1 database này!

### Bước 2.2: Backend Microservices (Render.com)
1. Đăng ký [Render](https://render.com/).
2. Chọn **New > Web Service**.
3. Chọn repo GitHub `PathSync-AI` của bạn.
4. Ở phần Environment, chọn **Docker**.
5. Đặt **Dockerfile path** là `backend/Dockerfile`.
6. Ở phần Advanced, thêm các **Build Command** hoặc truyền **Build Args**:
   - `SERVICE_NAME=auth-service` (Tương tự cho các service khác, bạn cần tạo 6 Web Service trên Render tương ứng với 6 mục trong thư mục `backend/`).
   - Thêm biến môi trường `DATABASE_URL` trỏ về chuỗi kết nối Supabase tương ứng ở Bước 2.1.

*Tip:* Nếu muốn tiết kiệm (vì Render Free khá chậm), bạn có thể gom tất cả code Backend vào 1 monolith, nhưng ở kiến trúc hiện tại, việc tạo từng Web Service là chuẩn Microservices nhất.

### Bước 2.3: Frontend (Vercel)
1. Đăng ký [Vercel](https://vercel.com/) bằng GitHub.
2. Bấm **Add New > Project**, chọn repo `PathSync-AI`.
3. Vercel sẽ tự nhận diện thư mục `frontend/` vì chúng ta đã có file `vercel.json`.
4. Trong phần Environment Variables, hãy set biến `VITE_API_URL` trỏ về đường link của **API Gateway** mà bạn vừa lấy được từ Render ở Bước 2.2.
5. Bấm Deploy.

🎉 Xong! Bạn đã có một ứng dụng Fullstack AI triển khai thực tế.

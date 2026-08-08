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

### Bước 2.1: Database (Supabase)
1. Đăng ký tài khoản [Supabase](https://supabase.com/).
2. Tạo 1 Project mới (sẽ được cấp 1 chuỗi kết nối PostgreSQL dạng `postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres`).
3. Bạn dùng pgAdmin hoặc DBeaver kết nối vào DB này, và chạy file `backend/init-dbs.sql` để tạo 5 databases con.
4. Ghi lại các chuỗi kết nối (URI) tương ứng cho từng service.

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

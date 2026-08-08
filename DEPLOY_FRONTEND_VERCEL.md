# Hướng dẫn Deploy Frontend PathSync-AI lên Vercel

> **Ghi chú:** Backend, AI Agents, và Database (Supabase) đã được setup và deploy tự động lên Render. Bạn (với tư cách là chủ Repo) chỉ cần làm vài bước siêu đơn giản dưới đây để đưa Frontend lên Vercel là hệ thống sẽ chạy hoàn chỉnh 100%.

## Các bước thực hiện:

### Bước 1: Đăng nhập Vercel
1. Truy cập [Vercel.com](https://vercel.com/) và đăng nhập bằng chính tài khoản Github `yenpth265-alt` của bạn.

### Bước 2: Import Project
1. Tại trang chủ Vercel (Dashboard), bấm vào nút **Add New...** ở góc trên bên phải, chọn **Project**.
2. Ngay ở đầu trang, bạn sẽ thấy kho code `PathSync-AI` của bạn hiện lên. Hãy bấm vào nút **Import** ngay bên cạnh nó.

### Bước 3: Cấu hình Dự án (Rất quan trọng)
Sau khi bấm Import, Vercel sẽ đưa bạn đến một bảng cấu hình "Configure Project". Bạn giữ nguyên hầu hết mọi thứ, CHỈ CẦN THAY ĐỔI đúng 2 chỗ sau:

1. **Root Directory**:
   - Mặc định nó đang là `./` (thư mục gốc). Bạn hãy bấm vào nút **Edit** bên cạnh.
   - Chọn thư mục **`frontend`** rồi bấm **Save** (hoặc Continue).

2. **Environment Variables (Biến môi trường)**:
   - Kéo xuống dưới một chút, bạn sẽ thấy mục **Environment Variables**. Bấm để mở nó ra.
   - Ở ô **Name**, bạn nhập chính xác chữ này (viết hoa toàn bộ): 
     `VITE_API_URL`
   - Ở ô **Value**, bạn copy và dán đường link Render của Backend này vào:
     `https://pathsync-ai-5dcu.onrender.com`
   - Cuối cùng bấm nút **Add**.

### Bước 4: Chạy thử
1. Bấm nút **Deploy** to màu xanh ở dưới cùng.
2. Vercel sẽ bắt đầu tự động tải code, cài đặt và build ra trang web. Mất khoảng 1-2 phút.
3. Khi thấy pháo giấy bắn tung tóe báo hiệu "Congratulations!", bạn có thể bấm **Continue to Dashboard** và lấy đường link trang web public để gửi cho cả nhóm trải nghiệm!

Chúc bạn thành công! Nếu báo lỗi gì thì gửi ngay vào nhóm nhé.

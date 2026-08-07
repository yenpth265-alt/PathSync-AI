# ĐỀ ÁN CHI TIẾT: PATHSYNC AI - TRỢ LÝ ĐỒNG HÀNH DU HỌC TOÀN DIỆN

> [!NOTE]
> Báo cáo này trình bày bức tranh toàn cảnh về ý tưởng, sản phẩm, và luồng vận hành (Workflow) của PathSync AI dưới lăng kính của một nền tảng EdTech B2C tinh gọn, tập trung giải quyết bài toán cốt lõi trong hành trình du học. Tính năng "Teleprompter" đã được gỡ bỏ theo cấu trúc tinh gọn.

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Hiện trạng & Khoảng trống thị trường

**Hiện trạng:** Sự gia tăng kỷ lục về số lượng du học sinh Việt Nam (hơn 250.000 người) đang đặt áp lực lớn lên ngành tư vấn du học.
**Nguyên nhân:** Quá trình chuẩn bị hồ sơ đòi hỏi việc giám sát hàng chục deadline và chuẩn bị các bài luận/phỏng vấn khắt khe. Các gia đình thường phải phụ thuộc vào dịch vụ tư vấn đắt đỏ (15-30 triệu VNĐ/hồ sơ) hoặc học sinh phải tự xoay xở (DIY) bằng các công cụ quản lý thủ công, rời rạc (Google Calendar, Notion).
**Hậu quả:** 81% học sinh từng suýt hoặc đã bỏ lỡ deadline; 25-30% hồ sơ học bổng bị loại đáng tiếc do lỗi kỹ thuật cơ bản (sai định dạng, nộp muộn).
**Giải pháp - PathSync AI:** Nền tảng "All-in-one" kết hợp trí tuệ nhân tạo (AI) để tự động hóa khâu quản trị hồ sơ và mạng lưới chuyên gia/cựu du học sinh (Mentor) để tư vấn chiến lược.

### 1.2 Lợi thế cạnh tranh & Giá trị tạo ra

PathSync AI tạo ra giá trị kép:

* **Về mặt Chi phí & Thời gian:** Giảm 70-80% thời gian quản lý hồ sơ và chi phí chuẩn bị thấp hơn ~70% so với mô hình tư vấn truyền thống.
* **Mô hình vận hành Hybrid (Lai ghép):** Thay vì để AI quyết định tất cả, AI chỉ đóng vai trò "Trợ lý kỹ thuật" (rà soát lỗi, trích xuất dữ liệu). Các "Chiến lược gia" (Mentor) sẽ lo phần định hướng chuyên sâu, đảm bảo sự an tâm tuyệt đối cho phụ huynh.

---

## 2. HỆ SINH THÁI TÍNH NĂNG VÀ CÁCH SỬ DỤNG

PathSync AI được xây dựng theo kiến trúc mô-đun, đi theo đúng hành trình của một học sinh từ lúc bắt đầu nhen nhóm ý định đến khi hoàn tất nộp hồ sơ.

### 2.1 Action Extractor (Trợ lý bóc tách và Quản trị Deadline)

*Đây là tính năng lõi (MVP) giúp giải quyết "khủng hoảng thời gian" của học sinh.*

* **Chức năng:** Tự động đọc, phân tích và trích xuất các mốc thời gian, yêu cầu tài liệu từ một tệp PDF/Brochure học bổng.
* **Cách sử dụng:**
  1. Người dùng tải lên file PDF thông báo tuyển sinh của một trường đại học.
  2. AI (sử dụng công nghệ OCR + LLM) quét văn bản và tự động tạo ra một bảng Kanban (To-do, In-progress, Done).
  3. Các đầu việc (Ví dụ: "Hạn chót nộp Personal Statement", "Hạn nộp thư giới thiệu") được điền sẵn thời gian, người dùng chỉ cần xác nhận để hệ thống bắt đầu đếm ngược và nhắc nhở tự động.

### 2.2 Smart Matching (Hệ thống định vị học bổng & Cố vấn)

* **Chức năng:** Kết nối người dùng với các khóa học, quốc gia phù hợp và tìm kiếm Mentor đồng hành.
* **Cách sử dụng:**
  1. Học sinh nhập thông tin đầu vào: GPA, điểm IELTS, ngân sách dự kiến, và sở thích ngành nghề.
  2. Hệ thống (Rule-based kết hợp LLM) phân tích và trả về 1 bảng Xếp hạng các quốc gia/trường phù hợp.
  3. Tại mỗi lựa chọn, hệ thống gợi ý danh sách các Mentor (cựu sinh viên của chính trường/ngành đó) đang sẵn sàng hỗ trợ.

### 2.3 AI Execution Buddy (Trợ lý thực thi hồ sơ)

*Hỗ trợ trực tiếp các thao tác chuyên môn (Luận & Phỏng vấn).*

* **AI Essay Copilot:** Công cụ hỗ trợ viết luận không vi phạm liêm chính học thuật.
  * *Cách sử dụng:* Học sinh nhập bản nháp Personal Statement. AI sẽ rà soát lỗi ngữ pháp, đánh giá sự liền mạch logic (flow), và gợi ý các từ vựng học thuật. Đặc biệt, AI **không** viết hộ, chỉ đánh dấu và đưa ra lời khuyên sửa đổi.
* **Micro-Simulation (Phỏng vấn giả lập):** Phòng tập phỏng vấn ảo.
  * *Cách sử dụng:* Người dùng bật micro và trò chuyện với "Giám khảo AI". AI đặt câu hỏi giả lập dựa trên hồ sơ của người dùng, lắng nghe câu trả lời và phản hồi ngay lập tức (real-time) về tốc độ nói, phát âm và cấu trúc câu trả lời.

### 2.4 AI Mentor Pro (Dành riêng cho Mentor)

* **Chức năng:** Công cụ giúp Mentor tối ưu hóa hiệu suất tư vấn.
* **Cách sử dụng:** Mentor nhận bản nháp bài luận từ Mentee. AI sẽ hỗ trợ "đọc rà soát" trước, tổng hợp các điểm yếu chính và đề xuất một bộ khung nhận xét. Mentor dựa vào đó để điều chỉnh và viết phản hồi chiến lược, tiết kiệm 50% thời gian so với chấm bài thủ công.

---

## 3. QUY TRÌNH HOẠT ĐỘNG (USER WORKFLOWS)

Bức tranh dưới đây mô phỏng chính xác sự tương tác của hai nhóm người dùng chính trên nền tảng.

### 3.1 Hành trình của Học sinh (Mentee Workflow)

> [!TIP]
> Quy trình của Mentee được thiết kế ưu tiên sự tự chủ (Self-service) với các công cụ AI miễn phí/chi phí thấp, sau đó mới đẩy người dùng vào phễu chuyển đổi để trả phí cho Mentor ở giai đoạn cần sự tư vấn chuyên sâu.

```mermaid
graph TD
    %% Khai báo class styling
    classDef startEnd fill:#1A237E,stroke:#000,stroke-width:2px,color:#fff;
    classDef aiTask fill:#E8EAF6,stroke:#3F51B5,stroke-width:2px;
    classDef humanTask fill:#E0F7FA,stroke:#00BCD4,stroke-width:2px;
    classDef decision fill:#FFF3E0,stroke:#FF9800,stroke-width:2px;

    %% Định nghĩa các node
    Start([1. Khởi tạo tài khoản Mentor]) ::: startEnd
  
    M1[2. Xác thực nền tảng] ::: humanTask
    M1a[Xác thực học bổng / Cựu sinh viên] ::: humanTask
    M1b{Thực hiện Bài test năng lực} ::: decision
  
    M2[3. Thiết lập vận hành] ::: humanTask
    M2a[Cài đặt thời gian rảnh Calendar] ::: humanTask
    M2b[Thiết lập mức phí tư vấn] ::: humanTask
  
    M3[4. Xử lý yêu cầu] ::: humanTask
    M3a[Hệ thống AI đề xuất Mentor tới Mentee] ::: aiTask
    M3b[Nhận yêu cầu Booking từ Mentee] ::: humanTask
    M3c[Duyệt lịch & Tiếp nhận hồ sơ nháp] ::: humanTask
  
    M4[5. Tư vấn & Đánh giá] ::: humanTask
    M4a[AI Mentor Pro rà soát trước bài nháp] ::: aiTask
    M4b[Mentor tiến hành tư vấn 1-1] ::: humanTask
    M4c[Mentor gửi báo cáo, Feedback chuyên sâu] ::: humanTask
  
    End([6. Hoàn tất Booking & Nhận thanh toán]) ::: startEnd
    Reject([Từ chối hồ sơ]) ::: startEnd

    %% Luồng liên kết
    Start --> M1 --> M1a --> M1b
    M1b -->|Không đạt| Reject
    M1b -->|Đạt yêu cầu| M2 --> M2a --> M2b --> M3 --> M3a --> M3b --> M3c --> M4 --> M4a --> M4b --> M4c --> End
```

### 3.2 Hành trình của Cố vấn (Mentor Workflow)

> [!IMPORTANT]
> Đối với Mentor, rào cản lớn nhất là thời gian. Hệ thống Workflow này sinh ra để tối ưu hóa khả năng tiếp cận khách hàng và giảm bớt gánh nặng chấm chữa bài nhờ công cụ AI Mentor Pro.

```mermaid
graph TD
    classDef startEnd fill:#1A237E,stroke:#000,stroke-width:2px,color:#fff;
    classDef aiTask fill:#E8EAF6,stroke:#3F51B5,stroke-width:2px;
    classDef humanTask fill:#E0F7FA,stroke:#00BCD4,stroke-width:2px;

    Start([1. Khởi tạo tài khoản Mentor]) ::: startEnd
  
    M1[2. Xác thực nền tảng] ::: humanTask
    M1a[Xác thực học bổng / Cựu sinh viên] ::: humanTask
    M1b{Thực hiện Bài test năng lực} ::: decision
  
    M2[3. Thiết lập vận hành] ::: humanTask
    M2a[Cài đặt thời gian rảnh Calendar] ::: humanTask
    M2b[Thiết lập mức phí tư vấn] ::: humanTask
  
    M3[4. Xử lý yêu cầu] ::: humanTask
    M3a[Hệ thống AI đề xuất Mentor tới Mentee] ::: aiTask
    M3b[Nhận yêu cầu Booking từ Mentee] ::: humanTask
    M3c[Duyệt lịch & Tiếp nhận hồ sơ nháp] ::: humanTask
  
    M4[5. Tư vấn & Đánh giá] ::: humanTask
    M4a[AI Mentor Pro rà soát trước bài nháp] ::: aiTask
    M4b[Mentor tiến hành tư vấn 1-1] ::: humanTask
    M4c[Mentor gửi báo cáo, Feedback chuyên sâu] ::: humanTask
  
    End([6. Hoàn tất Booking & Nhận thanh toán]) ::: startEnd

    Start --> M1 --> M1a --> M1b
    M1b -->|Không đạt| Reject([Từ chối hồ sơ]) ::: startEnd
    M1b -->|Đạt yêu cầu| M2 --> M2a --> M2b --> M3 --> M3a --> M3b --> M3c --> M4
    M4 --> M4a --> M4b --> M4c --> End
```

---

## 4. BÀI TOÁN KINH DOANH VÀ KẾ HOẠCH TRIỂN KHAI

### 4.1. Quy mô thị trường (Market Size)

* **TAM (Total Addressable Market):** ~40.000 hồ sơ du học/năm (Toàn bộ học sinh, sinh viên Việt Nam có nhu cầu du học).
* **SAM (Serviceable Available Market):** ~12.000 hồ sơ/năm (Học sinh tại các đô thị lớn, có thiết bị và gia đình có khả năng chi trả cho các gói giải pháp số hóa).
* **SOM (Serviceable Obtainable Market):** 150 - 250 tài khoản Premium thường xuyên hoạt động sau 12 tháng ra mắt (Chiếm khoảng 1.25% - 2% SAM).

### 4.2. Mô hình kinh doanh (Business Model)

PathSync AI vận hành theo mô hình **Freemium** kết hợp **Marketplace (B2B2C)**:

1. **Thu hút (Acquisition):** Cung cấp gói **Basic (Miễn phí)** với tính năng Smart Matching và bóc tách cơ bản (5 tài liệu/tháng) đóng vai trò là phễu (Lead Magnet).
2. **Mô hình Doanh thu đa tầng (Revenue Streams):**
   * **Subscription (Gói Đăng ký):**
     * *Mentee Pro:* 790.000 VNĐ/tháng (Tiết kiệm ~70% so với tư vấn truyền thống). Cung cấp đầy đủ AI Essay Copilot, không giới hạn bóc tách hồ sơ và báo cáo tiến độ tự động gửi phụ huynh.
     * *Mentor Pro:* 79.000 VNĐ/tháng. Cung cấp AI hỗ trợ chấm bài và quản lý lịch trình, tăng hiệu suất tư vấn.
   * **Booking Fee (Phí Giao dịch):** Nền tảng thu mức hoa hồng **15%** trên mỗi giao dịch đặt lịch giữa Mentee và Mentor (Giá mỗi buổi tư vấn dao động từ 79.000 VNĐ - 179.000 VNĐ).
3. **Giữ chân (Retention):** Nhờ việc số hóa toàn bộ lịch sử học tập, "Switching Cost" (Chi phí chuyển đổi) của người dùng sang một hệ thống khác trở nên rất cao.

### 4.3. Kế hoạch Tiếp thị và Tăng trưởng

* **KOL-led Growth:** Tiếp cận qua các đại sứ thương hiệu, KOL giáo dục trên TikTok/Facebook và Workshop tại các trường THPT để thu hút 1.000 users miễn phí đầu tiên.
* **Mentor-led Growth (Affiliate):** Biến chính các Mentor thành kênh phân phối. Mentor giới thiệu học viên vào nền tảng để sử dụng công cụ sẽ được chia sẻ doanh thu hoặc tặng gói sử dụng.

### 4.4. Cơ cấu Chi phí (Cost Structure)

* **Chi phí Đầu tư ban đầu (CAPEX):** Ước tính **~190.000.000 VNĐ** (Phát triển MVP, thiết kế giao diện, hạ tầng Cloud, phí API thử nghiệm, và quỹ dự phòng).
* **Chi phí Vận hành (OPEX):** Ước tính **~55.000.000 - 100.000.000 VNĐ/tháng** (Cho quy mô 500-1000 người dùng).
  * *Chi phí biến đổi:* API từ LLM (khoảng 70 VNĐ/câu lệnh truy vấn), chi phí gửi SMS/Email.
  * *Chi phí cố định:* Hạ tầng Server (AWS), nhân sự vận hành bán thời gian, Marketing duy trì.

### 4.5. Dự phóng Tài chính và Điểm hòa vốn

* **Unit Economics (Kinh tế đơn vị):**
  * **Biên lợi nhuận gộp:** Đạt mức **65-70%** (Sau khi trừ chi phí API và server trực tiếp trên mỗi user).
  * **CAC (Chi phí thu hút khách hàng):** ~1.000.000 - 1.500.000 VNĐ/khách hàng Premium.
  * **LTV (Giá trị vòng đời khách hàng):** ~4.740.000 - 7.900.000 VNĐ (Kéo dài 6-10 tháng). **Tỷ lệ LTV/CAC đạt 4 - 6 lần**, mức rất lý tưởng cho startup công nghệ.
* **Điểm hòa vốn (Break-even Point):** Dự kiến đạt được vào **Quý I/2028** (tháng thứ 10 - 14 kể từ khi ra mắt) với kịch bản duy trì ổn định 150 - 250 tài khoản Premium. Doanh thu dự kiến năm đầu tiên đạt ~485 triệu VNĐ, dòng tiền bắt đầu dương từ năm thứ hai.

### 4.6. Ma trận Quản trị Rủi ro (Risk Assessment)

Mọi startup đều tiềm ẩn rủi ro. PathSync AI sử dụng hệ thống đánh giá bằng điểm số (Probability x Impact):

* **Rủi ro Giữ chân người dùng thấp (Risk Score: 25 - Cao nhất):**
  * *Khắc phục:* Ứng dụng Gamification, AI nhắc lịch cá nhân hóa và báo cáo định kỳ cho phụ huynh.
* **Rủi ro Chất lượng Mentor không đồng đều (Risk Score: 20):**
  * *Khắc phục:* Yêu cầu bắt buộc phải qua "Bài test năng lực chuyên môn" và hệ thống đánh giá chéo từ Mentee (Rating).
* **Rủi ro Tài chính - Doanh thu không đạt (Risk Score: 16):**
  * *Khắc phục:* Khởi chạy thí điểm (Pilot test) trước khi tung ngân sách marketing lớn, linh hoạt điều chỉnh gói Subscription.

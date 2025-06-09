<div id="Top"></div>

# CUPID ECHO - XÂY DỰNG ỨNG DỤNG HẸN HÒ ÁP DỤNG THUẬT TOÁN GALE-SHAPLEY

## I. Mô tả

<!-- Ý TƯỞNG -->
<div id="Ytuong"></div>

### 1. Mô tả đề tài
Dự án **"Cupid Echo"** là một ứng dụng hẹn hò đa nền tảng (iOS và Android) nhằm cung cấp giải pháp kết nối hiệu quả và an toàn cho những người trẻ tuổi (18-30) có nhu cầu tìm kiếm bạn bè hoặc mối quan hệ nghiêm túc. Ứng dụng tích hợp thuật toán ghép đôi ổn định Gale-Shapley kết hợp với Collaborative Filtering để đề xuất các đối tượng phù hợp dựa trên sở thích, vị trí và các tiêu chí cá nhân hóa.

**Mục tiêu chính**:
- Xây dựng ứng dụng hẹn hò với giao diện thân thiện, dễ sử dụng, hỗ trợ cả iOS và Android.
- Tích hợp thuật toán ghép đôi ổn định để nâng cao chất lượng kết nối.
- Cung cấp tính năng **Blind Chat**, cho phép người dùng trò chuyện ẩn danh trước khi tiết lộ danh tính, tạo sự tò mò và thoải mái.
- Đảm bảo bảo mật, quyền riêng tư và trải nghiệm mượt mà cho người dùng.

Ứng dụng không chỉ tập trung vào việc ghép đôi mà còn tích hợp các yếu tố mạng xã hội như đăng bài, tương tác, và lên kế hoạch hẹn hò thực tế, mang lại trải nghiệm toàn diện và hấp dẫn.

<div id="Congnghe"></div>

### 2. Công nghệ
- **Frontend**: React Native (phát triển ứng dụng đa nền tảng).
- **Backend**: NodeJS, ExpressJS.
- **Cơ sở dữ liệu**: MongoDB, Firebase.
- **IDE**: Visual Studio Code, Xcode, Android Studio.
- **Quản lý mã nguồn**: GitHub.
- **Thiết kế giao diện**: Figma.
- **Vẽ sơ đồ phân tích**: PlantUML, Mermaid.
- **Hệ điều hành**: Windows 11, macOS.
- **Công nghệ giao tiếp thời gian thực**: WebRTC (cho gọi video).

<div id="Doituongsudung"></div>

### 3. Đối tượng sử dụng
- **Người dùng**: Những người trẻ từ 18-30 tuổi có nhu cầu kết bạn, trò chuyện hoặc tìm kiếm mối quan hệ nghiêm túc.
- **Quản trị viên**: Người quản lý hệ thống, chịu trách nhiệm duyệt nội dung, xử lý báo cáo vi phạm và theo dõi thống kê.

<div id="Muctieu"></div>

### 4. Mục tiêu

* **Ứng dụng thực tế**:
  - Đáp ứng nhu cầu kết nối xã hội của người trẻ, đặc biệt tại Việt Nam.
  - Thay thế các ứng dụng hẹn hò truyền thống với trải nghiệm cá nhân hóa và thân thiện hơn.
  - Trở thành một nền tảng đáng tin cậy, tích hợp cả tính năng hẹn hò và mạng xã hội.

* **Yêu cầu ứng dụng**:
  - Đáp ứng các chức năng tiêu chuẩn của ứng dụng hẹn hò hiện đại (đăng ký, ghép đôi, nhắn tin, gọi video, v.v.).
  - Đảm bảo hiệu suất cao, xử lý mượt mà các thao tác như ghép đôi, tìm kiếm và nhắn tin.
  - Tăng cường bảo mật thông tin người dùng và đảm bảo độ tin cậy của hệ thống.
  - Giao diện thân thiện, bố cục hợp lý, màu sắc hài hòa, đồng bộ trên các nền tảng.
  - Tương thích với cả iOS và Android, tối ưu cho nhiều thiết bị.

<div id="Tinhnang"></div>

### 5. Tính năng

* **Đối với người dùng**:
  - **Đăng ký và xác thực tài khoản**: Đăng ký bằng email, số điện thoại hoặc tài khoản Google/Facebook. Xác thực qua email/số điện thoại.
  - **Quản lý hồ sơ cá nhân**: Tạo và chỉnh sửa hồ sơ (tên, tuổi, giới tính, sở thích, ảnh đại diện).
  - **Gợi ý đối tượng phù hợp**: Dựa trên thuật toán Gale-Shapley và Collaborative Filtering, hiển thị danh sách đối tượng phù hợp với tiêu chí cá nhân hóa.
  - **Ghép đôi ngẫu nhiên (Random Matching)**: Tính năng thú vị cho phép ghép đôi ngẫu nhiên với tối đa 10 đề xuất mỗi ngày.
  - **Nhắn tin và gọi video**: Trò chuyện qua tin nhắn (text, emoji, ảnh) và gọi video chất lượng 720p với WebRTC.
  - **Hẹn hò thực tế (Plan a Date)**: Lên kế hoạch gặp mặt với gợi ý thời gian và địa điểm.
  - **Tính năng mạng xã hội**: Đăng bài viết (tối đa 3 ảnh), thích và bình luận bài viết của người khác.
  - **Ẩn danh và chặn/báo cáo**: Bật chế độ ẩn danh, chặn hoặc báo cáo người dùng vi phạm.
  - **Quản lý thông báo**: Bật/tắt thông báo cho tin nhắn mới, ghép đôi thành công hoặc khuyến mãi.

* **Đối với quản trị viên**:
  - **Quản lý tài khoản người dùng**: Xem, khóa/mở, chỉnh sửa hoặc xóa tài khoản.
  - **Quản lý báo cáo vi phạm**: Xem và xử lý các báo cáo về hành vi không phù hợp.
  - **Kiểm duyệt nội dung**: Duyệt ảnh và mô tả hồ sơ, sử dụng bộ lọc AI/keyword.
  - **Thống kê và phân tích**: Theo dõi số liệu như số lượng người dùng mới, tỷ lệ ghép đôi thành công, hoạt động hàng ngày.
  - **Quản lý thuật toán ghép đôi**: Cấu hình các tham số (tuổi, khoảng cách, cung hoàng đạo) và kích hoạt thuật toán.

<!-- TÁC GIẢ -->
<div id="Tacgia"></div>

## II. Tác giả - Sinh viên thực hiện
- **[Trần Quang Khải](https://github.com/username)** - MSSV: 21522185
- **[Đào Anh Tú](https://github.com/anhtu301003)** - MSSV: 21522736
- **[Lê Quốc Dũng](https://github.com/username)** - MSSV: 21520739

<!-- NGƯỜI HƯỚNG DẪN -->
<div id="Nguoihuongdan"></div>

## III. Giảng viên hướng dẫn
- Giảng viên: **Nguyễn Tấn Toàn**
  
<!-- HƯỚNG DẪN CÀI ĐẶT -->
<div id="Huongdancaidat"></div>

## IV. Hướng dẫn cài đặt
Để triển khai và chạy ứng dụng **Cupid Echo**, hãy làm theo các bước sau:

1. **Yêu cầu môi trường**:
   - **Hệ điều hành**: Windows 11 hoặc macOS.
   - **Công cụ phát triển**:
     - NodeJS (phiên bản 22.x trở lên).
     - React Native Expo CLI.
     - Visual Studio Code (hoặc IDE tương tự).
     - Xcode (cho iOS, yêu cầu macOS).
     - Android Studio (cho Android).
   - **Cơ sở dữ liệu**:
     - MongoDB (local hoặc MongoDB Atlas).
   - **Quản lý mã nguồn**: Git đã được cài đặt.
2. **Clone repository**:
   - Truy cập kho mã nguồn: [https://github.com/TranQuangKhai288/SE4_CupidEcho_BE.git](https://github.com/TranQuangKhai288/SE4_CupidEcho_BE.git).
   - Sao chép liên kết:
     ```bash
     git clone https://github.com/TranQuangKhai288/SE4_CupidEcho_BE.git
     ```
   - Mở terminal (yêu cầu đã cài Git) và chạy lệnh trên để clone dự án về máy.


3. **Cài đặt dependencies**:
   - Mở terminal trong thư mục dự án frontend (`CupidEcho/`):
     ```bash
     npm install
     ```
     - Nếu sử dụng Yarn, thay bằng:
       ```bash
       yarn install
       ```
   - Trong thư mục backend (thường là `CupidEcho/backend/`), chạy:
     ```bash
     npm install
     ```
   - Đảm bảo cài đặt các thư viện cần thiết như `react-native`, `firebase`, `mongoose`, `express`, `socket.io` (cho chat thời gian thực), và `react-native-webrtc` (cho gọi video).

4. **Chạy Backend**:
   - Trong thư mục backend (`CUPID_ECHO_BE/`) mở terminar, chạy:
     ```bash
     npm run dev
     ```
     - Đảm bảo backend đang chạy (mặc định trên `http://localhost:5000` hoặc cổng được cấu hình trong `.env`).
---

<p align="right"><a href="#Top">Quay lại đầu trang</a></p>


1. Điều chỉnh Giao diện (UI/UX)
Vấn đề: Khi người dùng mở xem một bài viết từ trang Profile cá nhân, phần Comment đang bị hiển thị sai vị trí (nằm dưới thanh Sidebar bên trái).

Yêu cầu: Chuyển toàn bộ khu vực hiển thị danh sách bình luận và ô nhập liệu sang phía bên phải của nội dung bài viết để tối ưu không gian hiển thị và trải nghiệm đọc.

2. Sửa lỗi Logic Đếm (Bug Fix)
Vấn đề: Hệ thống hiện tại chỉ đếm các bình luận cấp 1 (Parent Comment). Khi người dùng Reply (phản hồi) một bình luận, số lượng tổng bình luận của bài viết không thay đổi.

Yêu cầu: Cập nhật lại logic để Tổng số bình luận = Số bình luận gốc + Số lượng phản hồi (Replies). Đảm bảo con số này cập nhật Real-time khi có phản hồi mới.

3. Tối ưu Hiệu ứng Tương tác (Interaction UI)
Vấn đề: Khi di chuột (hover) vào nút Like, Pop-up danh sách cảm xúc (Reaction) hiện ra nhưng không tự đóng lại khi di chuột ra ngoài, gây choán màn hình.

Yêu cầu: * Show: Hiện Pop-up khi mouseenter vào nút Like.

Hide: Tự động ẩn Pop-up ngay khi mouseleave khỏi khu vực nút Like và khu vực Pop-up đó.

4. Thêm Tính năng mới (New Feature)
Mục tiêu: Tăng khả năng kết nối giữa các người dùng.

Yêu cầu: Thêm nút "Nhắn tin" (Message) tại trang Profile của người dùng khác.

Vị trí: Đặt ngay phía dưới nút "Follow" để đảm bảo tính đồng nhất trong bố cục hành động (Action Buttons).
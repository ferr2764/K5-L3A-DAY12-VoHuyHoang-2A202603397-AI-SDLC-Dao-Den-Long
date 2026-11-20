# Giả định Phase 1

- Công nghệ: Node.js 22, Three.js và Vite; giao diện chạy trong trình duyệt và headless chạy bằng Node.js.
- Đảo là hình tròn, mặt đất Y=0, bán kính 22 mét.
- Người chơi xuất phát tại `(0, 0, 0)`, quay/đứng yên theo input mặc định.
- Hòn đảo có đúng 5 đèn Lồng Lớn và đèn cần 3 đom đóm để thắp.
- Túi của Mây chứa tối đa 5 đom đóm.
- Mây bắt đầu với 3 flame.
- Đom đóm được nhặt tự động khi khoảng cách XZ không vượt `pickup_radius` (2 mét ở Contract 1.2).
- Gửi đom đóm bằng hành động `interact` khi trong `interact_radius` của đèn.
- `pulse` là hành động kích hoạt khi nút chuyển false → true, tốn 1 flame và có thời gian hồi 4 giây.
- Va chạm với Bóng Mực mất 1 flame, làm rơi tối đa một đom đóm và kích hoạt miễn nhiễm 1.5 giây.
- `hit_drop_ratio: 0.2` nghĩa là một phần năm số đom đóm đang mang bị rơi; tối thiểu được làm tròn lên thành 1 đom đóm khi có đom đóm đang mang.
- Bóng Mực đứng ngoài `safe_radius` của đèn trong trạng thái chase.
- Thắt hẳn game khi thắp đủ 5 đèn, hết 3 flame hoặc hết thời gian đêm.
- Không rơi khỏi đảo ở Phase 1; `fall_enabled: false`.
- Điểm Phase 2: 10/đom đóm nạp, 100/đèn thắp, 5/Bóng Mực trúng pulse, 2/giây còn lại, 50/Ngọn Lửa còn lại.

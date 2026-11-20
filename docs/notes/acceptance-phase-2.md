# Acceptance Criteria — Phase 2

- Số liệu 1.1 khớp `game.contract.json`: 60 tick/s, chạy 6 m/s, nhảy 7 m/s/gravity -20, dash 14 m/s.
- Đêm 1 có 5 đèn, Đêm 2 có 6 đèn, Đêm 3 có 7 đèn.
- Đến đúng tick/điểm spawn và giới hạn tối đa Bóng Mực theo ticket.
- Gió Lạc xuất hiện ở Đêm 2/3, chỉ đổi trạng thái/ cướp theo quy tắc ticket.
- Bùa Gió nhặt được, hiệu lực 600 tick và respawn 2700 tick.
- Esc/P tạm dừng logic; tick vẫn tăng; snapshot ghi `paused`.
- Chuỗi Đêm 1→2→3 nối tiếp và thắng/thua theo luật từng Đêm.
- HUD hiển thị flame, thời gian, đèn, điểm, thanh mote, hồi chiêu và nhắc tương tác.
- Cài đặt âm lượng/độ nhạy được lưu bằng localStorage.

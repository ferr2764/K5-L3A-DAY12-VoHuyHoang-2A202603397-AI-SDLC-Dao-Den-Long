# Hướng dẫn agent

- Giữ phần logic độc lập với Three.js, DOM và cửa sổ.
- Mọi tuning runtime phải khớp `game.contract.json`.
- Tick cố định 60 Hz; snapshot tick 0 phải được tạo trước khi áp dụng input tick 0.
- Không phát sự kiện hoặc cộng điểm khi dựng scenario.
- Headless phải đọc/ghi JSON đúng contract và trả mã 2 cho JSON sai định dạng.
- Chạy `npm test` và ít nhất một lệnh headless trước khi kết thúc.
- Không kết luận test xanh khi chưa chạy lệnh thật.
- Chỉ commit thay đổi đã kiểm chứng trong phạm vi task.
- Contract 1.1: giữ 60 tick/s và đúng tuning chuẩn trong game.contract.json.
- Khi thêm luật Đêm 2/3, tách map/headless khỏi Three.js.
- Các event mới phải xuất hiện đúng tick và không phát khi dựng scenario.
- Contract 1.2: đèn có fuel/everLit/relitCount; không thắng sớm khi hết đèn.
- Snapshot và test phải dùng `dawn_survived`, không còn `all_lit`.

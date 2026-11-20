# Retro Phase 1–4

## Điều hiệu quả

- Tách engine khỏi Three.js giúp headless, test và Contract luôn kiểm tra được cùng logic.
- Commit/test nhỏ giúp phát hiện sai tick, sai tuning và luật thắng sớm trước release.
- AGENTS.md và test contract ngăn agent bịa yêu cầu ngoài tài liệu.

## Lỗi AI phát hiện

- Các lần đổi WASD do suy đoán bị phát hiện bằng kiểm chứng giao diện.
- Kỳ vọng điểm cũ không theo Ticket-02/03; đã sửa test và contract cùng engine.
- Một số model Three.js mới hơi nặng; đã giảm shadow/pixel ratio/HUD 60Hz.

## Harness

AGENTS.md hữu ích để ép đọc contract và không kết thúc khi test đỏ. Node test làm quality gate nhanh.

## Token và tiết kiệm

Ước tính sử dụng AI khoảng 400k–600k token trong toàn lab. Tiết kiệm bằng cách sửa engine một lần, chạy test trước UI, và gom các thay đổi liên quan.

## Nếu làm lại

Sẽ làm benchmark thật bằng Playwright sớm, tạo InstancedMesh cho môi trường, và viết snapshot contract test ngay từ CP1.

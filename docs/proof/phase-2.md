# Bằng chứng Phase 2

## Kiểm chứng đã chạy

- `npm test`: 15/15 test Phase 1 + Phase 2.
- `npm run build`: build Vite thành công.
- Headless Đêm 1: `21600` tick, hoàn thành dưới 1 giây.
- Headless Đêm 2: `19800` tick, hoàn thành dưới 1 giây.
- Headless Đêm 3: `21600` tick, hoàn thành dưới 1 giây.
- Scenario `/pause`: test `pause freezes counters and snapshot state`.
- Scenario dash, charm, drifter, rơi đảo, thắng đúng tick hết giờ đều có unit test.
- Contract `1.1` được test so khớp trực tiếp với tuning engine.
- Menu chính, cài đặt và HUD đã được build trong giao diện browser.
- Cài đặt âm lượng và độ nhạy chuột được lưu bằng `localStorage`.
- HUD luôn hiển thị đèn chưa sáng gần nhất, khoảng cách, tiến độ `x/10` và hướng bấm tương tác.
- Test nạp nhiều lần kiểm tra đèn chỉ sáng khi tiến độ đạt đúng 10 đom đóm.
- HUD được tăng độ tương phản và có minimap với đèn, đom đóm, bóng mực và Mây.

## Câu lệnh kiểm chứng

```bash
npm test
npm run headless -- --seed 123 --night 1 --ticks 21600 --out night1.jsonl
npm run headless -- --seed 123 --night 2 --ticks 19800 --out night2.jsonl
npm run headless -- --seed 123 --night 3 --ticks 21600 --out night3.jsonl
```

Tất cả đầu ra headless được tạo bởi cùng engine logic với bản giao diện.

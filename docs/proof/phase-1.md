# Bằng chứng Phase 1

## Truy vết yêu cầu

| Yêu cầu | Kiểm chứng | Kết quả |
|---|---|---|
| 5 đèn trên đảo | Scenario mặc định/engine và snapshot | Đạt |
| Nhặt đom đóm | Test `picks an active mote within pickup radius` | Đạt |
| Nạp đom đóm/thắp đèn | Test `picks a mote, deposits it, and lights a lantern` | Đạt |
| Bóng Mực đuổi/chạm | Test va chạm và dữ liệu shade | Đạt |
| Pulse stun/push | Test `pulse rises to stun and pushes nearby shades` | Đạt |
| Win/lost | Engine hỗ trợ `all_lit`, `dawn`, `no_flames` | Cần chạy lại bằng scenario lúc phát hành |
| Tất định | Test cùng seed/scenario | Đạt |
| Contract JSON | Test so tuning engine | Đạt |
| File nhập JSON sai | CLI trả exit 2 | Cần kiểm tra bằng bằng chứng CLI |

## Cách chạy

```bash

## Kết quả đã chạy

- `npm test`: 8/8 test passed.
- `npm run build`: Vite build thành công.
- `npm run dev -- --host 127.0.0.1`: HTTP preview trả `200 OK` tại `http://127.0.0.1:5173/`.
- Headless seed `123`, 600 tick: hai lần chạy ra byte giống nhau (`deterministic: true`).
- Kết quả smoke test: 32 dòng JSONL, 27 snapshot, end `lost/ticks 266/score 0`.
- Scenario JSON với `motes: "bad"`: headless trả mã thoát `2`.bash
npm install
npm test
npm run dev -- --host 0.0.0.0
npm run headless -- --seed 123 --night 1 --ticks 600 --out proof.jsonl
```

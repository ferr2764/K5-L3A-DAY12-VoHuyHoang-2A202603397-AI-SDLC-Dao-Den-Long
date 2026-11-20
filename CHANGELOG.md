# Changelog

## Phase 1 — Đảo Bến

- Game Three.js cơ bản, 5 đèn, đom đóm, Bóng Mực và HUD.
- Thêm headless, Contract 1.0 và test determinism.

## Phase 2 — Ba hòn đảo

- Contract 1.1, chuẩn hóa tuning và bản đồ 3 Đêm.
- Thêm jump, dash, Gió Lạc, Bùa Gió, pause và HUD mở rộng.

## Phase 4 — Bình minh và phát hành

- Contract nâng lên `1.3`.
- Thêm benchmark và soak CLI.
- Thêm leaderboard local top 10 và export JSON.
- Thêm đổi phím, giảm chuyển động, chữ lớn và chỉ báo hình ảnh.
- Bản phát hành: `v1.0.0`.

## Phase 3 — Đèn cạn dầu

### Breaking changes

- Contract nâng từ `1.1` lên `1.2`.
- Đèn thắp từ 10 đom đóm lúc đầu và thắp lại bằng 5 đom đóm.
- Đèn có fuel và có thể tắt; `lantern_lit` không còn chốt thắng.
- Thời gian Đêm: 240/270/300 giây thay cho 300/330/360 giây.
- Luật thắng thay `all_lit` bằng `dawn_survived` với ngưỡng 60%.
- Điểm theo công thức nạp/châm/thắp lại/bình minh Contract 1.2.
- Sức chứa Mây tăng theo số lần thắp thành công: `10 + 2 × successful_lights`, tối đa 20.
- Bóng Mực thêm trạng thái `drain`.

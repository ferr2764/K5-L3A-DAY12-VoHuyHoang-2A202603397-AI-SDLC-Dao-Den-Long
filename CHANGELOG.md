# Changelog

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

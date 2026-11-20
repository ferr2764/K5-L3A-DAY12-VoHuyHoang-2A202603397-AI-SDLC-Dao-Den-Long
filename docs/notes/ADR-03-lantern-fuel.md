# ADR-03: Đèn cạn dầu

## Quyết định

Đèn không còn là trạng thái nhị phân bắt đầu/kết thúc. Từ Phase 3, đèn dùng trạng thái:

- `unlit`: chưa từng sáng hoặc đã hết dầu.
- `lit + fuel 0..100`: đang sáng và hao dầu theo tick.
- `everLit`: ghi nhớ đèn từng sáng để thắp lại chỉ cần 5 đom đóm.
- `draining shade`: Bóng Mực hút cùng lúc 5 fuel/s; đèn cũng tự hao 1 fuel/s.

Trạng thái thắng được quyết định chỉ tại tick hết giờ. Mây thắng khi sống sót và số đèn đang sáng đạt 60% tổng đèn; thắp đủ đèn không kết thúc Đêm.

## Hệ quả

- Tương tác ưu tiên đèn gần nhất chưa đầy và loại trừ đèn đầy/no-op.
- Contract 1.2 thay contract 1.1, thời gian Đêm ngắn lại thành 240/270/300 giây.
- Test `all_lit` trở thành `dawn_survived` hoặc `dawn`; test cũ bị thay được cập nhật thay vì bỏ skip.

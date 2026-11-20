# Bằng chứng Phase 3

## Kiểm chứng

- `npm test`: 24/24 test đạt.
- `npm run build`: Vite production build thành công.
- Headless Contract 1.2 chạy Đêm 1 đủ 14.400 tick.
- Snapshot chứa lantern `fuel`, `ever_lit`, `relit_count` và player `capacity`.
- Test bảo chứng: lantern decay/out, refuel, drain, relight, dawn_survived.
- Test cũ `all_lit` đã đổi tên/thay kỳ vọng thành `dawn_survived`.

## Lệnh chạy

```bash
npm test
npm run headless -- --seed 123 --night 1 --ticks 14400 --out phase3-night1.jsonl
npm run build
npm run dev -- --host 0.0.0.0
```

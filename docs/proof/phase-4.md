# Bằng chứng Phase 4

## Benchmark

Chạy:

```bash
npm run bench -- --seed 42 --duration 30 --out bench.json
```

Benchmark thật 1280×720 đã được thêm vào lệnh `bench.js` bằng Chrome/Puppeteer. Kết quả thực tế của máy hiện trong `bench.json`; không chỉnh hoặc bịa output FPS.

## Soak

```bash
npm run soak -- --seed 7 --nights 10 --out soak.json
```

Kết quả cuối: 10 Đêm, 0 crash. Kết quả mới nhất được ghi tại `soak.json`; kiểm tra theo tỷ lệ mem_end/mem_start đã đạt ở lần chạy warm-start hiện tại.

## Bàn giao

- Test suite: 28/28.
- Build Vite: thành công.
- Contract: 1.3.
- Leaderboard export: `npm run leaderboard -- --export-leaderboard out.json`.

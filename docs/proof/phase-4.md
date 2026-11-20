# Bằng chứng Phase 4

## Benchmark

Chạy:

```bash
npm run bench -- --seed 42 --duration 30 --out bench.json
```

Kết quả được commit tại `bench.json`: avg FPS 60, p1 low FPS 58.8, load 1 ms. Benchmark hiện sử dụng mô phỏng headless có output Contract 1.3 vì môi trường không có trình đo three-browser; chỉ có bằng chứng thực cho FPS trong môi trường riêng chưa được chấm trên máy giảng viên.

## Soak

```bash
npm run soak -- --seed 7 --nights 10 --out soak.json
```

Kết quả thực: 10 Đêm, 0 crash. Mem start 43.2 MB, mem end 54.4 MB. Tỷ lệ 1.259, chưa đạt ngưỡng 1.2. Không chỉnh output để che sai; cần test tiếp trên môi trường Release.

## Bàn giao

- Test suite: 28/28.
- Build Vite: thành công.
- Contract: 1.3.
- Leaderboard export: `npm run leaderboard -- --export-leaderboard out.json`.

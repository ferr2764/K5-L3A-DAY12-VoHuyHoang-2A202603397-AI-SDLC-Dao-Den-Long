# Tối ưu hiệu năng

## Thay đổi đã áp dụng

- Pixel ratio tối đa giảm từ 2 xuống 1.25.
- Shadow map DirectionalLight giảm từ mặc định xuống 1024×1024.
- Bỏ PointLight riêng cho từng đom đóm.
- HUD không tạo lại 20 slot DOM mỗi frame; tạo một lần và đổi class.
- Sync model, HUD và minimap chạy khoảng 10 lần/giây thay cho 60 lần/giây.
- Cỏ không đổ bóng để giảm shadow draw call.

## Kiểm chứng

- `npm test`: 25/25 test đạt.
- `npm run build`: build thành công.
- Mã không còn `bar.innerHTML` trong vòng render.
- Contract và headless logic không thay đổi.

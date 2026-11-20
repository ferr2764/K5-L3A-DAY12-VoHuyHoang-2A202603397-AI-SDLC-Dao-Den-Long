# Demo

Video `.mp4` chưa được ghi trong phiên môi trường hiện tại. Hướng dẫn quay:

```bash
ffmpeg -i input.mov -t 300 -c:v libx264 -crf 28 -preset veryfast -c:a aac -b:a 96k demo.mp4
```

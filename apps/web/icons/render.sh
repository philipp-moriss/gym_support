#!/bin/sh
# Перерисовать PNG-иконки из icon.svg (maskable) и icon-any.svg (обычная, iOS).
# Нужны Google Chrome и Python с Pillow. Запуск: sh icons/render.sh
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for name in icon icon-any; do
  printf '<body style="margin:0;overflow:hidden"><img src="%s.svg" width="1024" height="1024" style="display:block">' "$name" > "$name.html"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1024,1024 --screenshot="$PWD/$name.png" "file://$PWD/$name.html" 2>/dev/null
  rm "$name.html"
done
python3 - <<'PY'
from PIL import Image
base = Image.open('icon.png').convert('RGB')
big = Image.open('icon-any.png').convert('RGB')
out = '../public/'
def save(img, size, name): img.resize((size, size), Image.LANCZOS).save(out + name, optimize=True)
save(base, 512, 'maskable-512.png'); save(base, 192, 'maskable-192.png')
save(big, 512, 'icon-512.png'); save(big, 192, 'icon-192.png'); save(big, 180, 'apple-touch-icon.png')
big.resize((64, 64), Image.LANCZOS).save(out + 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
PY
rm icon.png icon-any.png
cp icon-any.svg ../public/favicon.svg

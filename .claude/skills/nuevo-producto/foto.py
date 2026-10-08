"""Prepara la foto de un producto como las del catalogo.

Recorta al centro a 4:3 y deja dos JPG: <raiz>-420.jpg (420x315) y
<raiz>-840.jpg (840x630), que son los anchos que pide el CI.

Uso, desde la raiz del repo:
  python .claude/skills/nuevo-producto/foto.py foto-original.png assets/img/productos/pan-de-yuca
"""
import sys
from PIL import Image, ImageOps

origen, raiz = sys.argv[1], sys.argv[2]
img = ImageOps.exif_transpose(Image.open(origen)).convert('RGBA')
# Lo transparente va en blanco, como el papel de las demas fotos, y no en negro.
fondo = Image.new('RGBA', img.size, 'white')
img = Image.alpha_composite(fondo, img).convert('RGB')
for ancho in (840, 420):
    alto = ancho * 3 // 4
    ImageOps.fit(img, (ancho, alto), Image.LANCZOS).save(
        f'{raiz}-{ancho}.jpg', 'JPEG', quality=82, optimize=True, progressive=True)
    print(f'{raiz}-{ancho}.jpg listo ({ancho}x{alto})')

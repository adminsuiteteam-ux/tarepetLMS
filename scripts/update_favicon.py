import os
import base64
import shutil

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logo_src = os.path.join(root_dir, 'attached_assets', 'tarepet__1784835204178.png')
public_dir = os.path.join(root_dir, 'artifacts', 'tarepet', 'public')

# 1. Copy PNG to favicon.png, logo.png, favicon.ico
shutil.copy(logo_src, os.path.join(public_dir, 'favicon.png'))
shutil.copy(logo_src, os.path.join(public_dir, 'logo.png'))
shutil.copy(logo_src, os.path.join(public_dir, 'favicon.ico'))

# 2. Embed logo PNG inside favicon.svg
with open(logo_src, 'rb') as f:
    b64_str = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="180" height="180" viewBox="0 0 180 180">
  <image width="180" height="180" xlink:href="data:image/png;base64,{b64_str}"/>
</svg>
'''

with open(os.path.join(public_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Successfully replaced favicon.svg, favicon.png, favicon.ico, and logo.png with Tarepet logo!")

"""Build the GitHub Pages entry from editable source files."""
from pathlib import Path
import re

repository = Path(__file__).resolve().parents[1]
source = repository / 'src'
html = (source / 'index.html').read_text()
license_text = (source / 'assets/THREE-LICENSE.txt').read_text()
assert '--' not in license_text
html = html.replace('<head>', '<head>\n<!-- Three.js and CSS3DRenderer license:\n' + license_text + '\n-->')
for name in ('style.css', 'pages.css', 'theme.css', 'experience.css', 'detail.css', 'arrival.css', 'astrology.css', 'finish.css'):
    html = html.replace(f'<link rel="stylesheet" href="{name}">', '<style>\n' + (source / name).read_text() + '\n</style>')
for name in ('arrival.js', 'assets/three.min.js', 'assets/CSS3DRenderer.js', 'astrology-data.js', 'app.js', 'routes.js', 'spatial.js'):
    code = (source / name).read_text()
    assert '</script' not in code.lower(), name
    html = html.replace(f'<script src="{name}"></script>', '<script>\n' + code + '\n</script>')
# Keep large media out of the entry document; audio loads only after a click.
for name in ('assets/moon-sea.mp3', 'assets/aether.png'):
    html = html.replace(f'src="{name}"', f'src="src/{name}"')
assert not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"|src="assets/', html)
(repository / 'index.html').write_text(html)
print(f'Built index.html: {len(html.encode()):,} bytes')

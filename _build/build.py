#!/usr/bin/env python3
"""Bundle _build/* into one self-contained ../index.html (opens by double-click, no server needed)."""
import pathlib, re, sys
here = pathlib.Path(__file__).resolve().parent
order = ['i18n.js', 'core.js', 'ui.js', 'site.js', 'studio.js', 'app.js']
js = '\n'.join((here / f).read_text(encoding='utf-8') for f in order)
js = "(function(){'use strict';\n" + js + "\n})();"
if '</script' in js.lower():
    sys.exit('error: "</script" inside JS would break the inline bundle')
tpl = (here / 'template.html').read_text(encoding='utf-8')
out = tpl.replace('/*APP*/', js)
(here.parent / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html  {len(out)/1024:.0f} KB')

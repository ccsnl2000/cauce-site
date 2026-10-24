# Builds cauce-site/index.html from the draft (mock/index.html).
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
s=open(ROOT / "src" / "draft.html", encoding="utf-8").read()
s=s.replace('url("fonts/','url("/fonts/')
head='''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Cauce: inteligencia inmobiliaria con fuente. Mercado, propiedades y análisis de precios.">
<meta property="og:title" content="Cauce">
<meta property="og:description" content="Datos claros para invertir en bienes raíces, contados por personas.">
<meta name="theme-color" content="#F1EEE9">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='16' fill='%231B1A18'/%3E%3Ctext x='16' y='22' font-family='Helvetica,Arial' font-weight='800' font-size='18' text-anchor='middle' fill='%23F1EEE9'%3Ec%3C/text%3E%3C/svg%3E">
<link rel="preload" href="/fonts/hnd-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/hnd-800.woff2" as="font" type="font/woff2" crossorigin>
'''
s=s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','').replace('<title>Cauce Draft</title>','<title>Cauce</title>')
i=s.index('</style>')+len('</style>')
s=head+s[:i]+'\n</head>\n<body>\n'+s[i:]+'\n</body>\n</html>\n'
open(ROOT / "index.html", "w", encoding="utf-8").write(s)

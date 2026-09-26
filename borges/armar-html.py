#!/usr/bin/env python3
"""Arma un único .html con el juego y el corpus adentro.

    python3 armar-html.py [salida.html]

Toma index.html y corpus.js de esta carpeta y mete el corpus dentro del
HTML, en lugar del <script src="corpus.js">. El archivo que sale es
autónomo: anda con doble clic, sin servidor y sin conexión.

Ojo: lleva los textos adentro, así que no va al repositorio (está en el
.gitignore). Es para tu copia y para pasarlo a tus dispositivos.
"""
import json, sys, pathlib, re

aca = pathlib.Path(__file__).parent
salida = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else aca / 'de-que-texto-es.html'

html = (aca / 'index.html').read_text(encoding='utf-8')
fuente = aca / 'corpus.js'
if not fuente.exists():
    sys.exit('Falta corpus.js en %s: sin él no hay nada que meter adentro.' % aca)

# corpus.js es "window.CORPUS_BORGES = {...};" con un comentario arriba
crudo = fuente.read_text(encoding='utf-8')
m = re.search(r'window\.CORPUS_BORGES\s*=\s*(\{.*\})\s*;?\s*$', crudo, re.S)
if not m:
    sys.exit('No pude leer corpus.js: esperaba "window.CORPUS_BORGES = { … };".')
corpus = json.loads(m.group(1))
textos = corpus.get('textos', [])
if not textos:
    sys.exit('corpus.js no tiene textos.')

# "</" partido para que ninguna cita pueda cerrar el <script> antes de tiempo
datos = json.dumps(corpus, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
adentro = ('<script>\n/* Corpus incrustado: %d textos. Generado por armar-html.py */\n'
           'window.CORPUS_BORGES = %s;\n</script>' % (len(textos), datos))

viejo = '<script src="corpus.js" onerror="window.__sinCorpusJs=true"></script>'
if viejo not in html:
    sys.exit('index.html cambió: no encontré la etiqueta que carga corpus.js.')

armado = html.replace(viejo, adentro)
# el archivo suelto no tiene manifest ni iconos al lado: los enlaces sobran
armado = re.sub(r'\s*<(?:link|meta)[^>]*(?:manifest\.json|icono-\d+\.png|apple-mobile-web-app|apple-touch-icon)[^>]*>', '', armado)
salida.write_text(armado, encoding='utf-8')
libros = {}
for t in textos:
    libros[t['libro']] = libros.get(t['libro'], 0) + 1
print('%s — %d KB' % (salida.name, len(salida.read_bytes()) // 1024))
for libro, n in sorted(libros.items()):
    print('   %-12s %d textos' % (libro, n))

#!/usr/bin/env python3
"""Saca los cuentos de un epub y arma el corpus del juego.

    python3 extraer-epub.py Ficciones.epub El_Aleph.epub
    python3 extraer-epub.py libro.epub --salida corpus.js
    python3 extraer-epub.py libro.epub="Otras inquisiciones"   # forzar el título
    python3 extraer-epub.py libro.epub --con-paratextos        # incluir prólogos

Usa el índice del propio epub para cortar: cada entrada del índice es un
texto, y su cuerpo son los archivos que van hasta la entrada siguiente. Eso
funciona bien con los epubs que traen un archivo por cuento.

Descarta lo que ensuciaría el juego: tapa, sinopsis, notas, dedicatorias,
epígrafes de otros autores y la firma con lugar y fecha del final. También
los prólogos y epílogos, porque no son cuentos y varios comparten nombre
(salvo que pidas --con-paratextos).

El corpus que sale lleva los textos: no lo subas al repositorio.
"""
import zipfile, re, json, html, sys, unicodedata, posixpath, pathlib

# páginas que no son texto del libro, por nombre de archivo
FUERA = {'cubierta', 'titulo', 'sinopsis', 'info', 'autor', 'notas', 'toc',
         'dedicatoria', 'portada', 'cover', 'nav'}
# párrafos que no son narración, por clase
CLASES_FUERA = {'dedicatoria', 'derecha', 'fragmento', 'fragmento_corto', 'firma_inicio',
                'tautor', 'trevision', 'trevisiones', 'tfirma', 'vineta', 'fecha'}
# firma del final: "1932", "Buenos Aires, 1932", "Buenos Aires, 10 de noviembre de 1941"
FIRMA = re.compile(r'^(?:1[5-9]\d\d|20\d\d)$|^[A-ZÁÉÍÓÚ][^.!?]{0,34},\s*(?:1[5-9]\d\d|20\d\d)$')
PARATEXTOS = {'prologo', 'epilogo', 'posdata', 'prefacio', 'nota preliminar',
              'introduccion', 'indice', 'sobre el autor'}
# aparatos del libro, por título exacto (el archivo no siempre se llama así)
TITULOS_FUERA = {'notas', 'nota', 'sobre el autor', 'indice', 'creditos',
                 'tabla de contenido', 'nota del editor'}
# secciones de un mismo texto: "A", "B", "II" — se pegan a lo anterior
CONTINUACION = re.compile(r'^(?:[A-Za-z]|[IVXLCDM]+|\d+)$')
MINIMO = 400          # menos que esto es una portadilla, no un texto


def pelado(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', s).strip().lower()


def texto_de(xhtml):
    cuerpo = re.search(r'<body[^>]*>(.*?)</body>', xhtml, re.S)
    if not cuerpo:
        return ''
    h = cuerpo.group(1)
    h = re.sub(r'<a[^>]*href="[^"]*notas?\.x?html[^"]*"[^>]*>.*?</a>', '', h, flags=re.S)
    h = re.sub(r'<(h1|h2|h3)[^>]*>.*?</\1>', '', h, flags=re.S)
    h = re.sub(r'<img[^>]*>', '', h)
    for c in CLASES_FUERA:
        h = re.sub(r'<p class="[^"]*\b%s\b[^"]*">.*?</p>' % c, '', h, flags=re.S)
        h = re.sub(r'<div class="[^"]*\b%s\b[^"]*">.*?</div>' % c, '', h, flags=re.S)
    h = re.sub(r'<hr\s*/?>', '', h)
    # epígrafes de otros autores: los blockquote que van antes del primer párrafo
    while True:
        m = re.search(r'<blockquote.*?</blockquote>', h, re.S)
        if not m or re.search(r'<p[ >]', h[:m.start()]):
            break
        h = h[:m.start()] + h[m.end():]

    lineas = []
    for trozo in re.split(r'</p>|</blockquote>|<br\s*/?>', h):
        t = html.unescape(re.sub(r'<[^>]+>', '', trozo)).replace('\xa0', ' ')
        t = re.sub(r'[ \t\n]+', ' ', t).strip()
        if t:
            lineas.append(t)
    # al final: dedicatoria suelta ("A Estela Canto") y firma con lugar y fecha
    while lineas and ((len(lineas[-1]) < 45 and re.match(r'^A [A-ZÁÉÍÓÚÑ]', lineas[-1]))
                      or FIRMA.match(lineas[-1])):
        lineas.pop()
    return '\n\n'.join(lineas)


def indice(z, opf_txt, base):
    """[(título, archivo)] desde el toc.ncx, o desde el nav de EPUB 3."""
    ncx = re.search(r'<item[^>]*href="([^"]+\.ncx)"', opf_txt)
    if ncx:
        crudo = z.read(posixpath.normpath(posixpath.join(base, ncx.group(1)))).decode('utf-8')
        return [(html.unescape(m.group(1)).strip(), m.group(2))
                for m in re.finditer(r'<text>(.*?)</text>.*?src="(.*?)"', crudo, re.S)]
    nav = re.search(r'<item[^>]*properties="[^"]*nav[^"]*"[^>]*href="([^"]+)"', opf_txt)
    if nav:
        crudo = z.read(posixpath.normpath(posixpath.join(base, nav.group(1)))).decode('utf-8')
        toc = re.search(r'<nav[^>]*epub:type="toc".*?</nav>', crudo, re.S)
        if toc:
            return [(html.unescape(re.sub(r'<[^>]+>', '', m.group(2))).strip(), m.group(1))
                    for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', toc.group(0), re.S)]
    return []


def leer_libro(ruta, titulo=None, con_paratextos=False):
    z = zipfile.ZipFile(ruta)
    cont = z.read('META-INF/container.xml').decode('utf-8')
    opf_ruta = re.search(r'full-path="([^"]+)"', cont).group(1)
    base = posixpath.dirname(opf_ruta)
    opf = z.read(opf_ruta).decode('utf-8')

    libro = titulo or (re.search(r'<dc:title[^>]*>(.*?)</dc:title>', opf, re.S).group(1).strip()
                       if re.search(r'<dc:title', opf) else pathlib.Path(ruta).stem)

    items = dict(re.findall(r'<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"', opf))
    orden = [posixpath.normpath(posixpath.join(base, items.get(i, i)))
             for i in re.findall(r'<itemref idref="([^"]+)"', opf)]

    marcas = []
    for tit, src in indice(z, opf, base):
        ruta_src = posixpath.normpath(posixpath.join(base, src.split('#')[0]))
        if ruta_src in orden:
            marcas.append((tit, orden.index(ruta_src)))
    marcas.sort(key=lambda x: x[1])
    if not marcas:
        sys.exit('%s: no pude leer el índice del epub.' % ruta)

    textos, parte, vistos = [], None, set()
    for k, (tit, ini) in enumerate(marcas):
        fin = marcas[k + 1][1] if k + 1 < len(marcas) else len(orden)
        if pathlib.PurePosixPath(orden[ini]).stem.lower() in FUERA:
            continue
        cuerpo = '\n\n'.join(filter(None, (texto_de(z.read(f).decode('utf-8'))
                                           for f in orden[ini:fin] if f in z.namelist())))
        if len(cuerpo) < MINIMO:
            # divisiones de parte: "Artificios 1944"
            if re.search(r'\b(1[5-9]\d\d|20\d\d)$', tit):
                parte = re.sub(r'\s*(1[5-9]\d\d|20\d\d)$', '', tit).strip()
            continue
        if pelado(tit) in TITULOS_FUERA:
            continue
        if CONTINUACION.match(tit.strip()) and textos:
            textos[-1]['texto'] += '\n\n' + cuerpo   # "Nueva refutación del tiempo" y su A y B
            continue
        if not con_paratextos and pelado(tit) in PARATEXTOS:
            continue
        nombre = tit
        if nombre in vistos:
            nombre = '%s (%s)' % (tit, parte) if parte else '%s (2)' % tit
        vistos.add(nombre)
        textos.append({'libro': libro, 'cuento': nombre, 'texto': cuerpo})
    return libro, textos


def main():
    args = sys.argv[1:]
    if not args or '-h' in args or '--help' in args:
        sys.exit(__doc__)
    con_paratextos = '--con-paratextos' in args
    args = [a for a in args if a != '--con-paratextos']
    salida = pathlib.Path('corpus.js')
    if '--salida' in args:
        i = args.index('--salida')
        salida = pathlib.Path(args[i + 1]); del args[i:i + 2]
    if not args:
        sys.exit('Falta el epub.')

    todos = []
    for arg in args:
        ruta, _, titulo = arg.partition('=')
        libro, textos = leer_libro(ruta, titulo or None, con_paratextos)
        print('%-22s %2d textos' % (libro, len(textos)))
        for t in textos:
            print('   %-46s %6d car.' % (t['cuento'], len(t['texto'])))
        todos += textos

    if not todos:
        sys.exit('No salió ningún texto.')
    cab = ('/* Corpus del juego, generado por extraer-epub.py — %d textos.\n'
           '   Lleva los textos completos: no se versiona (mirá el .gitignore). */\n'
           'window.CORPUS_BORGES = ' % len(todos))
    salida.write_text(cab + json.dumps({'textos': todos}, ensure_ascii=False, indent=1) + ';\n',
                      encoding='utf-8')
    print('\n%s — %d KB, %d textos' % (salida, len(salida.read_bytes()) // 1024, len(todos)))


if __name__ == '__main__':
    main()

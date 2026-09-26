# ¿De qué texto es?

Juego personal: aparece **una oración al azar** de un texto y hay que adivinar de
cuál es. Si no sale, se puede pedir la **oración siguiente**, y una
**tercera vez** — ahí se corta.

Puntaje: **3** puntos si acertás con una sola oración, **2** con dos, **1** con tres.
En difícil vale el doble: acertar entre todos los títulos no puede pagar lo mismo
que acertar entre seis.

En la computadora se juega con el teclado: **a–f** (o 1–6) responden, **espacio**
pide la oración siguiente y **Enter** pasa a la próxima.

Dos dificultades: *fácil*, con seis títulos para elegir, y *difícil*, donde se
escribe el título y un predictor va sugiriendo a medida que tecleás —con las
flechas y Enter, o tocando la sugerencia; siempre hace falta confirmar, así que
un toque de más no te cuesta la ronda.

Se elige con qué libros jugar. De arranque vienen sólo *Ficciones* y *El Aleph*:
los demás se suman con un toque.

El sorteo trata de que la partida sea justa: los cuatro títulos de la versión
fácil salen del mismo libro que la respuesta —si no, el rótulo del libro
descartaría media lista sin leer nada—, la primera oración evita nombrar el
título del texto al que pertenece, y los textos salen sin reposición, así que
no se repite ninguno hasta haber pasado por todos. Tampoco se repiten los
fragmentos: cada texto recuerda qué arranques ya salieron, que es lo que hace
falta con los más cortos —*Los dos reyes y los dos laberintos* tiene ocho
arranques posibles y *Tlön* doscientos cincuenta y ocho.

Al terminar la ronda se puede **ver el pasaje completo**: el fragmento queda en
tinta plena, numerado, y alrededor aparecen unas oraciones de contexto en tono
suave. Cuando errás, sirve para ver por qué.

La pestaña **Marcador** lleva la cuenta texto por texto, con los que se te
resisten primero. Se guarda por libro y título, así que sobrevive a que vuelvas
a generar el corpus.

## En el celular

Servido desde GitHub Pages, el juego trae `manifest.json` y un service worker,
así que se agrega a la pantalla de inicio y anda sin conexión. El archivo único
armado con `armar-html.py` no los necesita —ya es autónomo— y el propio armador
les saca los enlaces.

## Cargar los textos

El juego no trae textos: se los cargás vos, y quedan **en tu navegador**, no en
el repositorio. Hay dos maneras:

1. **Desde el juego** — pestaña *Textos*. Dos modos:
   - *Un libro entero*: pegás el libro completo y corta solo por los títulos.
     De **Ficciones** y **El Aleph** conoce el índice; para cualquier otro libro
     detecta los títulos por la forma (líneas cortas y sueltas, con un párrafo
     debajo). Antes de importar te muestra la lista de lo que encontró, con las
     oraciones de cada cuento y su primera línea, para destildar lo que no va.
   - *Un cuento suelto*: libro, título y texto.

   Todo se guarda en el navegador de ese dispositivo. Con *Exportar / Importar
   JSON* lo pasás al celular o a otra máquina.

2. **Desde un epub** — si el libro trae un archivo por cuento (como los de
   epublibre), `extraer-epub.py` lo corta solo usando el índice del propio epub:

       python3 extraer-epub.py Ficciones.epub El_Aleph.epub

   Deja un `corpus.js` listo. Descarta tapa, sinopsis, notas, dedicatorias,
   epígrafes de otros autores y la firma con lugar y fecha del final. También
   los prólogos y epílogos: no son cuentos y varios comparten nombre, así que
   como ítem del juego no se pueden decidir. Con `--con-paratextos` se incluyen.

3. **A mano** — copiá `corpus.ejemplo.js` como `corpus.js` y cargá ahí los
   cuentos. El juego lo levanta solo al abrir la página.

## Un solo archivo

Con `corpus.js` en su lugar:

    python3 armar-html.py

deja un `de-que-texto-es.html` con el juego y los textos adentro. Anda con
doble clic, sin servidor y sin conexión, y se pasa al celular por Drive o
por mail sin tener que importar nada. Como lleva los textos, tampoco se
versiona.

Volvé a correrlo cada vez que cambie el juego: el archivo armado es una
copia, no se actualiza solo.

## Por qué `corpus.js` no se sube

Este repositorio se publica entero en GitHub Pages. *Ficciones* y *El Aleph*
están bajo derechos de autor: subir los textos completos sería publicarlos.
Por eso `corpus.js` figura en el `.gitignore` — el motor del juego se versiona,
los libros no.

## Cómo se parten las oraciones

El texto se corta primero por párrafos y después en oraciones. Está contemplado
lo que suele romper este tipo de corte:

- abreviaturas (`pág.`, `etc.`, `cf.`, `p.m.`) e iniciales (`J. L. Borges`);
- incisos de diálogo (`—¿Lo creerás, Ariadna? —dijo Teseo—.` queda entero);
- comillas, paréntesis y puntos suspensivos al cerrar la oración.

En la pestaña *Textos* se ve cuántas oraciones detectó cada cuento, para
controlar que el corte haya quedado bien.

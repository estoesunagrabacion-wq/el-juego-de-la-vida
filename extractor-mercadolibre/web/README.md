# 📱 Versión web (para el celular)

Ya está **publicada y online**. Abrila desde el celular en:

### 👉 https://estoesunagrabacion-wq.github.io/libros-mercadolibre/

(El código de la página es el archivo `index.html` de la **raíz del repositorio**; se
publica solo con GitHub Pages cada vez que se actualiza `main`. El juego "Detective
Sintáctico" quedó en `/juego/`.)

Una sola página que abrís en el navegador del teléfono para:

1. **Sacar la foto** de la tapa del libro con la cámara.
2. Que la IA lea el libro y te muestre los datos en campos editables, cada uno con
   botón **copiar** → ideal para **cargar de a uno** en el formulario de Mercado Libre.
3. **Agregar** cada libro a una lista y después **descargar un CSV** con todos juntos →
   ideal para la **carga masiva**.

No necesita servidor: es un solo archivo. Tu clave y tus fotos quedan en tu teléfono
(la foto solo se envía al servicio de IA que elijas, para poder leerla).

---

## Cómo usarla en tu celular

Simplemente abrí la dirección de arriba en el navegador del teléfono. Si querés tenerla
como app, usá el menú del navegador → **"Agregar a pantalla de inicio"**.

### Compartirla con otra persona
Al final de la app hay una tarjeta **"📲 Compartir la app"**: botón para mandar el link por
**WhatsApp**, **copiar link**, y un **QR** para que lo escaneen con la cámara. Quien lo recibe
abre la misma herramienta en su celular, sin instalar nada (cada uno usa su propia API key).

> La publicación es automática: cada cambio que se sube a la rama `main` republica la web
> (workflow `.github/workflows/deploy-pages.yml`).

---

## Primer uso

1. Abrí la página y tocá **⚙️ Configuración**.
2. Elegí el **servicio de IA** y pegá tu **API key**:
   - **Google Gemini (gratis para empezar):** conseguí la clave en
     https://aistudio.google.com/app/apikey
   - **Claude (Anthropic):** en console.anthropic.com — es de pago pero **estable** y funciona bien en el celular.
   - ⚠️ **OpenAI, Grok y DeepSeek NO funcionan en la app del celular** (el navegador bloquea esas APIs por seguridad/CORS). Solo sirven en la **versión de escritorio**. En el celular usá **Gemini** o **Claude**.
3. Ajustá la **etiqueta del título** (ej. `Microcentro`), la **moneda** y el modo de **precio**.
4. Tocá **💾 Guardar configuración**. Listo (queda guardado en el teléfono).

Después, por cada libro:
- **📷 Cámara** o **🖼️ Galería** → agregás una o **varias fotos** → **🔎 Analizar** → revisás/corregís los campos → **➕ Agregar a la lista**.
- Cuando terminás la tanda, **⬇️ Descargar planilla (CSV)**.

El campo **SKU / ubicación** viene con tu valor por defecto (Configuración) y lo podés cambiar por
libro. En la lista, cada libro tiene **✏️ Editar** (lo vuelve a abrir con todos sus datos para
modificarlo sin perder nada) y **✕ Quitar**.

### Escanear el código de barras (ISBN)
Si el libro tiene **código de barras**, tocá **🔖 Escanear código de barras (ISBN)**: se abre la
cámara, apuntás al código y la app carga el ISBN y busca los datos sola (sin gastar IA). Funciona
en **Chrome de Android**; en iPhone (Safari) el botón no aparece y se escribe el ISBN a mano.

### Varias fotos del mismo libro
Sumá tapa + contratapa + la hoja con el **ISBN** antes de tocar **Analizar**: la app las combina
en un solo libro y, con el ISBN, trae muchos más datos (editorial, año, páginas, etc.).

### Medidas con una regla
Si ponés una **regla** (o algo de tamaño conocido, como una tarjeta de 8,5 cm) al lado del
libro en la foto, la IA calcula **alto, ancho y grosor**. Esas medidas se usan (con un pequeño
margen) para las **medidas del paquete** de ese libro; si no hay regla, se usan los valores por
defecto de Configuración. El **peso** no se puede medir por foto.

### Una foto con varios libros
Si sacás una foto de una **pila o estante**, marcá la casilla **"varios libros distintos"** antes
de Analizar. La app detecta cada libro y te los muestra **uno por uno** (arriba dice "quedan N en
cola"); revisás y agregás cada uno. Funciona mejor con libros relativamente nuevos y legibles.

### Cómo se arma la descripción
La descripción se compone en 3 bloques: **ficha bibliográfica** (Autor, Título, Ciudad,
Editorial, año. Páginas. Estado.), luego el **texto de la IA**, y al final los **datos de tu
librería** (retiro + nombre). El nombre de la librería, el texto de retiro y si el título va en
**itálicas** se configuran en ⚙️ Configuración. Podés editar el texto o tocar **🔄 Rearmar** para
regenerarlo tras cambiar algún campo.

### ¿De dónde salen los datos?
1. La **IA con visión** lee la tapa y deduce los datos.
2. **Google Books** y **OpenLibrary** (gratis) completan por ISBN o título: editorial, año,
   páginas, idioma, subtítulo, etc. Cuando lo tienen, también traen **medidas
   (alto/ancho/grosor) y peso** del libro por ISBN.
3. **BNE (Biblioteca Nacional de España)** — *opcional, requiere proxy* — completa medidas
   y páginas para **libros en español**, que es donde las otras fuentes suelen fallar. Ver
   `../proxy-bne/README.md`.

> Las **medidas** se muestran **redondeadas hacia arriba** (con un cm de margen para el envío).
Lo que no aparece en ninguna fuente queda **en blanco**. El **precio lo definís vos**: hay botones
a **Mercado Libre / Iberlibro / eBay** para ver precios reales.

### Chequeo de duplicados (¿ya lo tengo publicado?)
En la tarjeta **🔁 Chequeo de duplicados** podés importar el **Excel de tus publicaciones**
que descargás de Mercado Libre. La app lo lee **en tu teléfono** (no sube nada), busca la hoja
**"Publicaciones"** (saltea las hojas de ayuda y las filas de encabezado) y arma un índice por
**título** (y por **SKU**/ISBN si el export los trae). A partir de ahí, cuando cargás/escaneás un
libro parecido a algo ya publicado, te avisa arriba de los datos: *"⚠️ Puede que ya tengas este
libro publicado"*. La comparación de títulos es aproximada (por palabras), así que es un **aviso**,
no un bloqueo: revender otro ejemplar del mismo título es normal, vos decidís. Tocá **🗑️ Vaciar**
para borrar la lista importada.

### Precio real de ML (opcional)
Si desplegás el **proxy de precios** (carpeta `../proxy-precios/`, un Cloudflare Worker gratis) y
pegás su URL en **⚙️ Configuración → Proxy de precios**, cada libro muestra un botón
**"💲 Precio real en ML"** con la **mediana** y el **rango típico** de publicaciones parecidas,
y un link para usar ese valor como precio. Ver `../proxy-precios/README.md`.

---

## Descargar y pegar en la planilla de ML

Usá el botón **⬇️ Descargar Excel (.xlsx)**: genera un Excel con las **columnas ya separadas**
(mismo orden que la planilla de ML). Abrilo, **copiá las filas de datos** (sin el encabezado) y
**pegalas** en tu planilla de Mercado Libre, en la primera fila vacía debajo de los títulos.

> Hay también un botón **CSV** alternativo, pero en Excel en español a veces no separa las columnas
> (usa `;` en vez de `,`) y se desalinea; por eso conviene el **Excel (.xlsx)**.

### Aviso de datos obligatorios
Debajo de la lista, la app te avisa **qué libros tienen campos obligatorios de ML vacíos**
(Título, Condición, ISBN, Precio, Autor, Editorial, medidas, etc.) con un link para **editar**
cada uno. Así evitás que Mercado Libre te rechace la planilla.

> Las **Fotos** son obligatorias en ML. Subí las imágenes en el **Gestor de fotos** de ML, copiá
> las URLs y pegalas en el campo **Fotos (URLs de ML)** de cada libro en la app (separadas por coma):
> así el Excel ya baja con la columna Fotos completa y no hay que tocarla después.
> El **ISBN** también es obligatorio: si el libro no tiene, poné uno de relleno válido (como hacés a mano).

> La app **valida el dígito de control** del ISBN: te avisa debajo del campo si está mal escrito, y
> lista los libros con ISBN inválido en el aviso de datos obligatorios (así evitás rechazos de ML).

### Foto genérica (para no pelear con el gestor de fotos)
En **⚙️ Configuración → Foto genérica (URL)** podés pegar el link de **una** imagen. Si está
lleno, ese link se usa en la columna **Fotos** de **todos** los libros que no tengan sus propias
URLs; si lo dejás vacío, la columna Fotos queda en blanco (como antes).

### ISBN genérico (para libros viejos sin ISBN)
Los libros antiguos no tienen ISBN, pero ML lo exige y rechaza los inventados. Debajo del campo
**ISBN** hay una casilla **"ISBN genérico"**: al tildarla se completa con un ISBN **real** (que ML
acepta) aunque no sea el del libro. Cuál se usa se configura en **⚙️ Configuración → ISBN genérico**
(por defecto uno válido; podés cambiarlo por tu ISBN de relleno preferido).

### Qué trae la planilla

Las **62 columnas** de la planilla oficial **"Publicar varios productos"** de Mercado Libre
(categoría Libros Físicos), en el mismo orden (A → BI): Título, Condición, ISBN, SKU, Stock,
Precio, Descripción, medidas y peso del paquete, forma de envío y condiciones de venta, y
todas las características del libro (Autor, Editorial, Subtítulo, Serie, Idioma, Edición, Tapa,
Índice, Año, Coautores, Traductores, Tipo de narración, Colección, Cantidad de páginas, etc.).

Cómo usarlo: abrí el CSV con Excel/Google Sheets, **copiá las filas de datos** y pegalas en la
planilla que descargás desde Mercado Libre. Viene en UTF-8, así que acentos y otros alfabetos
se ven bien.

### Qué completa y qué no
- **Completa** lo que puede: con la IA (lee la tapa) + bases de datos gratis (Google Books /
  OpenLibrary por ISBN o título). Lo que no puede determinar, lo deja **en blanco**.
- **Valores por defecto** (configurables): Condición (Usado), Stock (1), medidas/peso del
  paquete, forma de envío, cuotas y retiro.
- **Queda en blanco para vos:** Fotos (van del Gestor de fotos de ML) y, si lo dejaste en
  manual, el Precio.

### Precio (sugerencia, no se completa solo)
Por cada libro ves una **estimación orientativa** de la IA y **botones** que abren la búsqueda
de ese libro en **Mercado Libre, Iberlibro, eBay y Google** para que veas precios reales. En
Iberlibro, eBay y Google se agrega el **año de edición** (si está) porque se usan sobre todo para
libros antiguos. El campo de precio no se llena automáticamente (salvo que elijas ese modo en
Configuración).

---

## Notas

- La lista de libros cargados **se guarda en el teléfono** aunque cierres la página, hasta
  que la vacíes. Acordate de **descargar el CSV** antes de vaciarla.
- Si un dato salió mal, editalo en el campo antes de agregarlo. La IA no inventa: cuando no
  está segura deja el dato vacío y avisa en "confianza / observaciones".

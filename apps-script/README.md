# 📚 Registrador de Ventas y Gastos — Librería

App web sencilla para cargar, desde la compu o la tablet del local, las **ventas**
y **gastos** de la librería. Cada movimiento se guarda **solo** en tu Google Sheet,
con **fecha y hora automáticas**, y queda **archivado por mes y año** para consultarlo
cuando quieras.

No usa servidores ni cuesta nada: todo corre dentro de tu propia planilla con
**Google Apps Script**.

---

## Qué hace

- **Venta:** nombre del ítem + importe + cómo se pagó (**Efectivo / Tarjeta / Otros**).
- **Gasto:** concepto + importe.
- **Dólares (opcional):** campo aparte para ventas, señas o canjes en USD.
- **Fecha y hora automáticas** en cada registro.
- Panel **"Hoy"** y **"Este mes"** con ingresos, egresos y neto para cerrar caja.

### Dónde quedan los datos

Se crean **dos pestañas nuevas** en tu archivo (no se toca nada de lo que ya tenés):

1. **`Registro`** — una fila por movimiento:

   | Fecha | Mes | Detalle | Efectivo | Tarjeta | Otros | Egresos | USD |
   |-------|-----|---------|----------|---------|-------|---------|-----|

   La columna **`Mes`** (formato `2026-07`) es la que permite tener el registro
   ordenado por mes y por año.

2. **`Resumen`** — se calcula sola: totales por mes (efectivo, tarjeta, otros,
   ingresos, egresos, neto y USD). Es tu **archivo histórico automático**.

---

## Instalación (una sola vez, ~5 minutos)

1. Abrí **tu** Google Sheet (la misma que venís usando).
2. En el menú de arriba: **Extensiones → Apps Script**. Se abre el editor.
3. Vas a ver un archivo `Código.gs` con algo escrito. **Borrá todo** y pegá el
   contenido de **[`Codigo.gs`](./Codigo.gs)**.
4. Arriba, al lado de los archivos, tocá el **`+` → HTML**. Ponele de nombre
   exactamente **`Index`** (sin `.html`). Borrá lo que tenga y pegá el contenido
   de **[`Index.html`](./Index.html)**.
5. Guardá todo con el ícono del disquete (o `Ctrl/Cmd + S`).
6. Arriba a la derecha: **Implementar → Nueva implementación**.
   - En el engranaje ⚙️ elegí **Aplicación web**.
   - **Descripción:** `Ventas y gastos` (o lo que quieras).
   - **Ejecutar como:** *Yo* (tu cuenta).
   - **Quién tiene acceso:** *Solo yo* (recomendado, así solo entrás vos).
   - Tocá **Implementar**.
7. Google te va a pedir **permisos** la primera vez: *Revisar permisos → elegí tu
   cuenta → Configuración avanzada → Ir a (nombre del proyecto) → Permitir*.
   (Es normal: le estás dando permiso a tu propio script para escribir en tu planilla.)
8. Te va a dar una **URL de aplicación web** (`https://script.google.com/…/exec`).
   **Esa es la app.** Copiala.

> 💡 **Consejo:** guardá esa URL como marcador o agregala a la pantalla de inicio
> de la tablet para abrirla con un toque.

---

## Uso diario

1. Abrí la URL.
2. Elegí **Venta** o **Gasto**.
3. Completá el nombre/concepto y el importe.
4. En una venta, elegí el medio de pago (Efectivo / Tarjeta / Otros).
5. Si hubo dólares, tocá **"¿También en dólares?"** y cargalo.
6. **Guardar**. Listo: aparece en la pestaña `Registro` al instante y se actualiza
   el resumen del día y del mes.

### Ver detalle y filtros

Con el botón **"Ver detalle del día y del mes"** se abre una ventana con el
listado de cada movimiento (hora, detalle, medio de pago e importe), con solapas
**Hoy / Ayer / Este mes / Mes anterior / Meses / Período** y filtros: **Todos, Ventas,
Gastos, Efectivo, Tarjeta, Otros, Caja**. Los filtros viven dentro de esa ventana para
no recargar la pantalla principal.

- **Resumen destacado:** arriba del listado se ven los totales del período elegido
  (Ingresos, Egresos, Neto y Caja).
- **Buscar:** un campo para filtrar el listado por texto (ej. "Gusinde").
- **Editar / borrar:** cada movimiento tiene ✎ (corregir ítem, cantidad, precio,
  concepto o medio) y 🗑 (eliminar), los dos con validación.

- **Meses (archivo histórico):** la solapa *Meses* tiene un desplegable con todos los
  meses que tienen movimientos; al elegir uno ves ese mes completo (con sus filtros y
  la Caja).
- **Período:** la solapa *Período* permite elegir un rango **Desde / Hasta** y ver
  los movimientos (y la Caja) de ese lapso a elección.
- **Caja:** muestra el efectivo que debería haber en el cajón =
  *efectivo cobrado − gastos en efectivo*, según la solapa activa (Hoy, Este mes o
  el Período elegido). Los **gastos** pueden indicar **cómo se pagaron** (Efectivo /
  Tarjeta / Otros), guardado en la columna **`Medio`**. Para la Caja se restan los
  gastos en **Efectivo** y también los que **no** tengan medio indicado; quedan afuera
  solo los marcados como Tarjeta u Otros (ej. alquiler por transferencia).

### Corregir un error

- **Deshacer último:** en la pantalla principal, el botón *↶ Deshacer último movimiento*
  borra el registro más reciente (con confirmación).
- **Eliminar cualquiera:** en *Ver detalle*, cada movimiento tiene un botón 🗑 para
  borrarlo (con confirmación). Antes de borrar, la app valida que sea el movimiento
  correcto; si la lista cambió, avisa y no borra nada.
- También podés **editar o borrar** directamente en la pestaña `Registro` de la
  planilla, como con cualquier Google Sheet.

### Clientes

Arriba de todo hay un selector **Movimientos / Clientes**. La sección *Clientes* es
una base de fichas con **Nombre, Teléfono, Mail, Intereses y Observaciones** (más una
fecha de alta automática), guardada en una pestaña nueva **`Clientes`**.

- **＋ Nuevo** crea una ficha; el ✎ la edita y el 🗑 la borra (con confirmación).
- El buscador filtra por **nombre, interés, mail o teléfono** — útil para encontrar a
  quién avisarle cuando entra un libro que le interesa.
- Es independiente de las ventas.

### Ventas con varios ítems

En una **venta** podés cargar **varias líneas**, una por libro, con **ítem +
cantidad (por defecto 1) + precio unitario**. El **total se suma solo** (cantidad ×
precio de cada línea). En la planilla `Registro` se guarda **una fila por libro**
(comparten fecha, hora y medio de pago), con las columnas nuevas **Cantidad** y
**Precio unit**. El gasto sigue siendo una sola línea (concepto + importe).

### Cruce con Mercado Libre

Podés avisarte para no vender dos veces lo mismo:

1. Importá el Excel de tus publicaciones de Mercado Libre a una **pestaña nueva**
   llamada **`MercadoLibre`** (en Google Sheets: *Archivo → Importar → Subir*, y
   elegí "Insertar nueva(s) hoja(s)"; después renombrá la pestaña a `MercadoLibre`).
   La app detecta sola la columna de **Título** de la publicación.
2. Al guardar una venta, si algún ítem **se parece** a una publicación, aparece un
   aviso con las coincidencias, para que bajes la publicación. No bloquea la venta.

Cuando actualizás tus publicaciones, reimportás el Excel a esa misma pestaña.

### Separación por día en la planilla

Cuando cambia el día, la app deja **una fila en blanco** en la pestaña `Registro`,
para distinguir de un vistazo dónde termina una jornada y empieza la siguiente.

---

## Preguntas frecuentes

- **¿Se pierde algo de lo que ya tenía?** No. La app solo agrega las pestañas
  `Registro` y `Resumen`. Tu planilla histórica queda igual.
- **¿La puedo usar en el celular?** Sí, la misma URL funciona, aunque está pensada
  para pantalla de compu o tablet.
- **¿Puede usarla otra persona del local?** Si querés que entre más gente, en el
  paso 6 elegí *Quién tiene acceso: Cualquier persona*. Igual todos los datos van a
  **tu** misma planilla.
- **Cambié el código, ¿cómo actualizo?** Editá en Apps Script y hacé
  **Implementar → Gestionar implementaciones → editar (lápiz) → Versión: Nueva → Implementar**.
  Así la URL sigue siendo la misma.

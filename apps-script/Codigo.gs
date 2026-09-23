/**
 * Registrador de Ventas y Gastos — Librería
 * ------------------------------------------------------------
 * Backend de Google Apps Script embebido en la planilla.
 *
 * Escribe cada movimiento en la pestaña "Registro" del MISMO
 * archivo de Google Sheets y mantiene una pestaña "Resumen" que
 * se calcula sola, agrupada por mes (registro histórico por mes/año).
 *
 * No modifica ninguna otra pestaña existente.
 */

// Zona horaria de Argentina para fechas y armado del período (mes).
var TZ = 'America/Argentina/Buenos_Aires';

var HOJA_REGISTRO = 'Registro';
var HOJA_RESUMEN = 'Resumen';

// Orden de las columnas de la pestaña "Registro".
var ENCABEZADOS = ['Fecha', 'Mes', 'Detalle', 'Efectivo', 'Tarjeta', 'Otros', 'Egresos', 'USD', 'Medio', 'Cantidad', 'Precio unit'];

/**
 * Sirve la página web (la app) cuando se abre la URL publicada.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Librería · Ventas y Gastos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Devuelve la planilla contenedora del script. */
function getPlanilla_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Devuelve la pestaña "Registro", creándola con sus encabezados
 * y formatos la primera vez.
 */
function getHojaRegistro_() {
  var ss = getPlanilla_();
  var hoja = ss.getSheetByName(HOJA_REGISTRO);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_REGISTRO);
  }

  // Si la primera fila está vacía, escribimos encabezados y formatos.
  var primera = hoja.getRange(1, 1, 1, ENCABEZADOS.length).getValues()[0];
  var estaVacia = primera.every(function (c) { return c === '' || c === null; });
  if (estaVacia) {
    hoja.getRange(1, 1, 1, ENCABEZADOS.length)
      .setValues([ENCABEZADOS])
      .setFontWeight('bold')
      .setBackground('#2b2b2b')
      .setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');   // Fecha y hora
    hoja.getRange('D:G').setNumberFormat('#,##0');              // Montos en $
    hoja.getRange('H:H').setNumberFormat('#,##0.00');           // Montos en USD
    hoja.setColumnWidth(3, 340);                                // Detalle más ancho
  }
  // Compatibilidad: completa cualquier encabezado que falte (Medio, Cantidad, Precio unit).
  for (var k = 1; k <= ENCABEZADOS.length; k++) {
    if (hoja.getRange(1, k).getValue() === '') {
      hoja.getRange(1, k)
        .setValue(ENCABEZADOS[k - 1])
        .setFontWeight('bold').setBackground('#2b2b2b').setFontColor('#ffffff');
    }
  }
  return hoja;
}

/**
 * Devuelve la pestaña "Resumen", creándola con una fórmula QUERY
 * que agrupa todos los movimientos por mes.
 */
function asegurarResumen_() {
  var ss = getPlanilla_();
  var hoja = ss.getSheetByName(HOJA_RESUMEN);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_RESUMEN);
  }

  if (hoja.getRange('A1').getValue() === '') {
    var enc = ['Período (mes)', 'Efectivo', 'Tarjeta', 'Otros',
               'Total ingresos', 'Egresos', 'Neto', 'USD'];
    hoja.getRange(1, 1, 1, enc.length)
      .setValues([enc])
      .setFontWeight('bold')
      .setBackground('#2b2b2b')
      .setFontColor('#ffffff');
    hoja.setFrozenRows(1);

    // Agrupa por la columna "Mes" (Registro!B) y suma cada medio.
    var formula =
      '=IFERROR(QUERY(Registro!B2:H, "' +
      'select B, sum(D), sum(E), sum(F), sum(D)+sum(E)+sum(F), sum(G), ' +
      'sum(D)+sum(E)+sum(F)-sum(G), sum(H) ' +
      'where B is not null group by B order by B desc ' +
      'label B \'\', sum(D) \'\', sum(E) \'\', sum(F) \'\', ' +
      'sum(D)+sum(E)+sum(F) \'\', sum(G) \'\', ' +
      'sum(D)+sum(E)+sum(F)-sum(G) \'\', sum(H) \'\'", 0), "")';
    hoja.getRange('A2').setFormula(formula);

    hoja.getRange('B:G').setNumberFormat('#,##0');
    hoja.getRange('H:H').setNumberFormat('#,##0.00');
    hoja.setColumnWidth(1, 140);
  }
  return hoja;
}

/**
 * Guarda un movimiento. Lo llama la app con google.script.run.
 *
 * @param {Object} datos
 *   datos.tipo    'ingreso' | 'egreso'
 *   datos.detalle nombre del ítem (venta) o concepto (gasto)
 *   datos.importe importe en pesos (número)
 *   datos.medio   'Efectivo' | 'Tarjeta' | 'Otros'  (solo ventas)
 *   datos.usd     importe en dólares (número, opcional)
 * @return {Object} resumen actualizado (ver getResumen).
 */
function guardar(datos) {
  datos = datos || {};
  var usd = Number(datos.usd) || 0;
  var medioPago = datos.medio || 'Efectivo';
  var colMedio = { 'Efectivo': 3, 'Tarjeta': 4, 'Otros': 5 }[medioPago];
  if (colMedio === undefined) { colMedio = 3; }

  var hoja = getHojaRegistro_();
  asegurarResumen_();

  var ahora = new Date();
  var mes = Utilities.formatDate(ahora, TZ, 'yyyy-MM');
  var ancho = ENCABEZADOS.length;

  function nuevaFila() {
    var f = [];
    for (var i = 0; i < ancho; i++) { f.push(''); }
    f[0] = ahora; f[1] = mes;
    return f;
  }

  var filas = [];
  var itemsVendidos = [];

  if (datos.tipo === 'egreso') {
    var concepto = (datos.detalle || '').toString().trim();
    var importe = Number(datos.importe) || 0;
    if (!concepto) { throw new Error('Falta el concepto del gasto.'); }
    if (importe <= 0 && usd <= 0) { throw new Error('Ingresá un importe mayor a cero.'); }
    var fg = nuevaFila();
    fg[2] = concepto;
    if (importe > 0) { fg[6] = importe; }
    if (usd > 0) { fg[7] = usd; }
    fg[8] = medioPago;
    filas.push(fg);
  } else {
    // Venta: una o varias líneas (una fila por libro).
    var lineas = datos.lineas || [];
    var validas = [];
    for (var i = 0; i < lineas.length; i++) {
      var it = (lineas[i].item || '').toString().trim();
      var cant = Number(lineas[i].cantidad) || 0;
      if (cant <= 0) { cant = 1; }
      var precio = Number(lineas[i].precio) || 0;
      if (!it && precio <= 0) { continue; }
      if (!it) { throw new Error('Hay una línea con precio pero sin nombre del ítem.'); }
      validas.push({ item: it, cant: cant, precio: precio });
    }
    if (!validas.length && usd <= 0) { throw new Error('Cargá al menos un ítem con precio.'); }

    for (var j = 0; j < validas.length; j++) {
      var v = validas[j];
      var total = v.cant * v.precio;
      var fv = nuevaFila();
      fv[2] = v.item;
      if (total > 0) { fv[colMedio] = total; }
      if (j === 0 && usd > 0) { fv[7] = usd; }   // el USD se apoya en la primera línea
      fv[8] = medioPago;
      fv[9] = v.cant;
      fv[10] = v.precio;
      filas.push(fv);
      itemsVendidos.push(v.item);
    }
    if (!validas.length && usd > 0) {
      var fu = nuevaFila();
      fu[2] = (datos.detalle || 'Venta en dólares');
      fu[7] = usd; fu[8] = medioPago;
      filas.push(fu);
    }
  }

  // Deja una fila en blanco cuando cambia el día (una sola vez, antes del bloque).
  var ultima = hoja.getLastRow();
  var destino = ultima + 1;
  if (ultima >= 2) {
    var ultimaFecha = hoja.getRange(ultima, 1).getValue();
    if (ultimaFecha instanceof Date) {
      if (Utilities.formatDate(ultimaFecha, TZ, 'yyyy-MM-dd') !== Utilities.formatDate(ahora, TZ, 'yyyy-MM-dd')) {
        destino += 1;
      }
    }
  }
  hoja.getRange(destino, 1, filas.length, ancho).setValues(filas);

  return {
    resumen: getResumen(),
    ml: (datos.tipo === 'egreso') ? [] : buscarEnML_(itemsVendidos)
  };
}

/**
 * Calcula los totales de HOY y del MES en curso a partir del Registro.
 * @return {Object} { hoy: {...}, mes: {...} }
 */
function getResumen() {
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();

  var res = {
    hoy: nuevoAcumulador_(),
    mes: nuevoAcumulador_()
  };
  if (ultima < 2) {
    return res;
  }

  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS.length).getValues();
  var hoyStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var mesStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM');

  valores.forEach(function (f) {
    var fecha = f[0];
    if (!(fecha instanceof Date)) {
      return;
    }
    var fStr = Utilities.formatDate(fecha, TZ, 'yyyy-MM-dd');
    var fMes = Utilities.formatDate(fecha, TZ, 'yyyy-MM');
    var mov = {
      efectivo: Number(f[3]) || 0,
      tarjeta: Number(f[4]) || 0,
      otros: Number(f[5]) || 0,
      egresos: Number(f[6]) || 0,
      usd: Number(f[7]) || 0
    };
    if (fMes === mesStr) { acumular_(res.mes, mov); }
    if (fStr === hoyStr) { acumular_(res.hoy, mov); }
  });

  return res;
}

function nuevoAcumulador_() {
  return { efectivo: 0, tarjeta: 0, otros: 0, ingresos: 0, egresos: 0, neto: 0, usd: 0, cant: 0 };
}

function acumular_(o, mov) {
  o.efectivo += mov.efectivo;
  o.tarjeta += mov.tarjeta;
  o.otros += mov.otros;
  o.egresos += mov.egresos;
  o.usd += mov.usd;
  o.ingresos += mov.efectivo + mov.tarjeta + mov.otros;
  o.neto += mov.efectivo + mov.tarjeta + mov.otros - mov.egresos;
  o.cant += 1;
}

/**
 * Devuelve el detalle (movimiento por movimiento) de HOY y del MES en curso,
 * ordenado del más reciente al más antiguo. Lo usa la vista "Ver detalle".
 * @return {Object} { hoy: [movimiento...], mes: [movimiento...] }
 */
/**
 * Convierte una fila de la planilla en un objeto de movimiento, o null si la
 * fila no es un movimiento (fila en blanco / separador).
 */
function filaAMovimiento_(f, fila) {
  var fecha = f[0];
  if (!(fecha instanceof Date)) {
    return null;
  }
  var ef = Number(f[3]) || 0, ta = Number(f[4]) || 0,
      ot = Number(f[5]) || 0, eg = Number(f[6]) || 0, us = Number(f[7]) || 0;
  var medioTxt = f[8] ? String(f[8]).trim() : '';

  var esEgreso = (eg > 0 && ef === 0 && ta === 0 && ot === 0);
  var medioIng = ta > 0 ? 'Tarjeta' : (ot > 0 ? 'Otros' : (ef > 0 ? 'Efectivo' : ''));

  return {
    fila: fila,                 // fila real en la planilla (para borrar/corregir)
    orden: fecha.getTime(),     // sello para validar antes de borrar
    hora: Utilities.formatDate(fecha, TZ, 'dd/MM HH:mm'),
    detalle: f[2],
    tipo: esEgreso ? 'Egreso' : 'Ingreso',
    medio: esEgreso ? medioTxt : (medioIng || medioTxt),
    monto: esEgreso ? eg : (ef + ta + ot),
    usd: us,
    cant: Number(f[9]) || 1,
    precio: Number(f[10]) || 0
  };
}

function getDetalle() {
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();
  var out = { hoy: [], ayer: [], mes: [], mesAnterior: [] };
  if (ultima < 2) {
    return out;
  }

  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS.length).getValues();
  var hoyStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var ayerStr = Utilities.formatDate(new Date(Date.now() - 24 * 3600 * 1000), TZ, 'yyyy-MM-dd');
  var mesStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM');
  // Mes anterior (yyyy-MM) calculado a partir del mes actual.
  var pm = mesStr.split('-'); var pmY = +pm[0], pmM = +pm[1] - 1;
  if (pmM < 1) { pmM = 12; pmY--; }
  var mesAntStr = pmY + '-' + (pmM < 10 ? '0' : '') + pmM;

  valores.forEach(function (f, i) {
    var item = filaAMovimiento_(f, i + 2);   // los datos empiezan en la fila 2
    if (!item) { return; }
    var fStr = Utilities.formatDate(f[0], TZ, 'yyyy-MM-dd');
    var fMes = Utilities.formatDate(f[0], TZ, 'yyyy-MM');
    if (fMes === mesStr) { out.mes.push(item); }
    if (fMes === mesAntStr) { out.mesAnterior.push(item); }
    if (fStr === hoyStr) { out.hoy.push(item); }
    if (fStr === ayerStr) { out.ayer.push(item); }
  });

  out.hoy.sort(function (a, b) { return b.orden - a.orden; });
  out.ayer.sort(function (a, b) { return b.orden - a.orden; });
  out.mes.sort(function (a, b) { return b.orden - a.orden; });
  out.mesAnterior.sort(function (a, b) { return b.orden - a.orden; });
  return out;
}

/**
 * Devuelve los movimientos entre dos fechas (inclusive), del más reciente al
 * más antiguo. Las fechas llegan como texto 'yyyy-MM-dd'. Lo usa la solapa
 * "Período" para calcular la Caja (u otros filtros) sobre un rango a elección.
 */
function getDetalleRango(desde, hasta) {
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();
  var out = [];
  if (ultima < 2) {
    return out;
  }
  desde = String(desde || '');
  hasta = String(hasta || '');

  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS.length).getValues();
  valores.forEach(function (f, i) {
    if (!(f[0] instanceof Date)) { return; }
    var fStr = Utilities.formatDate(f[0], TZ, 'yyyy-MM-dd');
    if (desde && fStr < desde) { return; }
    if (hasta && fStr > hasta) { return; }
    var item = filaAMovimiento_(f, i + 2);
    if (item) { out.push(item); }
  });

  out.sort(function (a, b) { return b.orden - a.orden; });
  return out;
}

/**
 * Devuelve la lista de meses que tienen movimientos (texto 'yyyy-MM'),
 * del más reciente al más antiguo. Alimenta el desplegable de "Meses".
 */
function getMesesDisponibles() {
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) {
    return [];
  }
  var col = hoja.getRange(2, 2, ultima - 1, 1).getValues(); // columna "Mes"
  var vistos = {};
  col.forEach(function (r) {
    var v = r[0];
    if (v) { vistos[String(v)] = true; }
  });
  var arr = Object.keys(vistos);
  arr.sort();
  arr.reverse();
  return arr;
}

/**
 * Devuelve los movimientos de un mes ('yyyy-MM'), del más reciente al más
 * antiguo. Lo usa la solapa "Meses" para el archivo histórico.
 */
function getDetalleMes(mes) {
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();
  var out = [];
  if (ultima < 2) {
    return out;
  }
  mes = String(mes || '');
  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS.length).getValues();
  valores.forEach(function (f, i) {
    if (String(f[1]) !== mes) { return; }   // columna "Mes"
    var item = filaAMovimiento_(f, i + 2);
    if (item) { out.push(item); }
  });
  out.sort(function (a, b) { return b.orden - a.orden; });
  return out;
}

/**
 * Elimina el movimiento de una fila. Para no borrar el equivocado, valida que
 * la fecha de esa fila coincida con el "sello" (timestamp) del movimiento que
 * se está viendo. Si la lista cambió, tira un error en vez de borrar a ciegas.
 */
function eliminarMovimiento(fila, sello) {
  fila = Number(fila) || 0;
  sello = Number(sello) || 0;
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) {
    throw new Error('No hay movimientos.');
  }

  // 1) Intenta en la fila indicada (tolerando pequeñas diferencias de milisegundos).
  if (fila >= 2 && fila <= ultima) {
    var fecha = hoja.getRange(fila, 1).getValue();
    if (fecha instanceof Date && (!sello || Math.abs(fecha.getTime() - sello) <= 2000)) {
      hoja.deleteRow(fila);
      return getResumen();
    }
  }
  // 2) Si la fila se movió, busca el movimiento por su fecha/hora (el sello).
  if (sello) {
    var fechas = hoja.getRange(2, 1, ultima - 1, 1).getValues();
    for (var i = 0; i < fechas.length; i++) {
      var d = fechas[i][0];
      if (d instanceof Date && Math.abs(d.getTime() - sello) <= 2000) {
        hoja.deleteRow(i + 2);
        return getResumen();
      }
    }
  }
  throw new Error('No se encontró el movimiento. Recargá el detalle e intentá de nuevo.');
}

/**
 * Edita un movimiento (corrige ítem/precio/cantidad/medio, o concepto/importe).
 * Conserva la fecha original y el USD. Valida con tolerancia y, si la fila se
 * movió, ubica el movimiento por su sello.
 */
function editarMovimiento(fila, sello, d) {
  d = d || {};
  fila = Number(fila) || 0;
  sello = Number(sello) || 0;
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) { throw new Error('No hay movimientos.'); }

  var r = 0;
  if (fila >= 2 && fila <= ultima) {
    var fx = hoja.getRange(fila, 1).getValue();
    if (fx instanceof Date && (!sello || Math.abs(fx.getTime() - sello) <= 2000)) { r = fila; }
  }
  if (!r && sello) {
    var fechas = hoja.getRange(2, 1, ultima - 1, 1).getValues();
    for (var i = 0; i < fechas.length; i++) {
      var dd = fechas[i][0];
      if (dd instanceof Date && Math.abs(dd.getTime() - sello) <= 2000) { r = i + 2; break; }
    }
  }
  if (!r) { throw new Error('No se encontró el movimiento. Recargá el detalle.'); }

  var actual = hoja.getRange(r, 1, 1, ENCABEZADOS.length).getValues()[0];
  var fecha = actual[0];
  var mes = actual[1];
  var usd = Number(actual[7]) || 0;   // se conserva el USD original

  var detalle = (d.detalle || '').toString().trim();
  if (!detalle) { throw new Error('Falta el detalle.'); }

  var f11 = [fecha, mes, detalle, '', '', '', '', usd > 0 ? usd : '', '', '', ''];
  if (d.tipo === 'egreso') {
    var importe = Number(d.importe) || 0;
    if (importe <= 0 && usd <= 0) { throw new Error('Ingresá un importe mayor a cero.'); }
    if (importe > 0) { f11[6] = importe; }
    f11[8] = d.medio || 'Efectivo';
  } else {
    var cant = Number(d.cantidad) || 1;
    if (cant <= 0) { cant = 1; }
    var precio = Number(d.precio) || 0;
    var total = cant * precio;
    if (total <= 0 && usd <= 0) { throw new Error('Ingresá un precio mayor a cero.'); }
    var medio = d.medio || 'Efectivo';
    var colMedio = { 'Efectivo': 3, 'Tarjeta': 4, 'Otros': 5 }[medio];
    if (colMedio === undefined) { colMedio = 3; }
    if (total > 0) { f11[colMedio] = total; }
    f11[8] = medio;
    f11[9] = cant;
    f11[10] = precio;
  }
  hoja.getRange(r, 1, 1, ENCABEZADOS.length).setValues([f11]);
  return getResumen();
}

/**
 * Elimina el último movimiento cargado ("Deshacer último").
 */
function eliminarUltimo() {
  var hoja = getHojaRegistro_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) {
    throw new Error('No hay movimientos para deshacer.');
  }
  var fecha = hoja.getRange(ultima, 1).getValue();
  if (!(fecha instanceof Date)) {
    throw new Error('No hay un movimiento para deshacer.');
  }
  hoja.deleteRow(ultima);
  return getResumen();
}

/* ══════════════════ CLIENTES ══════════════════ */

var HOJA_CLIENTES = 'Clientes';
var ENCABEZADOS_CLI = ['Fecha alta', 'Nombre', 'Teléfono', 'Mail', 'Intereses', 'Observaciones'];

/** Devuelve la pestaña "Clientes", creándola con encabezados la primera vez. */
function getHojaClientes_() {
  var ss = getPlanilla_();
  var hoja = ss.getSheetByName(HOJA_CLIENTES);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_CLIENTES);
  }
  var primera = hoja.getRange(1, 1, 1, ENCABEZADOS_CLI.length).getValues()[0];
  var vacia = primera.every(function (c) { return c === '' || c === null; });
  if (vacia) {
    hoja.getRange(1, 1, 1, ENCABEZADOS_CLI.length)
      .setValues([ENCABEZADOS_CLI])
      .setFontWeight('bold').setBackground('#2b2b2b').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    hoja.setColumnWidth(2, 200);   // Nombre
    hoja.setColumnWidth(5, 320);   // Intereses
    hoja.setColumnWidth(6, 320);   // Observaciones
  }
  return hoja;
}

/** Lista de clientes, ordenada por nombre. */
function getClientes() {
  var hoja = getHojaClientes_();
  var ultima = hoja.getLastRow();
  var out = [];
  if (ultima < 2) {
    return out;
  }
  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS_CLI.length).getValues();
  valores.forEach(function (f, i) {
    var nombre = (f[1] || '').toString().trim();
    if (!nombre) { return; }
    var fa = f[0];
    out.push({
      fila: i + 2,
      sello: (fa instanceof Date) ? fa.getTime() : 0,
      alta: (fa instanceof Date) ? Utilities.formatDate(fa, TZ, 'dd/MM/yyyy') : '',
      nombre: nombre,
      telefono: (f[2] || '').toString(),
      mail: (f[3] || '').toString(),
      intereses: (f[4] || '').toString(),
      observaciones: (f[5] || '').toString()
    });
  });
  out.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
  return out;
}

/**
 * Alta o edición de un cliente. Si datos.fila >= 2 edita esa ficha (validando
 * el sello); si no, crea una nueva con fecha de alta automática.
 */
function guardarCliente(datos) {
  datos = datos || {};
  var nombre = (datos.nombre || '').toString().trim();
  if (!nombre) {
    throw new Error('El nombre es obligatorio.');
  }
  var hoja = getHojaClientes_();
  var fila = Number(datos.fila) || 0;
  var fila5 = [nombre, datos.telefono || '', datos.mail || '', datos.intereses || '', datos.observaciones || ''];

  if (fila >= 2) {
    if (fila > hoja.getLastRow()) {
      throw new Error('La ficha ya no existe. Recargá la lista.');
    }
    var fa = hoja.getRange(fila, 1).getValue();
    if (datos.sello && (!(fa instanceof Date) || Math.abs(fa.getTime() - Number(datos.sello)) > 2000)) {
      throw new Error('La ficha cambió. Recargá la lista e intentá de nuevo.');
    }
    hoja.getRange(fila, 2, 1, 5).setValues([fila5]);   // conserva la fecha de alta
  } else {
    hoja.appendRow([new Date()].concat(fila5));
  }
  return getClientes();
}

/** Elimina una ficha de cliente (valida el sello antes de borrar). */
function eliminarCliente(fila, sello) {
  fila = Number(fila) || 0;
  sello = Number(sello) || 0;
  var hoja = getHojaClientes_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) {
    throw new Error('No hay fichas.');
  }

  // 1) Intenta en la fila indicada.
  if (fila >= 2 && fila <= ultima) {
    var fa = hoja.getRange(fila, 1).getValue();
    if (!sello || (fa instanceof Date && Math.abs(fa.getTime() - sello) <= 2000)) {
      hoja.deleteRow(fila);
      return getClientes();
    }
  }
  // 2) Si la lista se movió, busca la ficha por su fecha de alta (el sello).
  if (sello) {
    var fechas = hoja.getRange(2, 1, ultima - 1, 1).getValues();
    for (var i = 0; i < fechas.length; i++) {
      var d = fechas[i][0];
      if (d instanceof Date && Math.abs(d.getTime() - sello) <= 2000) {
        hoja.deleteRow(i + 2);
        return getClientes();
      }
    }
  }
  throw new Error('No se encontró la ficha. Recargá la lista.');
}

/* ══════════════════ MERCADO LIBRE ══════════════════ */

// Palabras que no aportan para comparar títulos.
var STOP_ML = {
  'de': 1, 'la': 1, 'el': 1, 'los': 1, 'las': 1, 'un': 1, 'una': 1, 'unos': 1, 'unas': 1,
  'y': 1, 'o': 1, 'en': 1, 'del': 1, 'con': 1, 'para': 1, 'por': 1, 'al': 1, 'a': 1,
  'su': 1, 'sus': 1, 'lo': 1, 'que': 1, 'libro': 1, 'libros': 1, 'oferta': 1, 'ofertas': 1,
  'varios': 1, 'usado': 1, 'usados': 1, 'nuevo': 1, 'nuevos': 1, 'ed': 1, 'tomo': 1, 'tomos': 1
};

/** Normaliza texto: minúsculas, sin acentos, solo letras y números. */
function normalizar_(s) {
  s = (s == null ? '' : s).toString().toLowerCase();
  if (s.normalize) { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  return s.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Tokens significativos de un texto (sin palabras vacías ni muy cortas). */
function tokens_(s) {
  var n = normalizar_(s);
  if (!n) { return []; }
  var partes = n.split(' ');
  var out = [];
  for (var i = 0; i < partes.length; i++) {
    var p = partes[i];
    if (p.length >= 3 && !STOP_ML[p]) { out.push(p); }
  }
  return out;
}

/** ¿El ítem vendido (tokens a) se parece al título publicado (tokens b)? */
function parecido_(a, b) {
  if (!a.length || !b.length) { return false; }
  var set = {};
  for (var i = 0; i < b.length; i++) { set[b[i]] = 1; }
  var comunes = 0;
  for (var j = 0; j < a.length; j++) { if (set[a[j]]) { comunes++; } }
  if (comunes === 0) { return false; }
  if (a.length === 1) { return comunes === 1; }          // ítem de una sola palabra distintiva
  return comunes >= 2 && (comunes / a.length) >= 0.5;
}

/** Encuentra la pestaña con las publicaciones de Mercado Libre (varios nombres posibles). */
function getHojaML_() {
  var ss = getPlanilla_();
  var nombres = ['MercadoLibre', 'Mercado Libre', 'Mercadolibre', 'ML', 'Publicaciones'];
  for (var i = 0; i < nombres.length; i++) {
    var h = ss.getSheetByName(nombres[i]);
    if (h) { return h; }
  }
  return null;
}

/** Lee los títulos publicados en ML (detecta sola la columna de título). */
function leerTitulosML_() {
  var hoja = getHojaML_();
  if (!hoja) { return []; }
  var ultima = hoja.getLastRow();
  var ancho = hoja.getLastColumn();
  if (ultima < 2 || ancho < 1) { return []; }

  var encab = hoja.getRange(1, 1, 1, ancho).getValues()[0];
  var colTit = -1;
  for (var c = 0; c < encab.length; c++) {
    var h = normalizar_(encab[c]);
    if (h.indexOf('titulo') !== -1 || h.indexOf('publicacion') !== -1 ||
        h === 'nombre' || h.indexOf('nombre del') !== -1 || h.indexOf('articulo') !== -1) {
      colTit = c; break;
    }
  }
  if (colTit === -1) { colTit = 0; }   // fallback: primera columna

  var datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
  var out = [];
  for (var r = 0; r < datos.length; r++) {
    var t = (datos[r][colTit] || '').toString().trim();
    if (t) { out.push({ titulo: t, toks: tokens_(t) }); }
  }
  return out;
}

/**
 * Dado un conjunto de ítems vendidos, devuelve los que se parecen a alguna
 * publicación de ML: [{ item, titulos: [coincidencias...] }].
 */
function buscarEnML_(items) {
  if (!items || !items.length) { return []; }
  var titulos = leerTitulosML_();
  if (!titulos.length) { return []; }

  var out = [];
  items.forEach(function (it) {
    var toks = tokens_(it);
    if (!toks.length) { return; }
    var coincidencias = [];
    for (var i = 0; i < titulos.length; i++) {
      if (parecido_(toks, titulos[i].toks)) {
        coincidencias.push(titulos[i].titulo);
        if (coincidencias.length >= 3) { break; }
      }
    }
    if (coincidencias.length) { out.push({ item: it, titulos: coincidencias }); }
  });
  return out;
}

/** Cantidad de publicaciones de ML cargadas (para mostrar estado en la app). */
function estadoML() {
  return { publicaciones: leerTitulosML_().length, hay: !!getHojaML_() };
}

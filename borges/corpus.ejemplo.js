/* ─────────────────────────────────────────────────────────────
   Formato del corpus.

   Copiá este archivo como  corpus.js  (que está en el .gitignore,
   así los textos completos NO se publican en GitHub Pages) y
   reemplazá los ejemplos por los cuentos de verdad.

   Un objeto por cuento. El juego parte el texto en oraciones solo:
   no hace falta cortarlo a mano. Alcanza con que cada texto tenga
   al menos tres oraciones.
   ───────────────────────────────────────────────────────────── */

window.CORPUS_BORGES = {
  textos: [
    {
      libro: "Ficciones",
      cuento: "Título del cuento",
      texto: `Acá va el cuento entero, tal cual, con sus párrafos.

Los saltos de línea se respetan: cada párrafo se parte en oraciones
por separado, así los diálogos no se mezclan con la narración.`
    },
    {
      libro: "El Aleph",
      cuento: "Otro título",
      texto: `Otro cuento completo.`
    }
  ]
};

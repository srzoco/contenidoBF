/* Datos de ejemplo para el modo demo (solo se usan si no hay base de datos configurada). */
(function (root, factory) {
  var mod = factory(root.BFLogic || (typeof require === 'function' ? require('./logic.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.BFDemo = mod;
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';

  function semilla(hoyOpt) {
    var hoy = hoyOpt || L.hoyISO();
    var SARA = 'demo-sara', EDI = 'demo-editora';
    var ahora = Date.now();
    var n = 0;
    function id() { n++; return '00000000-0000-4000-8000-' + String(n).padStart(12, '0'); }
    function ts(horasAtras) { return new Date(ahora - horasAtras * 3600000).toISOString(); }
    var piezas = [], eventos = [];
    function pieza(o) {
      var p = Object.assign({
        id: id(), tipo: 'reel', ig: true, tt: true, producto: null, gancho: null, objetivo: null,
        fase: 'produccion', etapa: null, turno: null, version: 0, texto_carrusel: null, copy_ig: null, copy_tt: null,
        nota_version: null, enlace_version: null, primero: null, fecha_ig: null, fecha_tt: null,
        en_espera: false, espera_producto: null, espera_desde: null, publicado_ig_en: null, publicado_tt_en: null,
        enlace_ig: null, enlace_tt: null, vistas_ig: null, vistas_tt: null, creado_por: EDI
      }, o);
      p.creado_en = p.creado_en || ts(72);
      p.actualizado_en = p.actualizado_en || p.creado_en;
      piezas.push(p);
      return p;
    }
    function ev(p, horasAtras, autor, tipo, etapa, version, texto, datos) {
      eventos.push({ id: id(), pieza_id: p.id, autor: autor, tipo: tipo, etapa: etapa || null, version: version == null ? null : version, texto: texto || null, datos: datos || {}, creado_en: ts(horasAtras) });
    }

    // 1. Reel por aprobar (video v1)
    var p1 = pieza({ titulo: 'Queso manchego curado: cómo cortarlo', producto: 'Queso manchego', gancho: 'El error que todos cometen al cortar manchego', objetivo: 'Vender un producto', etapa: 'video', turno: 'aprueba', version: 1, nota_version: 'Primer corte, 32 s', creado_en: ts(72) });
    ev(p1, 72, EDI, 'creada', null, null, null, { tipo: 'reel', plataformas: ['ig', 'tt'] });
    ev(p1, 5, EDI, 'envio', 'video', 1, 'Primer corte, 32 s', {});

    // 2. Carrusel por aprobar (texto v2) con una corrección previa
    var p2 = pieza({ titulo: '5 embutidos para tu tabla', tipo: 'carrusel', producto: 'Embutidos', gancho: '¿Tu tabla se ve aburrida? Estos 5 la cambian', objetivo: 'Educar / dar a conocer', etapa: 'texto', turno: 'aprueba', version: 2,
      texto_carrusel: 'Slide 1: ¿Tu tabla se ve aburrida? Estos 5 embutidos la cambian\nSlide 2: Chorizo ibérico — $12 el kilo… (ver precio en la web)\nSlide 3: Salchichón\nSlide 4: Lomo embuchado\nSlide 5: Fuet\nSlide 6: Pídelos en barquerofood.com',
      nota_version: 'Acorté el slide 1 y agregué precios', creado_en: ts(96) });
    ev(p2, 96, EDI, 'creada', null, null, null, { tipo: 'carrusel', plataformas: ['ig', 'tt'] });
    ev(p2, 48, EDI, 'envio', 'texto', 1, null, { texto_carrusel: 'Slide 1: Los 5 embutidos que no pueden faltar en tu tabla de este fin de semana…' });
    ev(p2, 44, SARA, 'correccion', 'texto', 1, 'Que el primer slide se lea en 2 segundos', { chips: ['Gancho (slide 1)', 'Muy largo'], puntos: [{ ubicacion: 'Slide 3', texto: 'Falta el precio del salchichón' }] });
    ev(p2, 3, EDI, 'envio', 'texto', 2, 'Acorté el slide 1 y agregué precios', { resueltas: [0, 1, 2] });

    // 3. Reel solo TikTok devuelto con correcciones
    var p3 = pieza({ titulo: 'Jamón serrano: detrás de cámaras', ig: false, tt: true, producto: 'Jamón serrano', gancho: 'Así llega un jamón a la tienda', objetivo: 'Marca / entretener', etapa: 'video', turno: 'edita', version: 1, creado_en: ts(120) });
    ev(p3, 120, EDI, 'creada', null, null, null, { tipo: 'reel', plataformas: ['tt'] });
    ev(p3, 26, EDI, 'envio', 'video', 1, null, {});
    ev(p3, 20, SARA, 'correccion', 'video', 1, null, { chips: ['Música / audio', 'Subtítulos'], puntos: [{ ubicacion: '0:08', texto: 'Cortar la toma movida' }] });

    // 4. Reel recién creado (por editar)
    var p4 = pieza({ titulo: 'Aceitunas rellenas: 3 formas de servirlas', producto: 'Aceitunas', gancho: 'Nadie sirve aceitunas así', objetivo: 'Vender un producto', etapa: 'video', turno: 'edita', version: 0, creado_en: ts(10) });
    ev(p4, 10, EDI, 'creada', null, null, null, { tipo: 'reel', plataformas: ['ig', 'tt'] });

    // 5. Publicar hoy en IG
    var p5 = pieza({ titulo: 'Pistachos tostados: el snack de la tarde', ig: true, tt: false, producto: 'Pistachos', fase: 'aprobada', fecha_ig: hoy, primero: 'ig',
      copy_ig: '🥜 Los pistachos tostados que te van a salvar la tarde.\nPídelos en barquerofood.com o escríbenos por aquí.', creado_en: ts(200) });
    ev(p5, 200, EDI, 'creada', null, null, null, { tipo: 'reel', plataformas: ['ig'] });
    ev(p5, 150, EDI, 'envio', 'video', 1, null, {});
    ev(p5, 140, SARA, 'aprobacion', 'video', 1, null, {});
    ev(p5, 100, EDI, 'envio', 'copy', 1, null, { copy_ig: p5.copy_ig, fecha_ig: hoy });
    ev(p5, 90, SARA, 'aprobacion', 'copy', 1, null, { fecha_ig: hoy, primero: 'ig' });

    // 6. Publicada hace 9 días (falta anotar vistas de IG)
    var p6 = pieza({ titulo: 'Quesos franceses: guía rápida', producto: 'Quesos franceses', fase: 'publicada', fecha_ig: L.addDias(hoy, -9), fecha_tt: L.addDias(hoy, -6), primero: 'ig',
      publicado_ig_en: ts(9 * 24), publicado_tt_en: ts(6 * 24), vistas_tt: 4200, copy_ig: 'Brie, camembert y roquefort 🧀', copy_tt: 'Brie, camembert y roquefort 🧀 ¿cuál es el tuyo?', creado_en: ts(20 * 24) });
    ev(p6, 20 * 24, EDI, 'creada', null, null, null, { tipo: 'reel', plataformas: ['ig', 'tt'] });
    ev(p6, 18 * 24, EDI, 'envio', 'video', 1, null, {});
    ev(p6, 17 * 24, SARA, 'correccion', 'video', 1, null, { chips: ['Cortar inicio', 'Subtítulos'], puntos: [] });
    ev(p6, 16 * 24, EDI, 'envio', 'video', 2, null, {});
    ev(p6, 15.5 * 24, SARA, 'aprobacion', 'video', 2, null, {});
    ev(p6, 15 * 24, EDI, 'envio', 'copy', 1, null, {});
    ev(p6, 14 * 24, SARA, 'correccion', 'copy', 1, null, { chips: ['Llamado a la acción'], puntos: [] });
    ev(p6, 13 * 24, EDI, 'envio', 'copy', 2, null, {});
    ev(p6, 12.8 * 24, SARA, 'aprobacion', 'copy', 2, null, { fecha_ig: p6.fecha_ig, fecha_tt: p6.fecha_tt, primero: 'ig' });
    ev(p6, 9 * 24, EDI, 'publicado', null, null, null, { plataforma: 'ig' });
    ev(p6, 6 * 24, EDI, 'publicado', null, null, null, { plataforma: 'tt' });
    ev(p6, 1 * 24, EDI, 'vistas', null, null, null, { vistas_tt: 4200 });

    // 7. Publicada hace 20 días con vistas
    var p7 = pieza({ titulo: 'Chocolate belga: 3 usos', producto: 'Chocolate belga', fase: 'publicada', fecha_ig: L.addDias(hoy, -21), fecha_tt: L.addDias(hoy, -18), primero: 'ig',
      publicado_ig_en: ts(21 * 24), publicado_tt_en: ts(18 * 24), vistas_ig: 3100, vistas_tt: 8900, copy_ig: '🍫', copy_tt: '🍫', creado_en: ts(30 * 24) });
    ev(p7, 29 * 24, EDI, 'envio', 'video', 1, null, {});
    ev(p7, 28.7 * 24, SARA, 'aprobacion', 'video', 1, null, {});
    ev(p7, 27 * 24, EDI, 'envio', 'copy', 1, null, {});
    ev(p7, 26.8 * 24, SARA, 'aprobacion', 'copy', 1, null, { fecha_ig: p7.fecha_ig, fecha_tt: p7.fecha_tt });

    var p8 = pieza({ titulo: 'Cómo armar una tabla de quesos', tipo: 'carrusel', ig: true, tt: false, fase: 'publicada', fecha_ig: L.addDias(hoy, -15), primero: 'ig',
      publicado_ig_en: ts(15 * 24), vistas_ig: 1800, copy_ig: '🧀', creado_en: ts(26 * 24) });
    ev(p8, 25 * 24, EDI, 'envio', 'texto', 1, null, {});
    ev(p8, 24 * 24, SARA, 'correccion', 'texto', 1, null, { chips: ['Muy largo', 'Orden de slides'], puntos: [] });
    ev(p8, 23 * 24, EDI, 'envio', 'texto', 2, null, {});
    ev(p8, 22.9 * 24, SARA, 'aprobacion', 'texto', 2, null, {});
    ev(p8, 21 * 24, EDI, 'envio', 'diseno', 1, null, {});
    ev(p8, 20 * 24, SARA, 'correccion', 'diseno', 1, null, { chips: ['Legibilidad', 'Colores de marca'], puntos: [{ ubicacion: 'Slide 4', texto: 'La letra blanca no se lee sobre el queso' }] });
    ev(p8, 19 * 24, EDI, 'envio', 'diseno', 2, null, {});
    ev(p8, 18.9 * 24, SARA, 'aprobacion', 'diseno', 2, null, {});
    ev(p8, 18 * 24, EDI, 'envio', 'copy', 1, null, {});
    ev(p8, 17.9 * 24, SARA, 'aprobacion', 'copy', 1, null, { fecha_ig: p8.fecha_ig });

    // 8. En espera de mercancía
    var p9 = pieza({ titulo: 'Panettone artesanal: llegó la temporada', producto: 'Panettone', fase: 'aprobada', en_espera: true, espera_producto: 'Panettone', espera_desde: L.addDias(hoy, -4),
      copy_ig: '🎄 El panettone artesanal ya está aquí.', copy_tt: '🎄 ¿Ya probaste el panettone artesanal?', creado_en: ts(8 * 24) });
    ev(p9, 8 * 24, EDI, 'creada', null, null, null, { tipo: 'reel', plataformas: ['ig', 'tt'] });
    ev(p9, 6 * 24, SARA, 'aprobacion', 'copy', 1, null, { banco: true });
    ev(p9, 4 * 24, SARA, 'espera', null, null, 'Panettone', {});

    // 9. En el banco (aprobada, sin fecha)
    var p10 = pieza({ titulo: 'Tabla navideña ideal', tipo: 'carrusel', ig: true, tt: true, producto: 'Quesos y embutidos', fase: 'aprobada',
      copy_ig: '🎁 La tabla perfecta para esta Navidad, armada por nosotros.', copy_tt: '🎁 Tu tabla de Navidad, resuelta.', creado_en: ts(12 * 24) });
    ev(p10, 12 * 24, EDI, 'creada', null, null, null, { tipo: 'carrusel', plataformas: ['ig', 'tt'] });
    ev(p10, 10 * 24, SARA, 'aprobacion', 'copy', 1, null, { banco: true });

    // 10. Programada (fechas calculadas con la regla de 3 días)
    var p11 = pieza({ titulo: 'Aceite de oliva: cómo elegirlo', producto: 'Aceite de oliva', fase: 'aprobada',
      copy_ig: 'Extra virgen, virgen u orujo: te explicamos la diferencia 🫒', copy_tt: '¿Sabías que no todo aceite de oliva es igual? 🫒', creado_en: ts(9 * 24) });
    var sug = L.sugerirFechas(p11, piezas, L.AJUSTES_BASE, L.addDias(hoy, 1), 'tt');
    p11.fecha_ig = sug.fecha_ig; p11.fecha_tt = sug.fecha_tt; p11.primero = sug.primero;
    ev(p11, 9 * 24, EDI, 'creada', null, null, null, { tipo: 'reel', plataformas: ['ig', 'tt'] });
    ev(p11, 8 * 24, EDI, 'envio', 'video', 1, null, {});
    ev(p11, 7.9 * 24, SARA, 'correccion', 'video', 1, null, { chips: ['Cortar inicio'], puntos: [] });
    ev(p11, 7 * 24, EDI, 'envio', 'video', 2, null, {});
    ev(p11, 6.5 * 24, SARA, 'aprobacion', 'video', 2, null, {});
    ev(p11, 6 * 24, EDI, 'envio', 'copy', 1, null, {});
    ev(p11, 5 * 24, SARA, 'aprobacion', 'copy', 1, null, { fecha_ig: p11.fecha_ig, fecha_tt: p11.fecha_tt, primero: p11.primero });

    // 11. Idea
    var p12 = pieza({ titulo: 'Vinos para diciembre', fase: 'idea', producto: 'Vinos', gancho: '3 vinos por menos de lo que crees', creado_en: ts(30) });
    ev(p12, 30, SARA, 'idea', null, null, null, { tipo: 'reel', plataformas: ['ig', 'tt'] });

    return {
      equipo: [
        { user_id: SARA, nombre: 'Sara', rol: 'aprueba', telefono: '', creado_en: ts(500) },
        { user_id: EDI, nombre: 'Editora', rol: 'edita', telefono: '', creado_en: ts(500) }
      ],
      ajustes: JSON.parse(JSON.stringify(L.AJUSTES_BASE)),
      piezas: piezas,
      eventos: eventos
    };
  }

  return { semilla: semilla };
});

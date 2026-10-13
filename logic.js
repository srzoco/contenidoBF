/* Contenido Barquero — reglas del flujo (sin interfaz).
   Funciona en el navegador (window.BFLogic) y en Node (pruebas). */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.BFLogic = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- Constantes ----------
  var PLATAFORMAS = { ig: 'Instagram', tt: 'TikTok' };
  var PLAT_CORTO = { ig: 'IG', tt: 'TikTok' };
  var TIPOS = { reel: 'Reel', carrusel: 'Carrusel' };
  var ETAPAS = { reel: ['video', 'copy'], carrusel: ['texto', 'diseno', 'copy'] };
  var ETAPA_LABEL = { video: 'Video', texto: 'Texto del carrusel', diseno: 'Diseño', copy: 'Copy y fechas' };
  var TIPO_DIA = { reel: 'Reel', carrusel: 'Carrusel', historias: 'Solo historias', descanso: 'Descanso' };
  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var CRONOGRAMA_BASE = {
    '0': { tipo: 'reel', plataformas: ['ig', 'tt'] },
    '1': { tipo: 'carrusel', plataformas: ['ig', 'tt'] },
    '2': { tipo: 'reel', plataformas: ['ig', 'tt'] },
    '3': { tipo: 'historias', plataformas: [] },
    '4': { tipo: 'reel', plataformas: ['ig', 'tt'] },
    '5': { tipo: 'carrusel', plataformas: ['ig', 'tt'] },
    '6': { tipo: 'descanso', plataformas: [] }
  };
  var AJUSTES_BASE = { id: 1, cronograma: CRONOGRAMA_BASE, dias_minimos: 3 };

  var CHIPS = {
    video: ['Cortar inicio', 'Más corto', 'Ritmo / cortes', 'Texto en pantalla', 'Subtítulos', 'Música / audio', 'Color / luz', 'Logo / marca', 'Precio / dato', 'Portada'],
    texto: ['Gancho (slide 1)', 'Muy largo', 'Orden de slides', 'Precio / dato', 'Ortografía', 'Tono de la marca', 'Llamado a la acción'],
    diseno: ['Tipografía', 'Colores de marca', 'Foto / imagen', 'Legibilidad', 'Alineación / espacios', 'Logo', 'Portada'],
    copy: ['Gancho', 'Más corto', 'Llamado a la acción', 'Hashtags', 'Ortografía', 'Tono de la marca', 'Precio / dato']
  };
  // Cómo se ubica un punto de corrección según la etapa
  var UBICACION = { video: 'Min. 0:12', diseno: 'Slide #', texto: 'Slide #', copy: null };

  var OBJETIVOS = ['Vender un producto', 'Educar / dar a conocer', 'Confianza para comprar en la web', 'Temporada / fecha especial', 'Marca / entretener'];

  var CHECKLIST_PUBLICAR = [
    'Archivo final sin marca de agua de otra app',
    'Portada elegida',
    'Precios verificados hoy en barquerofood.com',
    'Copy aprobado pegado completo'
  ];

  var TIPOS_EVENTO = ['creada', 'idea', 'iniciada', 'editada', 'envio', 'aprobacion', 'correccion', 'comentario',
    'espera', 'llego', 'fechas', 'publicado', 'vistas', 'archivada', 'reabierta'];

  // ---------- Fechas ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hoyISO(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function partes(iso) { var p = String(iso).slice(0, 10).split('-'); return [+p[0], +p[1], +p[2]]; }
  function utc(iso) { var p = partes(iso); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function addDias(iso, n) { return new Date(utc(iso) + n * 86400000).toISOString().slice(0, 10); }
  function diaSemana(iso) { return new Date(utc(iso)).getUTCDay(); }
  function diffDias(a, b) { return Math.round((utc(b) - utc(a)) / 86400000); } // b - a
  function fmtFecha(iso) {
    if (!iso) return '';
    var p = partes(iso);
    return DIAS_CORTOS[diaSemana(iso)] + ' ' + p[2] + ' ' + MESES[p[1] - 1];
  }
  function fmtFechaLarga(iso) {
    var p = partes(iso);
    return DIAS[diaSemana(iso)] + ' ' + p[2] + ' de ' + MESES_LARGOS[p[1] - 1];
  }
  function horasEntre(t1, t2) { return (new Date(t2).getTime() - new Date(t1).getTime()) / 3600000; }
  function haceCuanto(ts, ahora) {
    var h = horasEntre(ts, ahora || new Date());
    if (h < 1 / 60) return 'justo ahora';
    if (h < 1) return 'hace ' + Math.max(1, Math.round(h * 60)) + ' min';
    if (h < 24) return 'hace ' + Math.round(h) + ' h';
    var d = Math.round(h / 24);
    return d === 1 ? 'hace 1 día' : 'hace ' + d + ' días';
  }
  function fmtHoras(h) {
    if (h == null || isNaN(h)) return '—';
    if (h < 1) return Math.max(1, Math.round(h * 60)) + ' min';
    if (h < 48) return (Math.round(h * 10) / 10).toString().replace('.', ',') + ' h';
    return (Math.round(h / 24 * 10) / 10).toString().replace('.', ',') + ' días';
  }

  // ---------- Piezas ----------
  function plataformasDe(p) { return ['ig', 'tt'].filter(function (k) { return !!p[k]; }); }
  function fechaDe(p, plat) { return p['fecha_' + plat] || null; }
  function publicadoEn(p, plat) { return p['publicado_' + plat + '_en'] || null; }
  function pendientesDePublicar(p) { return plataformasDe(p).filter(function (pl) { return !publicadoEn(p, pl); }); }
  function etapasDe(p) { return ETAPAS[p.tipo] || ETAPAS.reel; }
  // ¿Ocupa un espacio del calendario?
  function ocupa(p) { return p.fase !== 'archivada' && p.fase !== 'idea' && !p.en_espera; }
  function cron(ajustes) { return (ajustes && ajustes.cronograma) || CRONOGRAMA_BASE; }
  function diaCfg(ajustes, iso) { return cron(ajustes)[String(diaSemana(iso))] || { tipo: 'descanso', plataformas: [] }; }
  function minimo(ajustes) { var m = ajustes && ajustes.dias_minimos; return (m == null || isNaN(m)) ? 3 : +m; }
  function enBanco(p) {
    return p.fase === 'aprobada' && !p.en_espera &&
      pendientesDePublicar(p).some(function (pl) { return !fechaDe(p, pl); });
  }

  function estadoDe(p, hoy) {
    hoy = hoy || hoyISO();
    if (p.fase === 'archivada') return { clave: 'archivada', texto: 'Archivada', tono: 'gris' };
    if (p.en_espera) return { clave: 'espera', texto: 'En espera: ' + (p.espera_producto || 'mercancía'), tono: 'espera' };
    if (p.fase === 'idea') return { clave: 'idea', texto: 'Idea', tono: 'gris' };
    if (p.fase === 'produccion') {
      var et = ETAPA_LABEL[p.etapa] || p.etapa;
      if (p.turno === 'aprueba') return { clave: 'revisar', texto: et + ' v' + p.version + ' · por aprobar', tono: 'aprueba' };
      if (p.version > 0) return { clave: 'corregir', texto: et + ' · con correcciones', tono: 'corregir' };
      return { clave: 'editar', texto: et + ' · en edición', tono: 'edita' };
    }
    if (p.fase === 'publicada') return { clave: 'publicada', texto: 'Publicada', tono: 'ok' };
    if (p.fase === 'aprobada') {
      var pend = pendientesDePublicar(p);
      var atrasada = pend.some(function (pl) { var f = fechaDe(p, pl); return f && f < hoy; });
      if (atrasada) return { clave: 'atrasada', texto: 'Atrasada', tono: 'atrasada' };
      var conFecha = pend.filter(function (pl) { return fechaDe(p, pl); });
      var publicadas = plataformasDe(p).filter(function (pl) { return publicadoEn(p, pl); });
      if (conFecha.length === 0) {
        return { clave: 'banco', texto: publicadas.length ? 'Publicada en ' + publicadas.map(function (x) { return PLAT_CORTO[x]; }).join(' y ') + ' · resto en banco' : 'En banco', tono: 'banco' };
      }
      var txt = conFecha.map(function (pl) { return PLAT_CORTO[pl] + ' ' + fmtFecha(fechaDe(p, pl)); }).join(' · ');
      var prefijo = publicadas.length ? 'Publicada en ' + publicadas.map(function (x) { return PLAT_CORTO[x]; }).join(' y ') + ' · ' : 'Programada: ';
      return { clave: 'programada', texto: prefijo + txt, tono: 'ok' };
    }
    return { clave: p.fase, texto: p.fase, tono: 'gris' };
  }

  // ---------- Calendario y sugerencia de fechas ----------
  function ocupado(piezas, plat, iso, excluirId) {
    return piezas.some(function (p) {
      return p.id !== excluirId && ocupa(p) && p[plat] && fechaDe(p, plat) === iso;
    });
  }
  function slotLibre(piezas, ajustes, plat, tipo, desde, excluirId, limite) {
    limite = limite || 120;
    for (var i = 0; i < limite; i++) {
      var d = addDias(desde, i);
      var c = diaCfg(ajustes, d);
      if (c.tipo === tipo && (c.plataformas || []).indexOf(plat) >= 0 && !ocupado(piezas, plat, d, excluirId)) return d;
    }
    return null;
  }
  function maxFecha(a, b) { if (!a) return b; if (!b) return a; return a > b ? a : b; }

  // Sugiere fechas para las plataformas que faltan por publicar.
  // primeroPreferido: 'ig' | 'tt' | null (si es null, va primero la que tenga hueco antes).
  function sugerirFechas(p, piezas, ajustes, desde, primeroPreferido) {
    var pend = pendientesDePublicar(p);
    var min = minimo(ajustes);
    var res = { primero: null, fecha_ig: null, fecha_tt: null };
    if (!pend.length) return res;
    if (pend.length === 1) {
      var pl = pend[0], otra = pl === 'ig' ? 'tt' : 'ig';
      var base = desde;
      var fOtra = p[otra] ? (publicadoEn(p, otra) ? String(publicadoEn(p, otra)).slice(0, 10) : fechaDe(p, otra)) : null;
      if (fOtra) base = maxFecha(desde, addDias(fOtra, min));
      res['fecha_' + pl] = slotLibre(piezas, ajustes, pl, p.tipo, base, p.id);
      res.primero = fOtra ? otra : pl;
      if (p[otra]) res['fecha_' + otra] = fechaDe(p, otra);
      return res;
    }
    var primero = primeroPreferido;
    if (primero !== 'ig' && primero !== 'tt') {
      var a = slotLibre(piezas, ajustes, 'ig', p.tipo, desde, p.id);
      var b = slotLibre(piezas, ajustes, 'tt', p.tipo, desde, p.id);
      primero = !a ? 'tt' : !b ? 'ig' : (b < a ? 'tt' : 'ig');
    }
    var segundo = primero === 'ig' ? 'tt' : 'ig';
    var f1 = slotLibre(piezas, ajustes, primero, p.tipo, desde, p.id);
    var f2 = f1 ? slotLibre(piezas, ajustes, segundo, p.tipo, addDias(f1, min), p.id) : null;
    res.primero = primero;
    res['fecha_' + primero] = f1;
    res['fecha_' + segundo] = f2;
    return res;
  }

  // Avisos (no bloquean) sobre unas fechas propuestas.
  function validarFechas(p, fechas, piezas, ajustes, hoy) {
    var avisos = [];
    var min = minimo(ajustes);
    plataformasDe(p).forEach(function (pl) {
      var f = fechas['fecha_' + pl];
      if (!f || publicadoEn(p, pl)) return;
      var c = diaCfg(ajustes, f);
      var nombreDia = DIAS[diaSemana(f)];
      if (hoy && f < hoy) avisos.push(PLAT_CORTO[pl] + ': la fecha ya pasó.');
      if (c.tipo !== p.tipo) {
        avisos.push(PLAT_CORTO[pl] + ': el ' + nombreDia.toLowerCase() + ' es día de ' + TIPO_DIA[c.tipo].toLowerCase() + ' en el cronograma.');
      } else if ((c.plataformas || []).indexOf(pl) < 0) {
        avisos.push(PLAT_CORTO[pl] + ': el cronograma no tiene ' + PLATAFORMAS[pl] + ' el ' + nombreDia.toLowerCase() + '.');
      }
      var otra = piezas.filter(function (q) { return q.id !== p.id && ocupa(q) && q[pl] && fechaDe(q, pl) === f; })[0];
      if (otra) avisos.push(PLAT_CORTO[pl] + ': ese día ya está «' + otra.titulo + '».');
    });
    if (p.ig && p.tt) {
      var fi = publicadoEn(p, 'ig') ? String(publicadoEn(p, 'ig')).slice(0, 10) : fechas.fecha_ig;
      var ft = publicadoEn(p, 'tt') ? String(publicadoEn(p, 'tt')).slice(0, 10) : fechas.fecha_tt;
      if (fi && ft) {
        var d = Math.abs(diffDias(fi, ft));
        if (d < min) avisos.push('Solo ' + d + (d === 1 ? ' día' : ' días') + ' entre IG y TikTok (mínimo ' + min + ').');
      }
    }
    return avisos;
  }

  function huecos(piezas, ajustes, desde, dias) {
    dias = dias || 7;
    var res = [];
    for (var i = 0; i < dias; i++) {
      var d = addDias(desde, i);
      var c = diaCfg(ajustes, d);
      if (c.tipo !== 'reel' && c.tipo !== 'carrusel') continue;
      (c.plataformas || []).forEach(function (pl) {
        if (!ocupado(piezas, pl, d, null)) res.push({ fecha: d, plataforma: pl, tipo: c.tipo });
      });
    }
    return res;
  }

  // Piezas del banco que sirven para un hueco
  function candidatosHueco(piezas, hueco) {
    return piezas.filter(function (p) {
      return p.fase === 'aprobada' && !p.en_espera && p.tipo === hueco.tipo && p[hueco.plataforma] &&
        !publicadoEn(p, hueco.plataforma) && !fechaDe(p, hueco.plataforma);
    });
  }

  // ---------- Acciones (devuelven {patch, match, eventos}) ----------
  function err(msg) { var e = new Error(msg); e.usuario = true; return e; }
  function txt(v) { return v == null ? '' : String(v).trim(); }
  function limpiar(v) { var t = txt(v); return t ? t : null; }

  function nuevaPieza(datos, opciones) {
    opciones = opciones || {};
    var titulo = txt(datos.titulo);
    if (!titulo) throw err('Ponle un título a la pieza.');
    var tipo = datos.tipo === 'carrusel' ? 'carrusel' : 'reel';
    var ig = !!datos.ig, tt = !!datos.tt;
    var esIdea = !!datos.idea;
    if (!ig && !tt) {
      if (esIdea) { ig = true; tt = true; } else throw err('Elige al menos una plataforma.');
    }
    var fila = {
      id: opciones.id,
      titulo: titulo, tipo: tipo, ig: ig, tt: tt,
      producto: limpiar(datos.producto), gancho: limpiar(datos.gancho), objetivo: limpiar(datos.objetivo),
      fase: esIdea ? 'idea' : 'produccion',
      etapa: esIdea ? null : ETAPAS[tipo][0],
      turno: esIdea ? null : 'edita',
      version: 0,
      en_espera: !!datos.en_espera && !!txt(datos.espera_producto),
      espera_producto: datos.en_espera ? limpiar(datos.espera_producto) : null,
      espera_desde: datos.en_espera && txt(datos.espera_producto) ? (opciones.hoy || hoyISO()) : null
    };
    var eventos = [{ tipo: esIdea ? 'idea' : 'creada', texto: null, datos: { tipo: tipo, plataformas: plataformasDe(fila) } }];
    if (fila.en_espera) eventos.push({ tipo: 'espera', texto: fila.espera_producto, datos: {} });
    return { fila: fila, eventos: eventos };
  }

  function exigirProduccion(p, turno) {
    if (p.fase !== 'produccion') throw err('Esta pieza ya no está en producción.');
    if (turno && p.turno !== turno) {
      throw err(turno === 'edita' ? 'Esta pieza ya está esperando aprobación.' : 'Esta pieza no está esperando aprobación.');
    }
  }
  function matchDe(p) { return { fase: p.fase, turno: p.turno, version: p.version || 0, etapa: p.etapa }; }

  function accionEnviar(p, datos) {
    exigirProduccion(p, 'edita');
    datos = datos || {};
    var version = (p.version || 0) + 1;
    var patch = { turno: 'aprueba', version: version, nota_version: limpiar(datos.nota), enlace_version: limpiar(datos.enlace) };
    var ev = {};
    if (p.etapa === 'texto') {
      if (!txt(datos.texto_carrusel)) throw err('Escribe el texto del carrusel antes de enviarlo.');
      patch.texto_carrusel = String(datos.texto_carrusel).trim();
      ev.texto_carrusel = patch.texto_carrusel;
    }
    if (p.etapa === 'copy') {
      plataformasDe(p).forEach(function (pl) {
        if (!txt(datos['copy_' + pl])) throw err('Falta el copy de ' + PLATAFORMAS[pl] + '.');
        patch['copy_' + pl] = String(datos['copy_' + pl]).trim();
        ev['copy_' + pl] = patch['copy_' + pl];
      });
      Object.assign(patch, fechasPatch(p, datos.banco ? {} : datos));
      ev.fecha_ig = patch.fecha_ig; ev.fecha_tt = patch.fecha_tt; ev.primero = patch.primero;
      if (datos.banco || (!patch.fecha_ig && !patch.fecha_tt)) ev.banco = true;
    }
    if (datos.resueltas && datos.resueltas.length) ev.resueltas = datos.resueltas;
    if (patch.enlace_version) ev.enlace = patch.enlace_version;
    return {
      patch: patch, match: matchDe(p),
      eventos: [{ tipo: 'envio', etapa: p.etapa, version: version, texto: patch.nota_version, datos: ev }]
    };
  }

  function fechasPatch(p, f) {
    f = f || {};
    var out = {};
    ['ig', 'tt'].forEach(function (pl) {
      if (publicadoEn(p, pl)) return; // no se toca una fecha ya publicada
      out['fecha_' + pl] = p[pl] ? (limpiar(f['fecha_' + pl]) || null) : null;
    });
    var prim = f.primero === 'ig' || f.primero === 'tt' ? f.primero : null;
    if (!prim) {
      var fi = out.fecha_ig !== undefined ? out.fecha_ig : p.fecha_ig;
      var ft = out.fecha_tt !== undefined ? out.fecha_tt : p.fecha_tt;
      if (fi && ft) prim = fi <= ft ? 'ig' : 'tt';
      else if (fi) prim = 'ig'; else if (ft) prim = 'tt';
    }
    out.primero = prim;
    return out;
  }

  function accionAprobar(p, datos) {
    exigirProduccion(p, 'aprueba');
    datos = datos || {};
    var etapas = etapasDe(p);
    var i = etapas.indexOf(p.etapa);
    var ultima = i === etapas.length - 1;
    var ev = { tipo: 'aprobacion', etapa: p.etapa, version: p.version, texto: limpiar(datos.comentario), datos: {} };
    var patch;
    // Ajustes menores que hace quien aprueba (sin devolver la pieza)
    var ajustes = {};
    if (p.etapa === 'texto' && datos.texto_carrusel != null && txt(datos.texto_carrusel) && txt(datos.texto_carrusel) !== txt(p.texto_carrusel)) {
      ajustes.texto_carrusel = String(datos.texto_carrusel).trim();
    }
    if (p.etapa === 'copy') {
      plataformasDe(p).forEach(function (pl) {
        var v = datos['copy_' + pl];
        if (v != null && txt(v) && txt(v) !== txt(p['copy_' + pl])) ajustes['copy_' + pl] = String(v).trim();
      });
    }
    if (ultima) {
      patch = { fase: 'aprobada', etapa: null, turno: null, nota_version: null, enlace_version: null };
      if (p.etapa === 'copy') {
        var fp = fechasPatch(p, datos.banco ? {} : (datos.fechas || datos));
        Object.assign(patch, fp);
        ev.datos.fecha_ig = fp.fecha_ig; ev.datos.fecha_tt = fp.fecha_tt; ev.datos.primero = fp.primero;
        if (!fp.fecha_ig && !fp.fecha_tt) ev.datos.banco = true;
      }
    } else {
      patch = { etapa: etapas[i + 1], turno: 'edita', version: 0, nota_version: null, enlace_version: null };
    }
    if (Object.keys(ajustes).length) {
      Object.assign(patch, ajustes);
      ev.datos.ajustes = ajustes;
    }
    return { patch: patch, match: matchDe(p), eventos: [ev] };
  }

  function accionCorregir(p, datos) {
    exigirProduccion(p, 'aprueba');
    datos = datos || {};
    var chips = (datos.chips || []).filter(Boolean);
    var puntos = (datos.puntos || []).map(function (x) {
      return { ubicacion: limpiar(x.ubicacion), texto: limpiar(x.texto) };
    }).filter(function (x) { return x.texto || x.ubicacion; });
    var comentario = limpiar(datos.comentario);
    if (!chips.length && !puntos.length && !comentario) throw err('Indica al menos una corrección.');
    return {
      patch: { turno: 'edita' }, match: matchDe(p),
      eventos: [{ tipo: 'correccion', etapa: p.etapa, version: p.version, texto: comentario, datos: { chips: chips, puntos: puntos } }]
    };
  }

  function accionEspera(p, producto, hoy) {
    if (p.fase === 'archivada' || p.fase === 'publicada') throw err('Esta pieza ya no está activa.');
    var prod = txt(producto);
    if (!prod) throw err('¿Qué mercancía se está esperando?');
    var patch = { en_espera: true, espera_producto: prod, espera_desde: hoy || hoyISO() };
    var antes = {};
    pendientesDePublicar(p).forEach(function (pl) {
      if (fechaDe(p, pl)) { antes['fecha_' + pl] = fechaDe(p, pl); patch['fecha_' + pl] = null; }
    });
    return { patch: patch, match: { en_espera: false }, eventos: [{ tipo: 'espera', texto: prod, datos: { fechas_quitadas: antes } }] };
  }

  function accionLlego(p) {
    if (!p.en_espera) throw err('Esta pieza no estaba en espera.');
    return {
      patch: { en_espera: false, espera_producto: null, espera_desde: null }, match: { en_espera: true },
      eventos: [{ tipo: 'llego', texto: p.espera_producto, datos: {} }]
    };
  }

  function accionFechas(p, fechas) {
    if (p.fase !== 'aprobada') throw err('Solo se programan piezas ya aprobadas.');
    if (p.en_espera) throw err('Esta pieza está en espera de mercancía.');
    var fp = fechasPatch(p, fechas);
    var datos = { fecha_ig: fp.fecha_ig, fecha_tt: fp.fecha_tt, primero: fp.primero };
    if (!fp.fecha_ig && !fp.fecha_tt) datos.banco = true;
    return { patch: fp, match: { fase: 'aprobada' }, eventos: [{ tipo: 'fechas', texto: null, datos: datos }] };
  }

  function accionPublicar(p, plat, datos, ahora, hoy) {
    if (p.fase !== 'aprobada') throw err('Esta pieza no está lista para publicar.');
    if (!p[plat]) throw err('Esta pieza no es para ' + PLATAFORMAS[plat] + '.');
    if (publicadoEn(p, plat)) throw err('Ya estaba marcada como publicada en ' + PLATAFORMAS[plat] + '.');
    datos = datos || {};
    var marcados = datos.checklist || [];
    if (marcados.length < CHECKLIST_PUBLICAR.length) throw err('Completa la lista antes de publicar.');
    var ts = ahora || new Date().toISOString();
    var patch = {};
    patch['publicado_' + plat + '_en'] = ts;
    patch['enlace_' + plat] = limpiar(datos.enlace);
    if (!fechaDe(p, plat)) patch['fecha_' + plat] = hoy || hoyISO();
    var resto = pendientesDePublicar(p).filter(function (x) { return x !== plat; });
    if (!resto.length) patch.fase = 'publicada';
    var m = { fase: 'aprobada' };
    m['publicado_' + plat + '_en'] = null;
    return { patch: patch, match: m, eventos: [{ tipo: 'publicado', texto: null, datos: { plataforma: plat, enlace: patch['enlace_' + plat] } }] };
  }

  function accionVistas(p, datos) {
    var patch = {}, ev = {};
    ['ig', 'tt'].forEach(function (pl) {
      var v = datos['vistas_' + pl];
      if (v === '' || v == null) return;
      var n = parseInt(String(v).replace(/[.\s,]/g, ''), 10);
      if (isNaN(n) || n < 0) throw err('Las vistas deben ser un número.');
      if (!publicadoEn(p, pl)) return;
      patch['vistas_' + pl] = n; ev['vistas_' + pl] = n;
    });
    if (!Object.keys(patch).length) throw err('Anota al menos un número de vistas.');
    return { patch: patch, match: {}, eventos: [{ tipo: 'vistas', texto: null, datos: ev }] };
  }

  function accionComentario(p, texto) {
    var t = txt(texto);
    if (!t) throw err('Escribe el comentario.');
    return { patch: null, match: {}, eventos: [{ tipo: 'comentario', etapa: p.etapa || null, version: p.version || null, texto: t, datos: {} }] };
  }

  function accionArchivar(p) {
    if (p.fase === 'archivada') throw err('Ya está archivada.');
    return { patch: { fase: 'archivada' }, match: { fase: p.fase }, eventos: [{ tipo: 'archivada', texto: null, datos: { fase_anterior: p.fase } }] };
  }

  function accionReabrir(p, eventos) {
    if (p.fase !== 'archivada') throw err('No está archivada.');
    var ult = (eventos || []).filter(function (e) { return e.pieza_id === p.id && e.tipo === 'archivada'; }).pop();
    var fase = ult && ult.datos && ult.datos.fase_anterior;
    if (!fase) fase = p.etapa ? 'produccion' : (pendientesDePublicar(p).length ? (p.copy_ig || p.copy_tt ? 'aprobada' : 'idea') : 'publicada');
    return { patch: { fase: fase }, match: { fase: 'archivada' }, eventos: [{ tipo: 'reabierta', texto: null, datos: { fase: fase } }] };
  }

  function accionIniciar(p, datos) {
    if (p.fase !== 'idea') throw err('Esta pieza ya empezó.');
    datos = datos || {};
    var tipo = datos.tipo === 'carrusel' ? 'carrusel' : datos.tipo === 'reel' ? 'reel' : p.tipo;
    var ig = datos.ig != null ? !!datos.ig : p.ig, tt = datos.tt != null ? !!datos.tt : p.tt;
    if (!ig && !tt) throw err('Elige al menos una plataforma.');
    var patch = { fase: 'produccion', tipo: tipo, ig: ig, tt: tt, etapa: ETAPAS[tipo][0], turno: 'edita', version: 0 };
    ['producto', 'gancho', 'objetivo'].forEach(function (k) { if (datos[k] != null) patch[k] = limpiar(datos[k]); });
    return { patch: patch, match: { fase: 'idea' }, eventos: [{ tipo: 'iniciada', texto: null, datos: { tipo: tipo } }] };
  }

  function puedeCambiarTipo(p) {
    return p.fase === 'idea' || (p.fase === 'produccion' && p.etapa === ETAPAS[p.tipo][0] && (p.version || 0) === 0 && p.turno === 'edita');
  }

  function accionEditar(p, datos) {
    var patch = {}, cambios = [];
    var titulo = txt(datos.titulo);
    if (!titulo) throw err('El título no puede quedar vacío.');
    if (titulo !== p.titulo) { patch.titulo = titulo; cambios.push('título'); }
    ['producto', 'gancho', 'objetivo'].forEach(function (k) {
      var v = limpiar(datos[k]);
      if ((v || null) !== (p[k] || null)) { patch[k] = v; cambios.push(k); }
    });
    if (datos.tipo && datos.tipo !== p.tipo) {
      if (!puedeCambiarTipo(p)) throw err('El tipo ya no se puede cambiar en esta etapa.');
      patch.tipo = datos.tipo;
      if (p.fase === 'produccion') patch.etapa = ETAPAS[datos.tipo][0];
      cambios.push('tipo');
    }
    var ig = datos.ig != null ? !!datos.ig : p.ig, tt = datos.tt != null ? !!datos.tt : p.tt;
    if (!ig && !tt) throw err('Elige al menos una plataforma.');
    ['ig', 'tt'].forEach(function (pl) {
      var v = pl === 'ig' ? ig : tt;
      if (v !== !!p[pl]) {
        if (!v && publicadoEn(p, pl)) throw err('Ya se publicó en ' + PLATAFORMAS[pl] + '; no se puede quitar.');
        patch[pl] = v;
        if (!v) patch['fecha_' + pl] = null;
        cambios.push(PLATAFORMAS[pl] + (v ? ' (agregada)' : ' (quitada)'));
      }
    });
    if (!cambios.length) throw err('No hay cambios que guardar.');
    if (p.fase === 'aprobada' && (patch.ig === true || patch.tt === true)) {
      // Se agregó una plataforma a una pieza ya aprobada: falta su copy.
      var faltaCopy = ['ig', 'tt'].filter(function (pl) { return patch[pl] === true && !txt(p['copy_' + pl]); });
      if (faltaCopy.length) cambios.push('falta copy de ' + faltaCopy.map(function (x) { return PLATAFORMAS[x]; }).join(' y '));
    }
    return { patch: patch, match: {}, eventos: [{ tipo: 'editada', texto: cambios.join(', '), datos: { cambios: cambios } }] };
  }

  // ---------- Pendientes por rol ----------
  function pendientes(piezas, eventos, rol, hoy, ajustes) {
    hoy = hoy || hoyISO();
    var r = { revisar: [], corregir: [], editar: [], publicar: [], vistas: [], espera: [], atrasadas: [], hoy: [], huecos: [] };
    piezas.forEach(function (p) {
      if (p.fase === 'archivada' || p.fase === 'idea') return;
      if (p.en_espera) { r.espera.push(p); return; }
      if (p.fase === 'produccion') {
        if (p.turno === 'aprueba') r.revisar.push(p);
        else if (p.version > 0) r.corregir.push(p);
        else r.editar.push(p);
      }
      if (p.fase === 'aprobada') {
        pendientesDePublicar(p).forEach(function (pl) {
          var f = fechaDe(p, pl);
          if (f && f <= hoy) {
            var item = { pieza: p, plataforma: pl, fecha: f, atrasada: f < hoy };
            r.publicar.push(item);
            (item.atrasada ? r.atrasadas : r.hoy).push(item);
          }
        });
      }
      plataformasDe(p).forEach(function (pl) {
        var pub = publicadoEn(p, pl);
        if (pub && p['vistas_' + pl] == null && diffDias(String(pub).slice(0, 10), hoy) >= 7) r.vistas.push({ pieza: p, plataforma: pl });
      });
    });
    var ultimoEnvio = {};
    (eventos || []).forEach(function (e) { if (e.tipo === 'envio') ultimoEnvio[e.pieza_id] = e.creado_en; });
    r.revisar.sort(function (a, b) {
      var fa = minFecha(a), fb = minFecha(b);
      if (fa !== fb) return fa < fb ? -1 : 1;
      return String(ultimoEnvio[a.id] || a.actualizado_en || '') < String(ultimoEnvio[b.id] || b.actualizado_en || '') ? -1 : 1;
    });
    r.publicar.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
    r.huecos = huecos(piezas, ajustes, hoy, 7);
    r.total = rol === 'aprueba'
      ? r.revisar.length
      : r.corregir.length + r.editar.length + r.publicar.length + r.vistas.length;
    return r;
  }
  function minFecha(p) {
    var f = [p.fecha_ig, p.fecha_tt].filter(Boolean).sort()[0];
    return f || '9999-12-31';
  }

  // Esperas agrupadas por producto
  function esperasPorProducto(piezas) {
    var g = {};
    piezas.forEach(function (p) {
      if (!p.en_espera || p.fase === 'archivada') return;
      var k = (p.espera_producto || 'Sin nombre').trim();
      var key = k.toLowerCase();
      if (!g[key]) g[key] = { producto: k, piezas: [], desde: p.espera_desde };
      g[key].piezas.push(p);
      if (p.espera_desde && (!g[key].desde || p.espera_desde < g[key].desde)) g[key].desde = p.espera_desde;
    });
    return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return String(a.desde) < String(b.desde) ? -1 : 1; });
  }

  // ---------- Historial y métricas ----------
  function eventosDe(eventos, piezaId) {
    return (eventos || []).filter(function (e) { return e.pieza_id === piezaId; })
      .sort(function (a, b) { return a.creado_en < b.creado_en ? -1 : a.creado_en > b.creado_en ? 1 : 0; });
  }
  function rondasDe(eventos, piezaId) {
    var r = {};
    (eventos || []).forEach(function (e) {
      if (e.pieza_id === piezaId && e.tipo === 'correccion') r[e.etapa] = (r[e.etapa] || 0) + 1;
    });
    return r;
  }
  function ultimaCorreccion(eventos, p) {
    var lista = (eventos || []).filter(function (e) {
      return e.pieza_id === p.id && e.tipo === 'correccion' && e.etapa === p.etapa;
    }).sort(function (a, b) { return a.creado_en < b.creado_en ? -1 : 1; });
    return lista[lista.length - 1] || null;
  }
  function ultimoEnvio(eventos, p) {
    var lista = (eventos || []).filter(function (e) {
      return e.pieza_id === p.id && e.tipo === 'envio' && e.etapa === p.etapa;
    }).sort(function (a, b) { return a.creado_en < b.creado_en ? -1 : 1; });
    return lista[lista.length - 1] || null;
  }

  function mediana(xs) {
    if (!xs.length) return null;
    var s = xs.slice().sort(function (a, b) { return a - b; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function promedio(xs) { return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : null; }

  function metricas(piezas, eventos, ajustes, hoy, dias) {
    hoy = hoy || hoyISO();
    dias = dias || 30;
    var desde = addDias(hoy, -dias);
    var evs = (eventos || []).slice().sort(function (a, b) { return a.creado_en < b.creado_en ? -1 : 1; });
    var enPeriodo = function (e) { return String(e.creado_en).slice(0, 10) >= desde; };
    var porPieza = {};
    evs.forEach(function (e) { (porPieza[e.pieza_id] = porPieza[e.pieza_id] || []).push(e); });

    // Rondas por etapa (piezas cuya etapa se aprobó en el período)
    var rondas = {}; // etapa -> [n]
    evs.forEach(function (e) {
      if (e.tipo !== 'aprobacion' || !enPeriodo(e)) return;
      var n = (porPieza[e.pieza_id] || []).filter(function (x) { return x.tipo === 'correccion' && x.etapa === e.etapa; }).length;
      (rondas[e.etapa] = rondas[e.etapa] || []).push(n);
    });
    var rondasEtapa = Object.keys(ETAPA_LABEL).filter(function (k) { return rondas[k]; }).map(function (k) {
      return { etapa: k, label: ETAPA_LABEL[k], promedio: promedio(rondas[k]), piezas: rondas[k].length, sinCorrecciones: rondas[k].filter(function (n) { return n === 0; }).length };
    });

    // Correcciones más frecuentes
    var conteo = {};
    var totalCorrecciones = 0;
    evs.forEach(function (e) {
      if (e.tipo !== 'correccion' || !enPeriodo(e)) return;
      totalCorrecciones++;
      ((e.datos && e.datos.chips) || []).forEach(function (c) {
        var k = (ETAPA_LABEL[e.etapa] || e.etapa) + ' · ' + c;
        conteo[k] = (conteo[k] || 0) + 1;
      });
    });
    var chips = Object.keys(conteo).map(function (k) { return { chip: k, veces: conteo[k] }; })
      .sort(function (a, b) { return b.veces - a.veces; }).slice(0, 8);

    // Tiempos: respuesta de aprobación y de corrección
    var tAprob = [], tCorr = [];
    Object.keys(porPieza).forEach(function (id) {
      var lista = porPieza[id];
      lista.forEach(function (e, i) {
        if (!enPeriodo(e)) return;
        if (e.tipo === 'aprobacion' || e.tipo === 'correccion') {
          for (var j = i - 1; j >= 0; j--) {
            var x = lista[j];
            if (x.tipo === 'envio' && x.etapa === e.etapa && x.version === e.version) { tAprob.push(horasEntre(x.creado_en, e.creado_en)); break; }
          }
        }
        if (e.tipo === 'envio' && e.version > 1) {
          for (var k = i - 1; k >= 0; k--) {
            var y = lista[k];
            if (y.tipo === 'correccion' && y.etapa === e.etapa && y.version === e.version - 1) { tCorr.push(horasEntre(y.creado_en, e.creado_en)); break; }
          }
        }
      });
    });

    // Publicadas y cumplimiento del cronograma (días ya pasados)
    var publicadas = evs.filter(function (e) { return e.tipo === 'publicado' && enPeriodo(e); }).length;
    var slots = 0, llenos = 0;
    for (var i = dias; i >= 1; i--) {
      var d = addDias(hoy, -i);
      var c = diaCfg(ajustes, d);
      if (c.tipo !== 'reel' && c.tipo !== 'carrusel') continue;
      (c.plataformas || []).forEach(function (pl) {
        slots++;
        var ok = piezas.some(function (p) { return p[pl] && fechaDe(p, pl) === d && publicadoEn(p, pl); });
        if (ok) llenos++;
      });
    }

    // Vistas
    var conVistas = [];
    piezas.forEach(function (p) {
      ['ig', 'tt'].forEach(function (pl) {
        var pub = publicadoEn(p, pl);
        if (p['vistas_' + pl] != null && pub && String(pub).slice(0, 10) >= addDias(hoy, -Math.max(dias, 90))) {
          conVistas.push({ pieza: p, plataforma: pl, vistas: p['vistas_' + pl] });
        }
      });
    });
    conVistas.sort(function (a, b) { return b.vistas - a.vistas; });
    var promVistas = {};
    conVistas.forEach(function (v) {
      var k = v.pieza.tipo + '|' + v.plataforma;
      (promVistas[k] = promVistas[k] || []).push(v.vistas);
    });
    var vistasPorTipo = Object.keys(promVistas).map(function (k) {
      var s = k.split('|');
      return { tipo: s[0], plataforma: s[1], promedio: promedio(promVistas[k]), n: promVistas[k].length };
    }).sort(function (a, b) { return b.promedio - a.promedio; });

    return {
      dias: dias, desde: desde,
      rondasEtapa: rondasEtapa, chips: chips, totalCorrecciones: totalCorrecciones,
      respuestaAprobacion: { mediana: mediana(tAprob), n: tAprob.length },
      respuestaCorreccion: { mediana: mediana(tCorr), n: tCorr.length },
      publicadas: publicadas,
      cumplimiento: { slots: slots, llenos: llenos, pct: slots ? Math.round(llenos / slots * 100) : null },
      topVistas: conVistas.slice(0, 5), vistasPorTipo: vistasPorTipo
    };
  }

  // ---------- WhatsApp ----------
  function normalizarTelefono(t) {
    var d = String(t || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 11 && d.charAt(0) === '0') return '58' + d.slice(1); // 0414… → 58414…
    if (d.length === 10 && d.charAt(0) === '4') return '58' + d;          // 414…  → 58414…
    return d;
  }
  function waLink(telefono, texto) {
    var tel = normalizarTelefono(telefono);
    return 'https://wa.me/' + (tel || '') + '?text=' + encodeURIComponent(texto);
  }
  function enlacePieza(base, id) { return String(base || '').replace(/#.*$/, '') + '#/p/' + id; }
  function nombreEtapa(e) { return ETAPA_LABEL[e] || e || ''; }

  function msgEnvio(p, base, nombre) {
    var visual = p.etapa === 'video' || p.etapa === 'diseno';
    return (nombre ? 'Hola ' + nombre + ', ' : '') + 'te dejé para revisar: *' + p.titulo + '* — ' + nombreEtapa(p.etapa) + ' v' + p.version + '.' +
      (visual ? '\nTe mando el archivo por aquí 👇' : '') +
      '\nApruébalo o corrígelo en la app: ' + enlacePieza(base, p.id);
  }
  function msgCorreccion(p, ev, base) {
    var d = (ev && ev.datos) || {};
    var lineas = ['✏️ Correcciones en *' + p.titulo + '* (' + nombreEtapa(ev.etapa) + ' v' + ev.version + '):'];
    (d.chips || []).forEach(function (c) { lineas.push('• ' + c); });
    (d.puntos || []).forEach(function (x) { lineas.push('• ' + (x.ubicacion ? x.ubicacion + ' — ' : '') + (x.texto || '')); });
    if (ev.texto) lineas.push('• ' + ev.texto);
    lineas.push('Detalle en la app: ' + enlacePieza(base, p.id));
    return lineas.join('\n');
  }
  function msgAprobacion(p, ev, base, siguiente) {
    return '✅ Aprobado: *' + p.titulo + '* — ' + nombreEtapa(ev.etapa) + '.' +
      (siguiente ? '\nSigue: ' + nombreEtapa(siguiente) + '.' : (ev.datos && ev.datos.banco ? '\nQuedó en el banco (sin fecha).' : '\nYa tiene fecha en el calendario.')) +
      '\n' + enlacePieza(base, p.id);
  }
  function msgResumenLote(items, base) {
    var ap = items.filter(function (x) { return x.accion === 'aprobada'; });
    var co = items.filter(function (x) { return x.accion === 'correccion'; });
    var l = ['Revisé ' + (ap.length + co.length) + (ap.length + co.length === 1 ? ' pieza' : ' piezas') + ': ✅ ' + ap.length + ' aprobadas, ✏️ ' + co.length + ' con correcciones.'];
    co.forEach(function (x) { l.push('✏️ ' + x.titulo + ' (' + nombreEtapa(x.etapa) + ')'); });
    ap.forEach(function (x) { l.push('✅ ' + x.titulo + ' (' + nombreEtapa(x.etapa) + ')'); });
    l.push('Tus pendientes: ' + String(base || '').replace(/#.*$/, '') + '#/');
    return l.join('\n');
  }

  return {
    PLATAFORMAS: PLATAFORMAS, PLAT_CORTO: PLAT_CORTO, TIPOS: TIPOS, ETAPAS: ETAPAS, ETAPA_LABEL: ETAPA_LABEL, TIPO_DIA: TIPO_DIA,
    DIAS: DIAS, DIAS_CORTOS: DIAS_CORTOS, CRONOGRAMA_BASE: CRONOGRAMA_BASE, AJUSTES_BASE: AJUSTES_BASE,
    CHIPS: CHIPS, UBICACION: UBICACION, OBJETIVOS: OBJETIVOS, CHECKLIST_PUBLICAR: CHECKLIST_PUBLICAR, TIPOS_EVENTO: TIPOS_EVENTO,
    hoyISO: hoyISO, addDias: addDias, diaSemana: diaSemana, diffDias: diffDias, fmtFecha: fmtFecha, fmtFechaLarga: fmtFechaLarga,
    horasEntre: horasEntre, haceCuanto: haceCuanto, fmtHoras: fmtHoras,
    plataformasDe: plataformasDe, fechaDe: fechaDe, publicadoEn: publicadoEn, pendientesDePublicar: pendientesDePublicar,
    etapasDe: etapasDe, ocupa: ocupa, diaCfg: diaCfg, minimo: minimo, enBanco: enBanco, estadoDe: estadoDe,
    ocupado: ocupado, slotLibre: slotLibre, sugerirFechas: sugerirFechas, validarFechas: validarFechas,
    huecos: huecos, candidatosHueco: candidatosHueco,
    nuevaPieza: nuevaPieza, accionEnviar: accionEnviar, accionAprobar: accionAprobar, accionCorregir: accionCorregir,
    accionEspera: accionEspera, accionLlego: accionLlego, accionFechas: accionFechas, accionPublicar: accionPublicar,
    accionVistas: accionVistas, accionComentario: accionComentario, accionArchivar: accionArchivar, accionReabrir: accionReabrir,
    accionIniciar: accionIniciar, accionEditar: accionEditar, puedeCambiarTipo: puedeCambiarTipo,
    pendientes: pendientes, esperasPorProducto: esperasPorProducto,
    eventosDe: eventosDe, rondasDe: rondasDe, ultimaCorreccion: ultimaCorreccion, ultimoEnvio: ultimoEnvio, metricas: metricas,
    normalizarTelefono: normalizarTelefono, waLink: waLink, enlacePieza: enlacePieza, nombreEtapa: nombreEtapa,
    msgEnvio: msgEnvio, msgCorreccion: msgCorreccion, msgAprobacion: msgAprobacion, msgResumenLote: msgResumenLote
  };
});

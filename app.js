/* Contenido Barquero — interfaz */
(function () {
  'use strict';
  var L = window.BFLogic, ST = window.BFStore, DEMO = window.BFDemo;
  var CFG = window.BF_CONFIG || {};
  var store = ST.crearStore(CFG, function () { return DEMO.semilla(L.hoyISO()); });
  var $app = document.getElementById('app');

  var S = {
    data: null, hoy: L.hoyISO(), cargando: true, error: null,
    modal: null, flash: null, toast: null, lote: null, sucio: false, ocupado: false, firma: ''
  };

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function errU(msg) { var e = new Error(msg); e.usuario = true; return e; }
  function ruta() {
    var h = location.hash.replace(/^#/, '') || '/';
    var i = h.indexOf('?');
    var path = i >= 0 ? h.slice(0, i) : h;
    return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(i >= 0 ? h.slice(i + 1) : '') };
  }
  function base() { return location.href.split('#')[0]; }
  function ajustes() { return (S.data && S.data.ajustes) || L.AJUSTES_BASE; }
  function piezas() { return (S.data && S.data.piezas) || []; }
  function eventos() { return (S.data && S.data.eventos) || []; }
  function grabaciones() { return (S.data && S.data.grabaciones) || []; }
  function grabEventos() { return (S.data && S.data.grabacion_eventos) || []; }
  function grabacion(id) { return grabaciones().filter(function (g) { return g.id === id; })[0] || null; }
  function grabSemana() { return L.grabacionDeSemana(grabaciones(), S.hoy); }
  function grabNecesitaMe() {
    var g = grabSemana(), y = yo();
    if (!g || !y) return false;
    var e = L.estadoGrabacion(g, S.data.equipo);
    return e.pasada || (e.abierta && (g.confirmaciones || []).indexOf(y.user_id) < 0);
  }
  function pieza(id) { return piezas().filter(function (p) { return p.id === id; })[0] || null; }
  function yo() {
    var s = store.sesion(); if (!s || !S.data) return null;
    return S.data.equipo.filter(function (e) { return e.user_id === s.user.id; })[0] || null;
  }
  function rol() { var y = yo(); return y ? y.rol : null; }
  function persona(id) { return (S.data && S.data.equipo.filter(function (e) { return e.user_id === id; })[0]) || null; }
  function nombreDe(id) { var p = persona(id); return p ? p.nombre : 'Alguien'; }
  function contraparte(rolDestino) { return (S.data && S.data.equipo.filter(function (e) { return e.rol === rolDestino; })[0]) || null; }
  function fmtFechaHora(ts) {
    var d = new Date(ts);
    return L.fmtFecha(L.hoyISO(d)) + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function desdeSugerencia() { return L.addDias(S.hoy, 1); }

  var ICON = {
    pend: '<svg viewBox="0 0 24 24"><path d="M4 13h4l2 3h4l2-3h4"/><path d="M5.5 5h13L20 13v6H4v-6z"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    piezas: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/></svg>',
    met: '<svg viewBox="0 0 24 24"><path d="M5 20v-7M10.5 20V5M16 20v-10M3 20h18"/></svg>',
    mas: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/></svg>',
    reel: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M10.5 9.5v5l4-2.5z"/></svg>',
    carrusel: '<svg viewBox="0 0 24 24"><rect x="7" y="5" width="11" height="14" rx="2"/><path d="M4 7v10M21 7v10"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.3 18.4z"/><path d="M9 9.5c.3 2.3 2.2 4.4 4.6 5l1-1.1 1.8.8-.4 1.6c-3.7.2-7.3-3.2-7.4-7l1.6-.5.8 1.8z"/></svg>'
  };

  // ---------- Carga de datos ----------
  function recargar(silencioso, sinPintar) {
    if (!store.sesion()) { S.cargando = false; render(); return Promise.resolve(); }
    if (!silencioso) S.cargando = true;
    return store.cargarTodo().then(function (d) {
      var firma = JSON.stringify(d).length + '|' + (d.eventos.length) + '|' + d.piezas.map(function (p) { return p.actualizado_en; }).join(',') + '|' + (d.grabaciones || []).map(function (g) { return g.actualizado_en; }).join(',');
      var cambio = firma !== S.firma;
      S.firma = firma;
      S.data = d; S.hoy = L.hoyISO(); S.cargando = false; S.error = null;
      if (asegurarGrabacion()) return;
      if (!sinPintar && (!silencioso || cambio)) render();
    }, function (e) {
      S.cargando = false;
      if (e && e.sesion) { S.data = null; render(); return; }
      if (!S.data) S.error = e.message || String(e);
      else aviso(e.message || String(e));
      render();
    });
  }

  // Cada semana la app propone sola el día y la hora por defecto (nadie tiene que acordarse de escribir).
  function asegurarGrabacion() {
    if (!S.data || !yo() || grabSemana()) return false;
    var def = L.grabacionPorDefecto(ajustes(), new Date());
    if (S.intentoGrab === def.semana) return false;
    S.intentoGrab = def.semana;
    def.id = ST.uuid();
    store.insertar('grabaciones', def).then(function (g) {
      return store.insertar('grabacion_eventos', { grabacion_id: g.id, tipo: 'auto', texto: null, datos: { fecha: g.fecha, hora: g.hora } });
    }).catch(function () { /* la otra persona la creó al mismo tiempo: basta con recargar */ }).then(function () { recargar(true); });
    return true;
  }
  function ejecutarG(g, r) {
    return store.actualizar('grabaciones', g.id, r.patch, r.match).then(function (fila) {
      if (!fila) throw errU('La grabación cambió mientras la veías (la otra persona la movió). Ya actualicé los datos: revisa y vuelve a intentar.');
      var sec = Promise.resolve();
      (r.eventos || []).forEach(function (ev) { sec = sec.then(function () { return store.insertar('grabacion_eventos', Object.assign({ grabacion_id: g.id }, ev)); }); });
      return sec.then(function () { return fila; });
    });
  }

  function aviso(texto, tipo) {
    S.toast = { texto: texto, tipo: tipo || 'error', t: Date.now() };
    pintarCapas();
    var t = S.toast.t;
    setTimeout(function () { if (S.toast && S.toast.t === t) { S.toast = null; pintarCapas(); } }, 6000);
  }

  // Ejecuta una acción de logic.js contra la base de datos
  function ejecutar(p, r) {
    var cadena = Promise.resolve(p);
    if (r.patch && Object.keys(r.patch).length) {
      cadena = store.actualizar('piezas', p.id, r.patch, r.match).then(function (fila) {
        if (!fila) throw errU('Esta pieza cambió mientras la veías (quizás la otra persona la movió). Ya actualicé los datos: revisa y vuelve a intentar.');
        return fila;
      });
    }
    return cadena.then(function (fila) {
      var evs = r.eventos || [];
      var sec = Promise.resolve();
      evs.forEach(function (ev) {
        sec = sec.then(function () { return store.insertar('eventos', Object.assign({ pieza_id: p.id }, ev)); });
      });
      return sec.then(function () { return fila; });
    });
  }

  // ---------- Pintado ----------
  function render() {
    var sesion = store.sesion();
    var html;
    if (!sesion) html = vistaLogin();
    else if (S.cargando && !S.data) html = '<div class="centro"><div class="spinner"></div><p class="muted">Cargando…</p></div>';
    else if (S.error && !S.data) html = '<div class="centro"><p><b>No se pudieron cargar los datos.</b></p><p class="muted">' + esc(S.error) + '</p><button class="btn" data-act="reintentar">Reintentar</button> <button class="btn sec" data-act="salir">Salir</button></div>';
    else if (!yo()) html = marco('<h1>¡Hola! Antes de empezar</h1><p class="muted">Dinos quién eres para repartir bien las tareas.</p>' + formPerfil(null), true);
    else html = marco(vistaRuta());
    $app.innerHTML = html + '<div id="capas"></div>';
    pintarCapas();
    despuesDePintar();
  }
  function pintarCapas() {
    var c = document.getElementById('capas');
    if (!c) return;
    c.innerHTML = modalHtml() + flashHtml() + toastHtml();
    if (S.modal) despuesDePintar(c);
  }

  function vistaRuta() {
    var r = ruta();
    switch (r.parts[0]) {
      case undefined: return vistaPendientes();
      case 'revisar': return vistaLote();
      case 'p': return vistaPieza(r.parts[1]);
      case 'grabacion': return vistaGrabacion(r.parts[1]);
      case 'nueva': return vistaNueva(r.q);
      case 'piezas': return vistaPiezas(r.q);
      case 'calendario': return vistaCalendario(r.q);
      case 'metricas': return vistaMetricas(r.q);
      case 'ajustes': return vistaAjustes();
      default: return '<p>Página no encontrada. <a href="#/">Ir a pendientes</a></p>';
    }
  }

  function marco(contenido, sinNav) {
    var r = ruta(), sec = r.parts[0] || '';
    var demo = store.modo === 'demo';
    var ses = store.sesion();
    var pend = (!sinNav && rol()) ? L.pendientes(piezas(), eventos(), rol(), S.hoy, ajustes()).total + (grabNecesitaMe() ? 1 : 0) : 0;
    var tab = function (href, clave, icono, texto, badge) {
      var activo = sec === clave || (clave === '' && sec === 'revisar');
      return '<a href="' + href + '" class="tab' + (activo ? ' activo' : '') + '"' + (activo ? ' aria-current="page"' : '') + '>' + icono + '<span>' + texto + '</span>' +
        (badge ? '<b class="badge">' + badge + '</b>' : '') + '</a>';
    };
    return '<header class="top">' +
      '<a href="#/" class="marca"><span class="logo">B</span><span class="marca-txt">Contenido<small>Barquero</small></span></a>' +
      (demo ? '<div class="demo-rol" role="group" aria-label="Ver como">' + S.data.equipo.map(function (e) {
        return '<button type="button" data-act="demo-rol" data-id="' + esc(e.user_id) + '" aria-pressed="' + (ses && ses.user.id === e.user_id) + '">' + esc(e.nombre) + '</button>';
      }).join('') + '</div>' : '<span class="quien">' + esc((yo() || {}).nombre || '') + '</span>') +
      (sinNav ? '' : '<a href="#/ajustes" class="icono-btn" aria-label="Ajustes">' + ICON.ajustes + '</a>') +
      '</header>' +
      (demo ? '<div class="franja-demo">Modo demo · los cambios se guardan solo en este dispositivo. <a href="#/ajustes">Cómo activarla</a></div>' : '') +
      '<main class="contenido">' + contenido + '</main>' +
      (sinNav ? '' :
        '<nav class="tabs">' +
        tab('#/', '', ICON.pend, 'Pendientes', pend) +
        tab('#/calendario', 'calendario', ICON.cal, 'Calendario') +
        '<a href="#/nueva" class="tab tab-nueva' + (sec === 'nueva' ? ' activo' : '') + '" aria-label="Nueva pieza o idea"><span class="mas-ic">' + ICON.mas + '</span><span>Nueva</span></a>' +
        tab('#/piezas', 'piezas', ICON.piezas, 'Piezas') +
        tab('#/metricas', 'metricas', ICON.met, 'Métricas') +
        '</nav>');
  }

  // ---------- Piezas: fragmentos ----------
  function badgesPlat(p) {
    return L.plataformasDe(p).map(function (pl) {
      var pub = L.publicadoEn(p, pl);
      return '<span class="plat ' + pl + (pub ? ' pub' : '') + '" title="' + L.PLATAFORMAS[pl] + (pub ? ' · publicado' : '') + '">' + L.PLAT_CORTO[pl] + (pub ? ' ✓' : '') + '</span>';
    }).join('');
  }
  function pill(p) { var e = L.estadoDe(p, S.hoy); return '<span class="pill ' + e.tono + '">' + esc(e.texto) + '</span>'; }
  function tipoIcono(p) { return '<span class="tipo-ic" title="' + L.TIPOS[p.tipo] + '">' + ICON[p.tipo] + '</span>'; }
  function itemPieza(p, extra, href) {
    var texto = [p.titulo, p.producto, L.estadoDe(p, S.hoy).texto].join(' ').toLowerCase();
    return '<a class="item" href="' + (href || '#/p/' + p.id) + '" data-buscar="' + esc(texto) + '">' +
      tipoIcono(p) +
      '<span class="item-cuerpo"><span class="item-titulo">' + esc(p.titulo) + '</span>' +
      '<span class="item-meta">' + badgesPlat(p) + pill(p) + (extra ? '<span class="extra">' + extra + '</span>' : '') + '</span></span>' +
      '<span class="flecha" aria-hidden="true">›</span></a>';
  }
  function resumenCorreccion(ev) {
    if (!ev) return '';
    var d = ev.datos || {};
    var partes = (d.chips || []).slice();
    (d.puntos || []).forEach(function (x) { partes.push((x.ubicacion ? x.ubicacion + ': ' : '') + (x.texto || '')); });
    if (ev.texto) partes.push(ev.texto);
    return esc(partes.join(' · '));
  }

  // ---------- Vista: Pendientes ----------
  function seccion(titulo, contenido, opciones) {
    opciones = opciones || {};
    return '<section class="bloque' + (opciones.clase ? ' ' + opciones.clase : '') + '"><div class="bloque-head"><h2>' + titulo + '</h2>' +
      (opciones.accion || '') + '</div>' + contenido + '</section>';
  }
  function listaHuecos(hs, max) {
    if (!hs.length) return '<p class="vacio-ok">Semana cubierta ✅</p>';
    var mostrar = hs.slice(0, max || 6);
    return '<div class="lista">' + mostrar.map(function (h) {
      return '<div class="item hueco-item"><span class="hueco-dot"></span><span class="item-cuerpo"><span class="item-titulo">' + esc(L.fmtFecha(h.fecha)) + ' · ' + L.PLATAFORMAS[h.plataforma] + '</span>' +
        '<span class="item-meta"><span class="muted">' + L.TIPOS[h.tipo] + ' sin pieza</span></span></span>' +
        '<button class="btn chico" data-act="hueco" data-fecha="' + h.fecha + '" data-plat="' + h.plataforma + '" data-tipo="' + h.tipo + '">Llenar</button></div>';
    }).join('') + '</div>' + (hs.length > mostrar.length ? '<a class="ver-mas" href="#/calendario">Ver ' + (hs.length - mostrar.length) + ' más en el calendario ›</a>' : '');
  }
  function listaEsperas() {
    var g = L.esperasPorProducto(piezas());
    if (!g.length) return '';
    return seccion('En espera de mercancía', '<div class="lista">' + g.map(function (x) {
      return '<div class="item"><span class="espera-ic">📦</span><span class="item-cuerpo"><span class="item-titulo">' + esc(x.producto) + '</span>' +
        '<span class="item-meta"><span class="muted">' + plural(x.piezas.length, 'pieza', 'piezas') + (x.desde ? ' · desde ' + L.fmtFecha(x.desde) : '') + '</span></span>' +
        '<span class="sub-lista">' + x.piezas.map(function (p) { return '<a href="#/p/' + p.id + '">' + esc(p.titulo) + '</a>'; }).join('') + '</span></span>' +
        '<button class="btn chico ok" data-act="llego-producto" data-producto="' + esc(x.producto) + '">Llegó</button></div>';
    }).join('') + '</div>');
  }

  function vistaPendientes() {
    var r = L.pendientes(piezas(), eventos(), rol(), S.hoy, ajustes());
    var html = '<h1 class="saludo">' + saludo() + ', ' + esc(yo().nombre) + '</h1><p class="fecha-hoy">' + L.fmtFechaLarga(S.hoy) + ' · ' + L.TIPO_DIA[L.diaCfg(ajustes(), S.hoy).tipo] + '</p>';
    html += tarjetaGrabacion(grabSemana(), true);
    if (rol() === 'aprueba') {
      if (r.revisar.length) {
        html += '<section class="hero"><div><p class="hero-n">' + r.revisar.length + '</p><p class="hero-t">' + (r.revisar.length === 1 ? 'pieza espera tu aprobación' : 'piezas esperan tu aprobación') + '</p></div>' +
          '<a class="btn grande" href="#/revisar">Revisar todo</a></section>' +
          '<div class="lista">' + r.revisar.map(function (p) {
            var env = L.ultimoEnvio(eventos(), p);
            return itemPieza(p, env ? L.haceCuanto(env.creado_en) : '');
          }).join('') + '</div>';
      } else {
        html += '<section class="hero tranquilo"><p class="hero-t">Nada por aprobar ✨</p><p class="muted">Cuando tu editora envíe algo, aparece aquí.</p></section>';
      }
      if (r.atrasadas.length) html += seccion('Atrasadas', '<div class="lista">' + r.atrasadas.map(function (x) { return itemPieza(x.pieza, L.PLAT_CORTO[x.plataforma] + ' · era ' + L.fmtFecha(x.fecha)); }).join('') + '</div>', { clase: 'alerta' });
      html += seccion('Huecos en los próximos 7 días', listaHuecos(r.huecos, 4));
      if (r.hoy.length) html += seccion('Hoy se publica', '<div class="lista">' + r.hoy.map(function (x) { return itemPieza(x.pieza, L.PLATAFORMAS[x.plataforma]); }).join('') + '</div>');
      var enCurso = r.corregir.length + r.editar.length;
      if (enCurso) html += '<p class="nota-suave">En manos de edición: ' + plural(enCurso, 'pieza', 'piezas') + ' (' + r.corregir.length + ' con correcciones).</p>';
      html += listaEsperas();
    } else {
      var hayAlgo = false;
      if (r.publicar.length) {
        hayAlgo = true;
        html += seccion('Publicar hoy', '<div class="lista">' + r.publicar.map(function (x) {
          return '<div class="item publicar-item' + (x.atrasada ? ' atrasada' : '') + '">' + tipoIcono(x.pieza) +
            '<a class="item-cuerpo" href="#/p/' + x.pieza.id + '"><span class="item-titulo">' + esc(x.pieza.titulo) + '</span>' +
            '<span class="item-meta"><span class="plat ' + x.plataforma + '">' + L.PLAT_CORTO[x.plataforma] + '</span>' + (x.atrasada ? '<span class="pill atrasada">Atrasada · ' + L.fmtFecha(x.fecha) + '</span>' : '') + '</span></a>' +
            '<button class="btn chico" data-act="publicar" data-id="' + x.pieza.id + '" data-plat="' + x.plataforma + '">Publicar</button></div>';
        }).join('') + '</div>', { clase: 'destacado' });
      }
      if (r.corregir.length) {
        hayAlgo = true;
        html += seccion('Correcciones por hacer', '<div class="lista">' + r.corregir.map(function (p) {
          return itemPieza(p, resumenCorreccion(L.ultimaCorreccion(eventos(), p)));
        }).join('') + '</div>');
      }
      if (r.editar.length) {
        hayAlgo = true;
        html += seccion('Por hacer', '<div class="lista">' + r.editar.map(function (p) { return itemPieza(p); }).join('') + '</div>');
      }
      if (r.vistas.length) {
        hayAlgo = true;
        html += seccion('Anotar vistas (7 días)', '<div class="lista">' + r.vistas.map(function (x) {
          return '<div class="item">' + tipoIcono(x.pieza) + '<a class="item-cuerpo" href="#/p/' + x.pieza.id + '"><span class="item-titulo">' + esc(x.pieza.titulo) + '</span><span class="item-meta"><span class="plat ' + x.plataforma + '">' + L.PLAT_CORTO[x.plataforma] + '</span></span></a>' +
            '<button class="btn chico sec" data-act="vistas" data-id="' + x.pieza.id + '">Anotar</button></div>';
        }).join('') + '</div>');
      }
      if (!hayAlgo) html += '<section class="hero tranquilo"><p class="hero-t">Todo al día ✨</p><p class="muted">Crea una pieza con el botón + cuando grabes algo nuevo.</p></section>';
      if (r.revisar.length) html += '<p class="nota-suave">Esperando aprobación de ' + esc((contraparte('aprueba') || {}).nombre || 'aprobación') + ': ' + plural(r.revisar.length, 'pieza', 'piezas') + '.</p>';
      html += seccion('Huecos en los próximos 7 días', listaHuecos(r.huecos, 4));
      html += listaEsperas();
    }
    return html;
  }
  function saludo() { var h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; }

  // ---------- Revisión (Sara) ----------
  function tarjetaRevision(p, enLote) {
    var env = L.ultimoEnvio(eventos(), p);
    var antes = L.ultimaCorreccion(eventos(), p);
    if (antes && antes.version !== p.version - 1) antes = null;
    var resueltas = (env && env.datos && env.datos.resueltas) || [];
    var html = '<section class="card revision">' +
      '<div class="rev-head"><span class="pill aprueba">' + L.nombreEtapa(p.etapa) + ' v' + p.version + '</span>' +
      (env ? '<span class="muted">' + esc(nombreDe(env.autor)) + ' · ' + L.haceCuanto(env.creado_en) + '</span>' : '') + '</div>' +
      '<h2 class="rev-titulo">' + (enLote ? '<a href="#/p/' + p.id + '">' + esc(p.titulo) + '</a>' : esc(p.titulo)) + '</h2>' +
      '<div class="item-meta">' + tipoIcono(p) + badgesPlat(p) + '</div>' +
      briefHtml(p, enLote) +
      (p.nota_version ? '<div class="nota"><b>Qué cambió:</b> ' + nl2br(p.nota_version) + '</div>' : '') +
      (antes ? '<div class="antes"><b>Lo que pediste en v' + antes.version + ':</b>' + listaCorreccion(antes, resueltas) + '</div>' : '');
    html += '<form data-form="aprobar" data-id="' + p.id + '">' + contenidoRevision(p, env) +
      '<div class="acciones">' +
      '<button class="btn ok" type="submit">✅ Aprobar</button>' +
      '<button class="btn warn" type="button" data-act="abrir-corregir">✏️ Corregir</button>' +
      (enLote ? '<button class="btn fantasma" type="button" data-act="saltar">Saltar</button>' : '') +
      '</div></form>' + formCorregir(p) + '</section>';
    return html;
  }
  function briefHtml(p, cerrado) {
    var filas = [['Producto', p.producto], ['Gancho', p.gancho], ['Objetivo', p.objetivo]].filter(function (x) { return x[1]; });
    if (!filas.length) return '';
    return '<details class="brief"' + (cerrado ? '' : ' open') + '><summary>Brief</summary><dl>' +
      filas.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></details>';
  }
  function listaCorreccion(ev, resueltas) {
    var d = ev.datos || {};
    var items = [];
    (d.chips || []).forEach(function (c) { items.push(esc(c)); });
    (d.puntos || []).forEach(function (x) { items.push((x.ubicacion ? '<b>' + esc(x.ubicacion) + '</b> ' : '') + esc(x.texto || '')); });
    if (ev.texto) items.push(nl2br(ev.texto));
    return '<ul class="lista-corr">' + items.map(function (t, i) {
      var hecho = resueltas && resueltas.indexOf(i) >= 0;
      return '<li' + (hecho ? ' class="hecho"' : '') + '>' + (hecho ? '✓ ' : '') + t + '</li>';
    }).join('') + '</ul>';
  }
  function archivoAviso(p) {
    var cosa = p.etapa === 'diseno' ? 'El diseño' : 'El video';
    return '<div class="archivo">📱 ' + cosa + ' llegó por WhatsApp.' +
      (p.enlace_version ? ' <a href="' + esc(p.enlace_version) + '" target="_blank" rel="noopener">Abrir enlace</a>' : '') + '</div>';
  }
  function contenidoRevision(p, env) {
    if (p.etapa === 'video' || p.etapa === 'diseno') return archivoAviso(p);
    if (p.etapa === 'texto') {
      return '<label class="campo">Texto del carrusel <small>Puedes arreglar algo pequeño aquí mismo antes de aprobar.</small>' +
        '<textarea name="texto_carrusel" rows="8">' + esc(p.texto_carrusel) + '</textarea></label>';
    }
    if (p.etapa === 'copy') {
      var banco = !!(env && env.datos && env.datos.banco);
      return camposCopy(p, 'Puedes arreglar algo pequeño aquí mismo antes de aprobar.') +
        bloqueFechas(p, { fecha_ig: p.fecha_ig, fecha_tt: p.fecha_tt, primero: p.primero }, banco);
    }
    return '';
  }
  function camposCopy(p, ayuda) {
    return L.plataformasDe(p).map(function (pl) {
      return '<label class="campo">Copy de ' + L.PLATAFORMAS[pl] + (ayuda ? ' <small>' + ayuda + '</small>' : '') +
        '<textarea name="copy_' + pl + '" rows="5">' + esc(p['copy_' + pl]) + '</textarea></label>';
    }).join('');
  }
  function bloqueFechas(p, vals, banco) {
    var plats = L.plataformasDe(p);
    var ambas = L.pendientesDePublicar(p).length === 2;
    var html = '<fieldset class="fechas" data-pieza="' + p.id + '"><legend>Fechas de publicación</legend>';
    if (ambas) {
      html += '<div class="seg" role="radiogroup" aria-label="Qué va primero"><span>Primero:</span>' + ['ig', 'tt'].map(function (pl) {
        return '<label><input type="radio" name="primero" value="' + pl + '"' + (vals.primero === pl ? ' checked' : '') + ' data-primero> ' + L.PLATAFORMAS[pl] + '</label>';
      }).join('') + '</div>';
    }
    html += '<div class="fechas-fila">' + plats.map(function (pl) {
      var pub = L.publicadoEn(p, pl);
      return '<label class="fecha">' + L.PLATAFORMAS[pl] + (pub ? ' <small>publicado ' + L.fmtFecha(String(pub).slice(0, 10)) + '</small>' : '') +
        '<input type="date" name="fecha_' + pl + '" value="' + esc(vals['fecha_' + pl] || '') + '" data-fechas' + (pub ? ' disabled' : '') + '><small class="dia-txt" data-dia="' + pl + '"></small></label>';
    }).join('') + '</div>' +
      '<div class="fechas-acc"><button type="button" class="btn link" data-act="sugerir">↻ Sugerir fechas</button>' +
      '<label class="check"><input type="checkbox" name="banco" data-banco' + (banco ? ' checked' : '') + '> Sin fecha: guardar en el banco</label></div>' +
      '<ul class="avisos" data-avisos></ul>' +
      '<p class="ayuda">Mínimo ' + L.minimo(ajustes()) + ' días entre IG y TikTok, en días de ' + L.TIPOS[p.tipo].toLowerCase() + ' del cronograma.</p></fieldset>';
    return html;
  }
  function formCorregir(p, abierto) {
    var ub = L.UBICACION[p.etapa];
    return '<form data-form="corregir" data-id="' + p.id + '" class="panel-corregir"' + (abierto ? '' : ' hidden') + '>' +
      '<p class="label">¿Qué hay que cambiar?</p>' +
      '<div class="chips">' + (L.CHIPS[p.etapa] || []).map(function (c) {
        return '<button type="button" class="chip" data-act="chip" aria-pressed="false" data-valor="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('') + '</div>' +
      '<p class="label">Puntos concretos <small>(opcional)</small></p>' +
      '<div class="puntos" data-puntos>' + puntoHtml(ub) + '</div>' +
      '<button type="button" class="btn link" data-act="agregar-punto" data-ub="' + esc(ub || '') + '">+ Otro punto</button>' +
      '<label class="campo">Comentario general <small>(opcional)</small><textarea name="comentario" rows="2"></textarea></label>' +
      '<div class="acciones"><button class="btn warn" type="submit">Enviar corrección</button><button class="btn fantasma" type="button" data-act="cerrar-corregir">Cancelar</button></div>' +
      '</form>';
  }
  function puntoHtml(ub) {
    return '<div class="punto">' + (ub ? '<input name="ubicacion" class="ubic" placeholder="' + esc(ub) + '" autocomplete="off">' : '') +
      '<input name="punto" placeholder="Qué cambiar" autocomplete="off"><button type="button" class="quitar" data-act="quitar-punto" aria-label="Quitar punto">×</button></div>';
  }

  function vistaLote() {
    if (rol() !== 'aprueba') return '<p>La revisión en lote es para quien aprueba. <a href="#/">Volver</a></p>';
    if (!S.lote) iniciarLote();
    var lote = S.lote;
    // saltar las que ya no esperan aprobación
    while (lote.i < lote.ids.length) {
      var q = pieza(lote.ids[lote.i]);
      if (q && q.fase === 'produccion' && q.turno === 'aprueba' && !q.en_espera) break;
      lote.i++;
    }
    var total = lote.ids.length;
    if (lote.i >= total) {
      var hechos = lote.hechos.filter(function (x) { return x.accion !== 'saltada'; });
      var ed = contraparte('edita');
      var html = '<section class="card fin-lote"><h1>Listo ✨</h1>';
      if (!hechos.length) {
        html += '<p class="muted">' + (total ? 'No aprobaste ni corregiste nada esta vez.' : 'No hay nada por revisar.') + '</p>';
      } else {
        var ap = hechos.filter(function (x) { return x.accion === 'aprobada'; }).length;
        html += '<p class="resumen-lote"><span>✅ ' + plural(ap, 'aprobada', 'aprobadas') + '</span><span>✏️ ' + plural(hechos.length - ap, 'con correcciones', 'con correcciones') + '</span></p>' +
          '<ul class="lista-simple">' + hechos.map(function (x) { return '<li>' + (x.accion === 'aprobada' ? '✅ ' : '✏️ ') + esc(x.titulo) + ' <span class="muted">· ' + L.nombreEtapa(x.etapa) + '</span></li>'; }).join('') + '</ul>' +
          '<a class="btn wa grande" target="_blank" rel="noopener" href="' + esc(L.waLink(ed && ed.telefono, L.msgResumenLote(hechos, base()))) + '">' + ICON.wa + ' Avisar a ' + esc(ed ? ed.nombre : 'edición') + ' por WhatsApp</a>';
      }
      var saltadas = lote.hechos.filter(function (x) { return x.accion === 'saltada'; }).length;
      if (saltadas) html += '<p class="muted">Saltaste ' + plural(saltadas, 'pieza', 'piezas') + '; siguen en tus pendientes.</p>';
      return html + '<a class="btn sec" href="#/" data-act="terminar-lote">Volver a pendientes</a></section>';
    }
    var p = pieza(lote.ids[lote.i]);
    var pct = Math.round(lote.i / total * 100);
    return '<div class="lote-head"><a href="#/" class="volver" data-act="terminar-lote">‹ Salir</a><span>' + (lote.i + 1) + ' de ' + total + '</span></div>' +
      '<div class="progreso"><span style="width:' + pct + '%"></span></div>' + tarjetaRevision(p, true);
  }
  function iniciarLote() {
    var r = L.pendientes(piezas(), eventos(), 'aprueba', S.hoy, ajustes());
    S.lote = { ids: r.revisar.map(function (p) { return p.id; }), i: 0, hechos: [] };
  }

  // ---------- Grabación semanal ----------
  function cuandoG(g) { return L.fmtFechaLarga(g.fecha) + ' · ' + L.fmtHora(g.hora); }
  function tarjetaGrabacion(g, resumen) {
    if (!g) return '';
    var e = L.estadoGrabacion(g, S.data.equipo);
    var y = yo();
    var yoConfirme = (g.confirmaciones || []).indexOf(y.user_id) >= 0;
    var titulos = piezas().filter(function (p) { return p.grabacion_id === g.id && p.fase !== 'archivada'; });
    var clase = 'card grabacion' + (e.urgente || e.pasada ? ' urgente' : '') + (g.estado === 'hecha' ? ' hecha' : '') + (g.estado === 'cancelada' ? ' cancelada' : '');
    var html = '<section class="' + clase + '"><div class="bloque-head"><h2>🎬 Grabación de la semana</h2>' +
      (resumen ? '<a class="btn link" href="#/grabacion/' + g.id + '">Ver detalle</a>' : '') + '</div>' +
      '<p class="grab-cuando">' + esc(cuandoG(g)) + '</p>';
    if (g.estado === 'hecha') return html + '<p class="vacio-ok">✅ Grabado</p>' + (resumen ? '' : '<button class="btn link" data-act="reabrir-grab" data-id="' + g.id + '">Reabrir</button>') + '</section>';
    if (g.estado === 'cancelada') return html + '<p class="rojo">No se grabó' + (g.nota ? ': ' + esc(g.nota) : '') + '</p>' + (resumen ? '' : '<button class="btn link" data-act="reabrir-grab" data-id="' + g.id + '">Reabrir</button>') + '</section>';
    html += '<p class="grab-conf">' + S.data.equipo.map(function (m) {
      var ok = (g.confirmaciones || []).indexOf(m.user_id) >= 0;
      return '<span class="' + (ok ? 'ok' : 'falta') + '">' + (ok ? '✓ ' : '⏳ ') + esc(m.nombre) + '</span>';
    }).join('') + '</p>';
    if (e.pasada) {
      html += '<p><b>¿Se grabó?</b></p><div class="acciones"><button class="btn ok" data-act="hecha-grab" data-id="' + g.id + '">Sí, grabamos</button><button class="btn sec" data-act="no-grabo" data-id="' + g.id + '">No se grabó</button></div>';
    } else {
      if (e.completa) html += '<p class="vacio-ok">Confirmada por las dos ✅</p>';
      else if (e.urgente) html += '<p class="rojo"><b>Falta confirmar y es en menos de 24 h.</b></p>';
      html += '<div class="acciones">' +
        (yoConfirme ? '' : '<button class="btn ok" data-act="confirmar-grab" data-id="' + g.id + '">Confirmar</button>') +
        '<button class="btn sec" data-act="reagendar" data-id="' + g.id + '">Proponer otro día</button>' +
        (yoConfirme && !e.completa ? recordarGrab(g, 'confirme') : '') + '</div>';
    }
    if (resumen) html += '<p class="ayuda"><a href="#/grabacion/' + g.id + '">' + (titulos.length ? plural(titulos.length, 'video planeado', 'videos planeados') : 'Aún no hay videos planeados') + ' ›</a></p>';
    return html + '</section>';
  }
  function otraPersona() {
    var y = yo();
    return (S.data.equipo.filter(function (m) { return m.user_id !== y.user_id; })[0]) || null;
  }
  function recordarGrab(g, tipo) {
    var o = otraPersona();
    return '<a class="btn wa" target="_blank" rel="noopener" href="' + esc(L.waLink(o && o.telefono, L.msgGrabacion(g, tipo, base(), o && o.nombre))) + '">' + ICON.wa + ' Avisar a ' + esc(o ? o.nombre : 'la otra') + '</a>';
  }
  function vistaGrabacion(id) {
    var g = id ? grabacion(id) : grabSemana();
    if (!g) return '<p>No encontré esa grabación. <a href="#/">Volver</a></p>';
    var html = '<a href="#/" class="volver" data-act="volver">‹ Volver</a>' + tarjetaGrabacion(g, false);
    // Qué grabar
    var planeados = piezas().filter(function (p) { return p.grabacion_id === g.id && p.fase !== 'archivada'; });
    var ideas = piezas().filter(function (p) { return p.fase === 'idea' && !p.grabacion_id; });
    html += '<section class="card"><h2>Qué vamos a grabar</h2>' +
      (planeados.length ? '<div class="lista">' + planeados.map(function (p) {
        var listo = p.fase !== 'idea';
        return '<div class="item">' + tipoIcono(p) + '<a class="item-cuerpo" href="#/p/' + p.id + '"><span class="item-titulo">' + esc(p.titulo) + '</span><span class="item-meta">' + (listo ? '<span class="pill ok">Grabado</span>' : '<span class="pill gris">Por grabar</span>') + (p.producto ? '<span class="extra">' + esc(p.producto) + '</span>' : '') + '</span></a>' +
          (listo ? '' : '<button class="btn chico ok" data-act="grabado" data-id="' + p.id + '">Grabado ✓</button>') + '</div>';
      }).join('') + '</div>' : '<p class="muted">Todavía no hay videos planeados para esta sesión.</p>') +
      (g.estado === 'cancelada' ? '' : '<form data-form="titulo-grab" data-id="' + g.id + '" class="agregar-titulo"><input name="titulo" placeholder="Título del video" autocomplete="off" required>' +
        '<select name="tipo" aria-label="Tipo"><option value="reel">Reel</option><option value="carrusel">Carrusel</option></select><button class="btn chico" type="submit">Agregar</button></form>') +
      '</section>';
    if (ideas.length && g.estado !== 'cancelada') {
      html += '<section class="card"><h2>Ideas del banco</h2><p class="ayuda">Súmalas a esta sesión para no llegar a grabar sin plan.</p><div class="lista">' + ideas.map(function (p) {
        return '<div class="item">' + tipoIcono(p) + '<span class="item-cuerpo"><span class="item-titulo">' + esc(p.titulo) + '</span>' + (p.producto ? '<span class="item-meta"><span class="extra">' + esc(p.producto) + '</span></span>' : '') + '</span>' +
          '<button class="btn chico sec" data-act="agregar-a-grab" data-id="' + p.id + '" data-grab="' + g.id + '">+ Agregar</button></div>';
      }).join('') + '</div></section>';
    }
    // Racha
    var r = L.racha(grabaciones(), S.hoy, 6);
    html += '<section class="card"><h2>Últimas semanas</h2><div class="racha">' + r.map(function (x) {
      var ic = x.estado === 'hecha' ? '✅' : x.estado === 'cancelada' ? '❌' : '·';
      return '<span title="Semana del ' + L.fmtFecha(x.semana) + '"><b>' + ic + '</b><small>' + (+x.semana.slice(8)) + '/' + (+x.semana.slice(5, 7)) + '</small></span>';
    }).join('') + '</div></section>';
    // Historial
    var evs = grabEventos().filter(function (e) { return e.grabacion_id === g.id; }).slice().reverse();
    html += '<section class="card historial"><h2>Historial</h2><ol class="timeline">' + evs.map(function (e) {
      var d = e.datos || {}, q = '<b>' + esc(nombreDe(e.autor)) + '</b>', ic = '•', t = '', extra = '';
      switch (e.tipo) {
        case 'auto': ic = '🗓️'; t = 'La app propuso ' + esc(L.fmtFechaLarga(d.fecha) + ' · ' + L.fmtHora(d.hora)); break;
        case 'confirmacion': ic = '✓'; t = q + ' confirmó ' + esc(L.fmtFecha(d.fecha) + ', ' + L.fmtHora(d.hora)); break;
        case 'reagenda': ic = '🔁'; t = q + ' reagendó: ' + esc(L.fmtFecha(d.antes.fecha) + ' ' + L.fmtHora(d.antes.hora)) + ' → <b>' + esc(L.fmtFecha(d.despues.fecha) + ' ' + L.fmtHora(d.despues.hora)) + '</b>'; if (e.texto) extra = '<p>' + nl2br(e.texto) + '</p>'; break;
        case 'hecha': ic = '✅'; t = q + ' marcó que se grabó'; break;
        case 'cancelada': ic = '❌'; t = q + ' marcó que no se grabó'; if (e.texto) extra = '<p>' + nl2br(e.texto) + '</p>'; break;
        case 'reabierta': ic = '↩️'; t = q + ' la reabrió'; break;
      }
      return '<li class="ev ev-' + e.tipo + '"><span class="ev-ic" aria-hidden="true">' + ic + '</span><div class="ev-cuerpo"><p class="ev-txt">' + t + '</p>' + extra + '<time>' + fmtFechaHora(e.creado_en) + ' · ' + L.haceCuanto(e.creado_en) + '</time></div></li>';
    }).join('') + '</ol></section>';
    return html;
  }

  // ---------- Vista: Pieza ----------
  function vistaPieza(id) {
    var p = pieza(id);
    if (!p) return '<p>No encontré esa pieza. <a href="#/piezas">Ver todas</a></p>';
    var miRol = rol();
    var rondas = L.rondasDe(eventos(), p.id);
    var txtRondas = Object.keys(rondas).map(function (k) { return L.nombreEtapa(k) + ' ' + rondas[k]; }).join(' · ');
    var html = '<a href="#/" class="volver" data-act="volver">‹ Volver</a>' +
      '<article class="pieza">' +
      '<div class="pieza-head"><div class="item-meta">' + tipoIcono(p) + '<span class="muted">' + L.TIPOS[p.tipo] + '</span>' + badgesPlat(p) + '</div>' +
      '<h1>' + esc(p.titulo) + '</h1>' + pill(p) +
      (txtRondas ? '<p class="rondas">Rondas de corrección: ' + esc(txtRondas) + '</p>' : '') + '</div>';

    // Acción principal
    if (p.en_espera) {
      html += '<section class="card aviso-espera"><p>📦 En espera de <b>' + esc(p.espera_producto) + '</b>' + (p.espera_desde ? ' desde ' + L.fmtFecha(p.espera_desde) : '') + '.</p>' +
        '<button class="btn ok" data-act="llego" data-id="' + p.id + '">Ya llegó</button></section>';
    }
    if (p.fase === 'idea') html += formIniciar(p);
    if (p.fase === 'produccion') {
      if (p.turno === 'aprueba') {
        html += miRol === 'aprueba' ? tarjetaRevision(p, false)
          : '<section class="card"><p>⏳ Esperando aprobación de ' + esc((contraparte('aprueba') || {}).nombre || 'aprobación') + ' (' + L.nombreEtapa(p.etapa) + ' v' + p.version + ').</p>' +
            '<a class="btn wa" target="_blank" rel="noopener" href="' + esc(waParaEnvio(p)) + '">' + ICON.wa + ' Recordar por WhatsApp</a></section>';
      } else if (miRol === 'aprueba') {
        var ed = contraparte('edita');
        html += '<section class="card"><p>✋ Le toca a ' + esc(ed ? ed.nombre : 'edición') + ': ' + esc(L.estadoDe(p, S.hoy).texto) + '.</p>' +
          '<details class="hacerlo-yo"><summary>Prefiero hacerlo yo</summary>' + formEnviar(p) + '</details></section>';
      } else {
        html += formEnviar(p);
      }
    }
    if (p.fase === 'aprobada' || p.fase === 'publicada') html += bloquePublicacion(p);

    html += '<section class="card"><div class="bloque-head"><h2>Brief</h2><button class="btn link" data-act="editar" data-id="' + p.id + '">Editar</button></div>' +
      ([['Producto', p.producto], ['Gancho', p.gancho], ['Objetivo', p.objetivo]].filter(function (x) { return x[1]; }).map(function (x) {
        return '<p><span class="muted">' + x[0] + ':</span> ' + esc(x[1]) + '</p>';
      }).join('') || '<p class="muted">Sin brief todavía.</p>') + '</section>';

    // Contenido aprobado/actual (si no se está mostrando ya en un formulario)
    var enForm = p.fase === 'produccion' && (p.etapa === 'copy' || p.etapa === 'texto');
    if (p.texto_carrusel && !(enForm && p.etapa === 'texto')) {
      html += '<section class="card"><div class="bloque-head"><h2>Texto del carrusel</h2><button class="btn link" data-act="copiar" data-id="' + p.id + '" data-campo="texto_carrusel">Copiar</button></div><div class="texto-largo">' + nl2br(p.texto_carrusel) + '</div></section>';
    }
    if (!(enForm && p.etapa === 'copy')) {
      L.plataformasDe(p).forEach(function (pl) {
        if (p['copy_' + pl]) html += '<section class="card"><div class="bloque-head"><h2>Copy de ' + L.PLATAFORMAS[pl] + '</h2><button class="btn link" data-act="copiar" data-id="' + p.id + '" data-campo="copy_' + pl + '">Copiar</button></div><div class="texto-largo">' + nl2br(p['copy_' + pl]) + '</div></section>';
      });
    }

    html += historialHtml(p);

    html += '<div class="mas-acciones">' +
      (!p.en_espera && p.fase !== 'publicada' && p.fase !== 'archivada' ? '<button class="btn sec" data-act="espera" data-id="' + p.id + '">📦 En espera de mercancía</button>' : '') +
      (p.fase === 'archivada' ? '<button class="btn sec" data-act="reabrir" data-id="' + p.id + '">Reabrir</button>' : '<button class="btn fantasma" data-act="archivar" data-id="' + p.id + '">Archivar</button>') +
      '</div></article>';
    return html;
  }
  function waParaEnvio(p) {
    var sara = contraparte('aprueba');
    return L.waLink(sara && sara.telefono, L.msgEnvio(p, base(), sara && sara.nombre));
  }

  function formIniciar(p) {
    return '<section class="card"><h2>💡 Idea</h2><p class="muted">Cuando la grabes (o empieces el carrusel), confirma los datos y empieza la producción.</p>' +
      '<form data-form="iniciar" data-id="' + p.id + '">' + camposBrief(p, true) +
      '<button class="btn" type="submit">Empezar producción</button></form></section>';
  }

  function formEnviar(p) {
    var corr = p.version > 0 ? L.ultimaCorreccion(eventos(), p) : null;
    var html = '<section class="card enviar"><h2>' + (corr ? '✏️ Corregir y reenviar' : '📤 ' + L.nombreEtapa(p.etapa) + ': cuando esté listo, envíalo') + '</h2>';
    if (corr) {
      html += '<div class="por-corregir"><p><b>' + esc(nombreDe(corr.autor)) + '</b> pidió (' + L.haceCuanto(corr.creado_en) + '):</p>' + checklistCorreccion(corr) + '</div>';
    }
    html += '<form data-form="enviar" data-id="' + p.id + '">';
    if (p.etapa === 'video' || p.etapa === 'diseno') {
      var cosa = p.etapa === 'video' ? 'el video' : 'el diseño';
      html += '<p class="ayuda">Manda ' + cosa + ' por WhatsApp como siempre; aquí queda el registro y la aprobación.</p>' +
        '<label class="campo">Enlace <small>(opcional: Drive, WeTransfer…)</small><input type="url" name="enlace" inputmode="url" placeholder="https://" value="' + esc(p.enlace_version || '') + '"></label>';
    }
    if (p.etapa === 'texto') {
      html += '<label class="campo">Texto del carrusel<textarea name="texto_carrusel" rows="9" placeholder="Slide 1: …&#10;Slide 2: …">' + esc(p.texto_carrusel || 'Slide 1: \nSlide 2: \nSlide 3: ') + '</textarea></label>';
    }
    if (p.etapa === 'copy') {
      var vals = (p.fecha_ig || p.fecha_tt) ? { fecha_ig: p.fecha_ig, fecha_tt: p.fecha_tt, primero: p.primero } : L.sugerirFechas(p, piezas(), ajustes(), desdeSugerencia(), null);
      html += camposCopy(p, '') + bloqueFechas(p, vals, false);
    }
    html += '<label class="campo">¿Qué cambió? <small>(opcional)</small><input name="nota" autocomplete="off" placeholder="' + (corr ? 'Ej. corregí la música y los subtítulos' : 'Ej. primer corte, 30 s') + '"></label>' +
      '<button class="btn" type="submit">Enviar a revisión</button></form></section>';
    return html;
  }
  function checklistCorreccion(ev) {
    var d = ev.datos || {};
    var items = [];
    (d.chips || []).forEach(function (c) { items.push(esc(c)); });
    (d.puntos || []).forEach(function (x) { items.push((x.ubicacion ? '<b>' + esc(x.ubicacion) + '</b> ' : '') + esc(x.texto || '')); });
    if (ev.texto) items.push(nl2br(ev.texto));
    return '<ul class="check-corr">' + items.map(function (t, i) {
      return '<li><label class="check"><input type="checkbox" data-resuelta value="' + i + '"> <span>' + t + '</span></label></li>';
    }).join('') + '</ul>';
  }

  function bloquePublicacion(p) {
    var html = '<section class="card"><div class="bloque-head"><h2>Publicación</h2>' +
      (p.fase === 'aprobada' && !p.en_espera ? '<button class="btn link" data-act="fechas" data-id="' + p.id + '">Cambiar fechas</button>' : '') + '</div>';
    html += '<div class="pub-filas">' + L.plataformasDe(p).map(function (pl) {
      var pub = L.publicadoEn(p, pl), f = L.fechaDe(p, pl);
      var linea = '<div class="pub-fila"><span class="plat ' + pl + (pub ? ' pub' : '') + '">' + L.PLAT_CORTO[pl] + '</span><span class="pub-info">';
      if (pub) {
        linea += 'Publicado ' + fmtFechaHora(pub) + (p['enlace_' + pl] ? ' · <a href="' + esc(p['enlace_' + pl]) + '" target="_blank" rel="noopener">ver post</a>' : '') +
          (p['vistas_' + pl] != null ? ' · <b>' + Number(p['vistas_' + pl]).toLocaleString('es') + '</b> vistas' : '');
      } else if (f) {
        linea += (f < S.hoy ? '<span class="rojo">Era ' + L.fmtFecha(f) + '</span>' : L.fmtFechaLarga(f));
      } else {
        linea += '<span class="muted">' + (p.en_espera ? 'En espera' : 'Sin fecha (banco)') + '</span>';
      }
      linea += '</span>';
      if (!pub && p.fase === 'aprobada' && !p.en_espera) linea += '<button class="btn chico" data-act="publicar" data-id="' + p.id + '" data-plat="' + pl + '">Publicar</button>';
      linea += '</div>';
      return linea;
    }).join('') + '</div>';
    if (L.plataformasDe(p).some(function (pl) { return L.publicadoEn(p, pl); })) {
      html += '<button class="btn sec chico" data-act="vistas" data-id="' + p.id + '">Anotar vistas</button>';
    }
    if (L.enBanco(p)) html += '<button class="btn chico" data-act="fechas" data-id="' + p.id + '">Programar</button>';
    return html + '</section>';
  }

  function historialHtml(p) {
    var evs = L.eventosDe(eventos(), p.id).slice().reverse();
    var html = '<section class="card historial"><h2>Historial y comentarios</h2>' +
      '<form data-form="comentario" data-id="' + p.id + '" class="comentar"><textarea name="texto" rows="2" placeholder="Escribe un comentario…"></textarea><button class="btn chico" type="submit">Comentar</button></form>';
    if (!evs.length) return html + '<p class="muted">Sin movimientos todavía.</p></section>';
    return html + '<ol class="timeline">' + evs.map(function (e) { return eventoHtml(e); }).join('') + '</ol></section>';
  }
  function eventoHtml(e) {
    var d = e.datos || {};
    var quien = '<b>' + esc(nombreDe(e.autor)) + '</b>';
    var et = e.etapa ? L.nombreEtapa(e.etapa) + (e.version ? ' v' + e.version : '') : '';
    var ic = '•', txt = '', extra = '';
    function fechasTxt(x) {
      var partes = [];
      if (x.fecha_ig) partes.push('IG ' + L.fmtFecha(x.fecha_ig));
      if (x.fecha_tt) partes.push('TikTok ' + L.fmtFecha(x.fecha_tt));
      return partes.join(' · ');
    }
    switch (e.tipo) {
      case 'creada': ic = '🆕'; txt = quien + ' creó la pieza'; break;
      case 'idea': ic = '💡'; txt = quien + ' anotó la idea'; break;
      case 'iniciada': ic = '▶️'; txt = quien + ' empezó la producción'; break;
      case 'editada': ic = '📝'; txt = quien + ' editó: ' + esc(e.texto || ''); break;
      case 'envio':
        ic = '📤'; txt = quien + ' envió ' + esc(et) + ' a revisión';
        if (e.texto) extra += '<p>' + nl2br(e.texto) + '</p>';
        if (d.enlace) extra += '<p><a href="' + esc(d.enlace) + '" target="_blank" rel="noopener">Enlace</a></p>';
        if (d.resueltas) extra += '<p class="muted">Marcó ' + plural(d.resueltas.length, 'corrección resuelta', 'correcciones resueltas') + '.</p>';
        if (d.texto_carrusel) extra += '<details><summary>Texto enviado</summary><div class="texto-largo">' + nl2br(d.texto_carrusel) + '</div></details>';
        if (d.copy_ig || d.copy_tt) extra += '<details><summary>Copy enviado</summary>' + (d.copy_ig ? '<p><b>IG:</b> ' + nl2br(d.copy_ig) + '</p>' : '') + (d.copy_tt ? '<p><b>TikTok:</b> ' + nl2br(d.copy_tt) + '</p>' : '') + '</details>';
        if (d.banco) extra += '<p class="muted">Propuso dejarla en el banco (sin fecha).</p>';
        else if (d.fecha_ig || d.fecha_tt) extra += '<p class="muted">Fechas propuestas: ' + fechasTxt(d) + '</p>';
        break;
      case 'aprobacion':
        ic = '✅'; txt = quien + ' aprobó ' + esc(et);
        if (e.texto) extra += '<p>' + nl2br(e.texto) + '</p>';
        if (d.ajustes) extra += '<p class="muted">Aprobó con pequeños ajustes en ' + Object.keys(d.ajustes).map(function (k) { return k === 'texto_carrusel' ? 'el texto' : 'el copy de ' + L.PLAT_CORTO[k.slice(5)]; }).join(' y ') + '.</p>';
        if (d.banco) extra += '<p class="muted">Quedó en el banco (sin fecha).</p>';
        else if (d.fecha_ig || d.fecha_tt) extra += '<p class="muted">Fechas: ' + fechasTxt(d) + '</p>';
        break;
      case 'correccion':
        ic = '✏️'; txt = quien + ' pidió correcciones en ' + esc(et);
        extra += listaCorreccion(e, null);
        break;
      case 'comentario': ic = '💬'; txt = quien; extra += '<p>' + nl2br(e.texto) + '</p>'; break;
      case 'espera':
        ic = '⏸️'; txt = quien + ' la puso en espera de <b>' + esc(e.texto) + '</b>';
        if (d.fechas_quitadas && fechasTxt(d.fechas_quitadas)) extra += '<p class="muted">Se quitaron las fechas: ' + fechasTxt(d.fechas_quitadas) + '</p>';
        break;
      case 'llego': ic = '📦'; txt = quien + ' marcó que llegó <b>' + esc(e.texto || 'la mercancía') + '</b>'; break;
      case 'fechas': ic = '📅'; txt = quien + (d.banco ? ' la movió al banco (sin fecha)' : ' programó: ' + fechasTxt(d)); break;
      case 'publicado':
        ic = '🚀'; txt = quien + ' publicó en ' + (L.PLATAFORMAS[d.plataforma] || '');
        if (d.enlace) extra += '<p><a href="' + esc(d.enlace) + '" target="_blank" rel="noopener">Ver post</a></p>';
        break;
      case 'vistas':
        ic = '👀'; txt = quien + ' anotó vistas: ' + ['ig', 'tt'].filter(function (k) { return d['vistas_' + k] != null; }).map(function (k) { return L.PLAT_CORTO[k] + ' ' + Number(d['vistas_' + k]).toLocaleString('es'); }).join(' · ');
        break;
      case 'archivada': ic = '🗄️'; txt = quien + ' la archivó'; break;
      case 'reabierta': ic = '↩️'; txt = quien + ' la reabrió'; break;
      default: txt = quien + ' · ' + esc(e.tipo);
    }
    return '<li class="ev ev-' + e.tipo + '"><span class="ev-ic" aria-hidden="true">' + ic + '</span><div class="ev-cuerpo"><p class="ev-txt">' + txt + '</p>' + extra +
      '<time datetime="' + esc(e.creado_en) + '">' + fmtFechaHora(e.creado_en) + ' · ' + L.haceCuanto(e.creado_en) + '</time></div></li>';
  }

  // ---------- Vista: Nueva ----------
  function camposBrief(p, idea) {
    p = p || {};
    var tipo = p.tipo || 'reel';
    return '<label class="campo">Título<input name="titulo" required autocomplete="off" value="' + esc(p.titulo || '') + '" placeholder="Ej. Queso manchego: cómo cortarlo"></label>' +
      '<div class="campo"><span class="label">Tipo</span><div class="seg grande">' + ['reel', 'carrusel'].map(function (t) {
        return '<label><input type="radio" name="tipo" value="' + t + '"' + (tipo === t ? ' checked' : '') + '> ' + L.TIPOS[t] + '</label>';
      }).join('') + '</div></div>' +
      '<div class="campo"><span class="label">Plataformas</span><div class="seg grande">' + ['ig', 'tt'].map(function (pl) {
        var marcado = p.id ? !!p[pl] : false;
        return '<label><input type="checkbox" name="' + pl + '"' + (marcado ? ' checked' : '') + '> ' + L.PLATAFORMAS[pl] + '</label>';
      }).join('') + '</div></div>' +
      '<label class="campo">Producto<input name="producto" autocomplete="off" value="' + esc(p.producto || '') + '" placeholder="Ej. Queso manchego"></label>' +
      '<label class="campo">Gancho <small>¿Qué engancha en los primeros 3 segundos?</small><input name="gancho" autocomplete="off" value="' + esc(p.gancho || '') + '"></label>' +
      '<label class="campo">Objetivo<select name="objetivo"><option value="">—</option>' + L.OBJETIVOS.map(function (o) {
        return '<option' + (p.objetivo === o ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + (p.objetivo && L.OBJETIVOS.indexOf(p.objetivo) < 0 ? '<option selected>' + esc(p.objetivo) + '</option>' : '') + '</select></label>';
  }
  function vistaNueva(q) {
    var idea = q.get('modo') === 'idea';
    return '<h1>' + (idea ? 'Nueva idea' : 'Nueva pieza') + '</h1>' +
      '<div class="seg-tabs"><a href="#/nueva"' + (idea ? '' : ' class="on"') + '>Pieza grabada o por hacer</a><a href="#/nueva?modo=idea"' + (idea ? ' class="on"' : '') + '>Solo una idea</a></div>' +
      '<form data-form="nueva" data-modo="' + (idea ? 'idea' : 'pieza') + '" class="card">' + camposBrief(null, idea) +
      (idea ? '' : '<label class="check espera-check"><input type="checkbox" name="en_espera" data-toggle="espera-prod"> Está esperando mercancía para publicarse</label>' +
        '<label class="campo" data-espera-prod hidden>¿Qué mercancía?<input name="espera_producto" list="lista-productos" autocomplete="off"></label>' + datalistProductos()) +
      '<p class="ayuda">' + (idea ? 'Queda en el banco de ideas. Cuando se grabe, ábrela y toca «Empezar producción».' : 'Queda como tarea de edición. Reels: video → copy. Carruseles: texto → diseño → copy.') + '</p>' +
      '<button class="btn grande" type="submit">Guardar</button></form>';
  }
  function datalistProductos() {
    var vistos = {};
    piezas().forEach(function (p) { [p.producto, p.espera_producto].forEach(function (x) { if (x) vistos[x.trim()] = 1; }); });
    return '<datalist id="lista-productos">' + Object.keys(vistos).sort().map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>';
  }

  // ---------- Vista: Piezas ----------
  var FILTROS = [
    ['activas', 'Activas'], ['produccion', 'En producción'], ['programadas', 'Programadas'], ['banco', 'Banco'],
    ['espera', 'En espera'], ['ideas', 'Ideas'], ['publicadas', 'Publicadas'], ['archivadas', 'Archivadas']
  ];
  function filtra(f, p) {
    switch (f) {
      case 'produccion': return p.fase === 'produccion' && !p.en_espera;
      case 'programadas': return p.fase === 'aprobada' && !p.en_espera && !L.enBanco(p);
      case 'banco': return L.enBanco(p);
      case 'espera': return p.en_espera && p.fase !== 'archivada';
      case 'ideas': return p.fase === 'idea';
      case 'publicadas': return p.fase === 'publicada';
      case 'archivadas': return p.fase === 'archivada';
      default: return p.fase === 'produccion' || p.fase === 'aprobada';
    }
  }
  function vistaPiezas(q) {
    var f = q.get('f') || 'activas';
    var lista = piezas().filter(function (p) { return filtra(f, p); });
    if (f === 'publicadas') lista.sort(function (a, b) { return String(b.publicado_ig_en || b.publicado_tt_en || '') > String(a.publicado_ig_en || a.publicado_tt_en || '') ? 1 : -1; });
    var cuenta = {};
    FILTROS.forEach(function (x) { cuenta[x[0]] = piezas().filter(function (p) { return filtra(x[0], p); }).length; });
    return '<h1>Piezas</h1>' +
      '<div class="filtros">' + FILTROS.map(function (x) {
        return '<a href="#/piezas?f=' + x[0] + '" class="filtro' + (x[0] === f ? ' on' : '') + '">' + x[1] + ' <small>' + cuenta[x[0]] + '</small></a>';
      }).join('') + '</div>' +
      '<input type="search" class="buscar" placeholder="Buscar por título o producto" data-buscar-en="#lista-piezas" aria-label="Buscar">' +
      (f === 'banco' ? '<p class="ayuda">El banco son piezas ya aprobadas sin fecha: úsalas para llenar huecos los días que no se pudo aprobar.</p>' : '') +
      (f === 'ideas' ? '<p class="ayuda"><a href="#/nueva?modo=idea">+ Anotar una idea</a></p>' : '') +
      '<div class="lista" id="lista-piezas">' + (lista.length ? lista.map(function (p) {
        var extra = f === 'publicadas' ? ['ig', 'tt'].filter(function (k) { return p['vistas_' + k] != null; }).map(function (k) { return L.PLAT_CORTO[k] + ' ' + Number(p['vistas_' + k]).toLocaleString('es'); }).join(' · ') : '';
        return itemPieza(p, extra);
      }).join('') : '<p class="muted vacio">Nada por aquí.</p>') + '</div>';
  }

  // ---------- Vista: Calendario ----------
  function vistaCalendario(q) {
    var off = parseInt(q.get('d') || '0', 10) || 0;
    var inicio = L.addDias(S.hoy, off);
    var dias = [];
    for (var i = 0; i < 14; i++) dias.push(L.addDias(inicio, i));
    var html = '<h1>Calendario</h1><div class="cal-nav"><a class="btn sec chico" href="#/calendario?d=' + (off - 14) + '">‹ Antes</a>' +
      (off ? '<a class="btn fantasma chico" href="#/calendario">Hoy</a>' : '') +
      '<a class="btn sec chico" href="#/calendario?d=' + (off + 14) + '">Después ›</a></div><div class="cal">';
    dias.forEach(function (d) {
      var c = L.diaCfg(ajustes(), d);
      var esSlot = c.tipo === 'reel' || c.tipo === 'carrusel';
      var filas = ['ig', 'tt'].map(function (pl) {
        var en = piezas().filter(function (p) { return p[pl] && L.fechaDe(p, pl) === d && p.fase !== 'archivada' && p.fase !== 'idea' && !p.en_espera; });
        var slot = esSlot && (c.plataformas || []).indexOf(pl) >= 0;
        if (!en.length && !slot) return '';
        var cont = en.map(function (p) {
          var pub = L.publicadoEn(p, pl);
          var ic = pub ? '✅' : p.fase === 'produccion' ? '📝' : (d < S.hoy ? '⚠️' : '⏰');
          var titulo = pub ? 'Publicado' : p.fase === 'produccion' ? 'Fecha propuesta, falta aprobar' : (d < S.hoy ? 'No se marcó como publicado' : 'Aprobado y programado');
          return '<a class="cal-pieza' + (p.fase === 'produccion' ? ' propuesta' : '') + '" href="#/p/' + p.id + '" title="' + titulo + '">' + ic + ' ' + esc(p.titulo) + '</a>';
        }).join('');
        if (!en.length) {
          cont = d >= S.hoy ? '<button class="cal-hueco" data-act="hueco" data-fecha="' + d + '" data-plat="' + pl + '" data-tipo="' + c.tipo + '">Hueco · llenar</button>' : '<span class="cal-vacio">Sin publicación</span>';
        }
        return '<div class="cal-fila"><span class="plat ' + pl + '">' + L.PLAT_CORTO[pl] + '</span><div class="cal-items">' + cont + '</div></div>';
      }).join('');
      var gs = grabaciones().filter(function (g) { return g.fecha === d && g.estado !== 'cancelada'; });
      var filaG = gs.map(function (g) {
        var ok = g.estado === 'hecha' ? '✅' : L.estadoGrabacion(g, S.data.equipo).completa ? '✓' : '⏳';
        return '<a class="cal-grab" href="#/grabacion/' + g.id + '">🎬 Grabación ' + L.fmtHora(g.hora) + ' ' + ok + '</a>';
      }).join('');
      html += '<div class="cal-dia' + (d === S.hoy ? ' hoy' : '') + (d < S.hoy ? ' pasado' : '') + ' t-' + c.tipo + '">' +
        '<div class="cal-dia-head"><b>' + L.fmtFecha(d) + '</b><span>' + L.TIPO_DIA[c.tipo] + '</span></div>' + filaG +
        (filas || '<p class="cal-libre">' + (c.tipo === 'historias' ? 'Día de historias' : 'Día libre') + '</p>') + '</div>';
    });
    return html + '</div><p class="ayuda leyenda">✅ publicado · ⏰ programado · 📝 fecha propuesta (falta aprobar) · ⚠️ pasó sin marcar</p>';
  }

  // ---------- Vista: Métricas ----------
  function barra(valor, max, etiqueta, detalle) {
    var pct = max ? Math.max(4, Math.round(valor / max * 100)) : 0;
    return '<div class="barra"><div class="barra-txt"><span>' + etiqueta + '</span><b>' + detalle + '</b></div><div class="barra-fondo"><span style="width:' + pct + '%"></span></div></div>';
  }
  function vistaMetricas(q) {
    var dias = parseInt(q.get('dias') || '30', 10);
    if ([30, 90].indexOf(dias) < 0) dias = 30;
    var m = L.metricas(piezas(), eventos(), ajustes(), S.hoy, dias);
    var html = '<h1>Métricas</h1><div class="seg-tabs"><a href="#/metricas?dias=30"' + (dias === 30 ? ' class="on"' : '') + '>30 días</a><a href="#/metricas?dias=90"' + (dias === 90 ? ' class="on"' : '') + '>90 días</a></div>';
    html += '<div class="kpis">' +
      '<div class="kpi"><b>' + m.publicadas + '</b><span>publicaciones</span></div>' +
      (function () { var r = L.racha(grabaciones(), S.hoy, Math.round(dias / 7)); var h = r.filter(function (x) { return x.estado === 'hecha'; }).length; return '<div class="kpi"><b>' + h + ' de ' + r.length + '</b><span>semanas con grabación</span></div>'; })() +
      '<div class="kpi"><b>' + (m.cumplimiento.pct == null ? '—' : m.cumplimiento.pct + '%') + '</b><span>del cronograma cumplido</span></div>' +
      '<div class="kpi"><b>' + L.fmtHoras(m.respuestaAprobacion.mediana) + '</b><span>tiempo típico de aprobación</span></div>' +
      '<div class="kpi"><b>' + L.fmtHoras(m.respuestaCorreccion.mediana) + '</b><span>tiempo típico de corrección</span></div>' +
      '</div>';
    var maxR = Math.max.apply(null, m.rondasEtapa.map(function (x) { return x.promedio; }).concat([1]));
    html += seccion('Rondas de corrección por etapa', m.rondasEtapa.length ? m.rondasEtapa.map(function (x) {
      return barra(x.promedio, maxR, x.label, (Math.round(x.promedio * 10) / 10).toString().replace('.', ',') + ' <small>(' + x.sinCorrecciones + ' de ' + x.piezas + ' a la primera)</small>');
    }).join('') : '<p class="muted">Todavía no hay aprobaciones en este período.</p>');
    var maxC = m.chips.length ? m.chips[0].veces : 1;
    html += seccion('Lo que más se corrige', (m.chips.length ? m.chips.map(function (x) { return barra(x.veces, maxC, esc(x.chip), x.veces); }).join('') +
      '<p class="ayuda">Úsalo para el feedback con tu editora: si algo se repite, conviene una regla fija (ej. plantilla de subtítulos) en vez de corregirlo cada vez.</p>' : '<p class="muted">Sin correcciones en este período.</p>'));
    html += seccion('Qué funciona (vistas)', (m.topVistas.length ? '<ol class="ranking">' + m.topVistas.map(function (x) {
      return '<li><a href="#/p/' + x.pieza.id + '">' + esc(x.pieza.titulo) + '</a> <span class="plat ' + x.plataforma + '">' + L.PLAT_CORTO[x.plataforma] + '</span> <b>' + Number(x.vistas).toLocaleString('es') + '</b></li>';
    }).join('') + '</ol>' + (m.vistasPorTipo.length ? '<p class="label">Promedio por formato</p>' + m.vistasPorTipo.map(function (x) {
      return '<p class="fila-dato"><span>' + L.TIPOS[x.tipo] + ' en ' + L.PLATAFORMAS[x.plataforma] + '</span><b>' + Math.round(x.promedio).toLocaleString('es') + '</b> <small class="muted">(' + x.n + ')</small></p>';
    }).join('') : '') : '<p class="muted">Anota las vistas a los 7 días de publicar y aquí verás qué funciona mejor.</p>'));
    return html;
  }

  // ---------- Vista: Ajustes ----------
  function formPerfil(y) {
    y = y || {};
    return '<form data-form="perfil" class="card">' +
      '<label class="campo">Tu nombre<input name="nombre" required autocomplete="name" value="' + esc(y.nombre || '') + '"></label>' +
      '<div class="campo"><span class="label">Tu papel</span><div class="seg grande vertical">' +
      '<label><input type="radio" name="rol" value="aprueba"' + (y.rol === 'aprueba' ? ' checked' : '') + ' required> Apruebo el contenido</label>' +
      '<label><input type="radio" name="rol" value="edita"' + (y.rol === 'edita' ? ' checked' : '') + '> Edito y publico</label></div></div>' +
      '<label class="campo">Tu WhatsApp <small>Para que los avisos te lleguen directo. Ej. 0414 123 4567</small><input name="telefono" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(y.telefono || '') + '"></label>' +
      '<button class="btn" type="submit">Guardar</button></form>';
  }
  function vistaAjustes() {
    var aj = ajustes();
    var editable = rol() === 'aprueba';
    var html = '<h1>Ajustes</h1>' + seccion('Tu perfil', formPerfil(yo()));
    html += seccion('Cronograma', '<form data-form="ajustes" class="card"><div class="cron">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      var c = aj.cronograma[String(i)] || { tipo: 'descanso', plataformas: [] };
      return '<div class="cron-fila"><b>' + L.DIAS[i] + '</b><select name="tipo_' + i + '"' + (editable ? '' : ' disabled') + '>' + Object.keys(L.TIPO_DIA).map(function (t) {
        return '<option value="' + t + '"' + (c.tipo === t ? ' selected' : '') + '>' + L.TIPO_DIA[t] + '</option>';
      }).join('') + '</select>' + ['ig', 'tt'].map(function (pl) {
        return '<label class="check mini"><input type="checkbox" name="plat_' + i + '_' + pl + '"' + ((c.plataformas || []).indexOf(pl) >= 0 ? ' checked' : '') + (editable ? '' : ' disabled') + '> ' + L.PLAT_CORTO[pl] + '</label>';
      }).join('') + '</div>';
    }).join('') + '</div>' +
      '<div class="campo"><span class="label">Grabación semanal por defecto <small>La app la propone sola cada semana</small></span><div class="fila-dos"><select name="grabacion_dia"' + (editable ? '' : ' disabled') + '>' + [1, 2, 3, 4, 5, 6, 0].map(function (i) {
        return '<option value="' + i + '"' + (+(aj.grabacion_dia == null ? 2 : aj.grabacion_dia) === i ? ' selected' : '') + '>' + L.DIAS[i] + '</option>';
      }).join('') + '</select><input type="time" name="grabacion_hora" value="' + esc(aj.grabacion_hora || '11:00') + '"' + (editable ? '' : ' disabled') + '></div></div>' +
      '<label class="campo">Días mínimos entre IG y TikTok para el mismo contenido<input type="number" name="dias_minimos" min="0" max="30" value="' + L.minimo(aj) + '"' + (editable ? '' : ' disabled') + '></label>' +
      (editable ? '<button class="btn" type="submit">Guardar cronograma</button>' : '<p class="ayuda">Solo quien aprueba cambia el cronograma.</p>') + '</form>');
    html += seccion('Equipo', '<div class="lista">' + S.data.equipo.map(function (e) {
      return '<div class="item"><span class="item-cuerpo"><span class="item-titulo">' + esc(e.nombre) + '</span><span class="item-meta"><span class="muted">' + (e.rol === 'aprueba' ? 'Aprueba' : 'Edita y publica') + (e.telefono ? ' · ' + esc(e.telefono) : ' · sin WhatsApp') + '</span></span></span></div>';
    }).join('') + '</div>');
    if (store.modo === 'demo') {
      html += seccion('Modo demo', '<p>Estás viendo la app con datos de ejemplo. Usa los botones de arriba para verla como Sara o como la editora.</p>' +
        '<p>Para usarla de verdad (datos compartidos entre las dos), sigue la guía de instalación: crear la base de datos en Supabase y pegar dos datos en <code>config.js</code>.</p>' +
        '<button class="btn sec" data-act="demo-reset">Reiniciar datos de ejemplo</button>');
    } else {
      html += '<div class="mas-acciones"><button class="btn sec" data-act="salir">Cerrar sesión</button></div>';
    }
    return html + '<p class="ayuda version">Contenido Barquero · v1.0</p>';
  }

  // ---------- Vista: Login ----------
  function vistaLogin() {
    return '<div class="login"><div class="login-marca"><span class="logo grande">B</span><h1>Contenido</h1><p class="muted">Barquero · aprobaciones y calendario</p></div>' +
      '<form data-form="login" class="card"><label class="campo">Correo<input type="email" name="email" required autocomplete="username" inputmode="email"></label>' +
      '<label class="campo">Contraseña<input type="password" name="clave" required autocomplete="current-password"></label>' +
      '<button class="btn grande" type="submit">Entrar</button></form></div>';
  }

  // ---------- Modales ----------
  function modalHtml() {
    var m = S.modal;
    if (!m) return '';
    var p = m.id ? pieza(m.id) : null;
    var cuerpo = '';
    if (m.tipo === 'publicar' && p) {
      var copy = p['copy_' + m.plat];
      cuerpo = '<h2>Publicar en ' + L.PLATAFORMAS[m.plat] + '</h2><p class="muted">' + esc(p.titulo) + '</p>' +
        (copy ? '<div class="copy-box"><div class="texto-largo">' + nl2br(copy) + '</div><button type="button" class="btn sec chico" data-act="copiar" data-id="' + p.id + '" data-campo="copy_' + m.plat + '">Copiar copy</button></div>' : '<p class="rojo">Esta pieza no tiene copy para ' + L.PLATAFORMAS[m.plat] + '.</p>') +
        '<form data-form="publicar" data-id="' + p.id + '" data-plat="' + m.plat + '"><p class="label">Antes de marcarla:</p>' +
        L.CHECKLIST_PUBLICAR.map(function (c, i) { return '<label class="check"><input type="checkbox" name="check" value="' + i + '"> ' + esc(c) + '</label>'; }).join('') +
        '<label class="campo">Enlace del post <small>(opcional)</small><input type="url" name="enlace" inputmode="url" placeholder="https://"></label>' +
        '<button class="btn grande" type="submit">Marcar como publicado</button></form>';
    } else if (m.tipo === 'vistas' && p) {
      cuerpo = '<h2>Vistas</h2><p class="muted">' + esc(p.titulo) + ' · anótalas a los 7 días de publicado.</p><form data-form="vistas" data-id="' + p.id + '">' +
        L.plataformasDe(p).filter(function (pl) { return L.publicadoEn(p, pl); }).map(function (pl) {
          return '<label class="campo">' + L.PLATAFORMAS[pl] + '<input type="text" inputmode="numeric" autocomplete="off" placeholder="Ej. 2.350" name="vistas_' + pl + '" value="' + esc(p['vistas_' + pl] == null ? '' : p['vistas_' + pl]) + '"></label>';
        }).join('') + '<button class="btn grande" type="submit">Guardar</button></form>';
    } else if (m.tipo === 'espera' && p) {
      cuerpo = '<h2>En espera de mercancía</h2><p class="muted">Se le quitan las fechas. Cuando llegue, marcas «Llegó» y vuelve al banco para programarla.</p>' +
        '<form data-form="espera" data-id="' + p.id + '"><label class="campo">¿Qué mercancía?<input name="producto" required list="lista-productos" value="' + esc(p.producto || '') + '" autocomplete="off"></label>' + datalistProductos() +
        '<button class="btn grande" type="submit">Poner en espera</button></form>';
    } else if (m.tipo === 'editar' && p) {
      cuerpo = '<h2>Editar brief</h2><form data-form="editar" data-id="' + p.id + '">' + camposBrief(p, p.fase === 'idea') +
        (L.puedeCambiarTipo(p) ? '' : '<p class="ayuda">El tipo ya no se puede cambiar en esta etapa.</p>') +
        '<button class="btn grande" type="submit">Guardar</button></form>';
    } else if (m.tipo === 'fechas' && p) {
      var vals = (p.fecha_ig || p.fecha_tt) ? { fecha_ig: p.fecha_ig, fecha_tt: p.fecha_tt, primero: p.primero } : L.sugerirFechas(p, piezas(), ajustes(), S.hoy, null);
      cuerpo = '<h2>Fechas</h2><p class="muted">' + esc(p.titulo) + '</p><form data-form="fechas" data-id="' + p.id + '">' + bloqueFechas(p, vals, false) +
        '<button class="btn grande" type="submit">Guardar fechas</button></form>';
    } else if (m.tipo === 'reagendar') {
      var g = grabacion(m.id);
      cuerpo = '<h2>Proponer otro día</h2><p class="muted">Ahora: ' + esc(cuandoG(g)) + '. La otra persona tendrá que confirmar de nuevo.</p>' +
        '<form data-form="reagendar" data-id="' + g.id + '"><div class="fila-dos"><label class="campo">Día<input type="date" name="fecha" required min="' + S.hoy + '" value="' + esc(g.fecha) + '"></label>' +
        '<label class="campo">Hora<input type="time" name="hora" required value="' + esc(g.hora) + '"></label></div>' +
        '<label class="campo">Motivo <small>(opcional)</small><input name="motivo" autocomplete="off" placeholder="Ej. llega mercancía el miércoles"></label>' +
        '<button class="btn grande" type="submit">Proponer</button></form>';
    } else if (m.tipo === 'no-grabo') {
      cuerpo = '<h2>No se grabó</h2><form data-form="no-grabo" data-id="' + m.id + '"><label class="campo">¿Qué pasó?<input name="motivo" required autocomplete="off" placeholder="Ej. no llegó la mercancía"></label>' +
        '<p class="ayuda">Queda en el historial para ver qué está fallando.</p><button class="btn grande" type="submit">Guardar</button></form>';
    } else if (m.tipo === 'hueco') {
      var h = { fecha: m.fecha, plataforma: m.plat, tipo: m.tipoPieza };
      var cands = L.candidatosHueco(piezas(), h);
      cuerpo = '<h2>Llenar hueco</h2><p class="muted">' + L.fmtFechaLarga(m.fecha) + ' · ' + L.TIPOS[m.tipoPieza] + ' en ' + L.PLATAFORMAS[m.plat] + '</p>';
      if (cands.length) {
        cuerpo += '<form data-form="llenar" data-fecha="' + m.fecha + '" data-plat="' + m.plat + '"><p class="label">Del banco (ya aprobadas):</p>' +
          cands.map(function (c, i) {
            var otra = m.plat === 'ig' ? 'tt' : 'ig';
            var nota = c[otra] && !L.publicadoEn(c, otra) && !L.fechaDe(c, otra) ? ' <small class="muted">· también va en ' + L.PLATAFORMAS[otra] + '</small>' : '';
            return '<label class="opcion"><input type="radio" name="pieza" value="' + c.id + '"' + (i === 0 ? ' checked' : '') + '> <span>' + esc(c.titulo) + nota + '</span></label>';
          }).join('') +
          '<label class="check"><input type="checkbox" name="otra" checked> Si va en las dos plataformas, programar la otra con la regla de ' + L.minimo(ajustes()) + ' días</label>' +
          '<button class="btn grande" type="submit">Programar</button></form>';
      } else {
        var ideas = piezas().filter(function (p) { return p.fase === 'idea'; }).length;
        cuerpo += '<p>No hay piezas aprobadas en el banco que sirvan para este hueco.</p>' +
          '<p class="ayuda">Opciones: grabar algo nuevo' + (ideas ? ' (hay ' + plural(ideas, 'idea anotada', 'ideas anotadas') + ')' : '') + ', o publicar solo historias ese día.</p>' +
          '<a class="btn" href="#/nueva" data-act="cerrar-modal">Crear pieza</a> ' + (ideas ? '<a class="btn sec" href="#/piezas?f=ideas" data-act="cerrar-modal">Ver ideas</a>' : '');
      }
    } else {
      return '';
    }
    return '<div class="modal" role="dialog" aria-modal="true"><div class="modal-fondo" data-act="cerrar-modal"></div><div class="hoja">' +
      '<button class="cerrar" data-act="cerrar-modal" aria-label="Cerrar">×</button>' + cuerpo + '</div></div>';
  }
  function flashHtml() {
    var f = S.flash;
    if (!f) return '';
    if (!f.t) {
      f.t = Date.now();
      if (!f.wa) setTimeout(function () { if (S.flash === f) { S.flash = null; pintarCapas(); } }, 5000);
    }
    return '<div class="flash" role="status"><div class="flash-cuerpo"><p class="flash-t">' + esc(f.titulo) + '</p>' + (f.texto ? '<p>' + esc(f.texto) + '</p>' : '') +
      (f.wa ? '<a class="btn wa grande" target="_blank" rel="noopener" data-act="cerrar-flash-tarde" href="' + esc(f.wa.href) + '">' + ICON.wa + ' ' + esc(f.wa.label) + '</a>' : '') +
      '<button class="btn fantasma" data-act="cerrar-flash">' + (f.wa ? 'Ahora no' : 'Ok') + '</button></div></div>';
  }
  function toastHtml() {
    if (!S.toast) return '';
    return '<div class="toast ' + S.toast.tipo + '" role="alert">' + esc(S.toast.texto) + '</div>';
  }

  // ---------- Después de pintar: fechas ----------
  function despuesDePintar(raiz) {
    (raiz || document).querySelectorAll('fieldset.fechas').forEach(function (fs) { actualizarFechas(fs); });
  }
  function leerFechas(fs) {
    var get = function (n) { var el = fs.querySelector('[name="' + n + '"]'); return el && !el.disabled ? el.value || null : null; };
    var prim = fs.querySelector('[name="primero"]:checked');
    return { fecha_ig: get('fecha_ig'), fecha_tt: get('fecha_tt'), primero: prim ? prim.value : null, banco: !!(fs.querySelector('[name="banco"]') || {}).checked };
  }
  function actualizarFechas(fs) {
    var p = pieza(fs.dataset.pieza);
    if (!p) return;
    var banco = fs.querySelector('[name="banco"]');
    var enBanco = banco && banco.checked;
    fs.querySelectorAll('input[type="date"], [data-primero]').forEach(function (el) {
      var pl = el.name && el.name.indexOf('fecha_') === 0 ? el.name.slice(6) : null;
      el.disabled = enBanco || (pl && !!L.publicadoEn(p, pl));
    });
    fs.classList.toggle('apagado', !!enBanco);
    fs.querySelectorAll('[data-dia]').forEach(function (sm) {
      var inp = fs.querySelector('[name="fecha_' + sm.dataset.dia + '"]');
      var v = inp && inp.value;
      sm.textContent = v ? L.fmtFechaLarga(v) + ' · ' + L.TIPO_DIA[L.diaCfg(ajustes(), v).tipo].toLowerCase() : '';
    });
    var ul = fs.querySelector('[data-avisos]');
    if (!ul) return;
    if (enBanco) { ul.innerHTML = ''; return; }
    var f = leerFechas(fs);
    var avisos = L.validarFechas(p, f, piezas(), ajustes(), S.hoy);
    var faltan = L.pendientesDePublicar(p).filter(function (pl) { return !f['fecha_' + pl]; });
    if (faltan.length && faltan.length < L.pendientesDePublicar(p).length) avisos.push(faltan.map(function (x) { return L.PLATAFORMAS[x]; }).join(' y ') + ' quedará sin fecha (en el banco).');
    ul.innerHTML = avisos.map(function (a) { return '<li>⚠️ ' + esc(a) + '</li>'; }).join('');
  }
  function sugerirEn(fs) {
    var p = pieza(fs.dataset.pieza);
    if (!p) return;
    var prim = fs.querySelector('[name="primero"]:checked');
    var desde = fs.closest('form[data-form="fechas"]') ? S.hoy : desdeSugerencia();
    var s = L.sugerirFechas(p, piezas(), ajustes(), desde, prim ? prim.value : null);
    ['ig', 'tt'].forEach(function (pl) {
      var el = fs.querySelector('[name="fecha_' + pl + '"]');
      if (el && !L.publicadoEn(p, pl)) el.value = s['fecha_' + pl] || '';
    });
    if (s.primero) { var r = fs.querySelector('[name="primero"][value="' + s.primero + '"]'); if (r) r.checked = true; }
    var b = fs.querySelector('[name="banco"]'); if (b) b.checked = false;
    actualizarFechas(fs);
  }

  // ---------- Acciones (clics) ----------
  var ACC = {
    'reintentar': function () { recargar(); },
    'salir': function () { store.salir().then(function () { S.data = null; S.firma = ''; location.hash = '#/'; render(); }); },
    'volver': function () { if (history.length > 1) history.back(); else location.hash = '#/'; },
    'demo-rol': function (el) { store.cambiarUsuario(el.dataset.id); S.lote = null; recargar(true).then(render); },
    'demo-reset': function () { if (confirm('¿Borrar los cambios y volver a los datos de ejemplo?')) { store.reiniciar(); S.lote = null; recargar(); } },
    'abrir-corregir': function (el) {
      var card = el.closest('.revision');
      var f = card.querySelector('.panel-corregir');
      f.hidden = false;
      card.querySelector('form[data-form="aprobar"] .acciones').hidden = true;
      var c = f.querySelector('.chip'); if (c) c.focus();
    },
    'cerrar-corregir': function (el) {
      var card = el.closest('.revision');
      card.querySelector('.panel-corregir').hidden = true;
      card.querySelector('form[data-form="aprobar"] .acciones').hidden = false;
    },
    'chip': function (el) { el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); S.sucio = true; },
    'agregar-punto': function (el) {
      var cont = el.closest('form').querySelector('[data-puntos]');
      cont.insertAdjacentHTML('beforeend', puntoHtml(el.dataset.ub || null));
      var ins = cont.querySelectorAll('.punto'); var ult = ins[ins.length - 1].querySelector('input'); if (ult) ult.focus();
    },
    'quitar-punto': function (el) {
      var cont = el.closest('[data-puntos]');
      if (cont.querySelectorAll('.punto').length > 1) el.closest('.punto').remove();
      else el.closest('.punto').querySelectorAll('input').forEach(function (i) { i.value = ''; });
    },
    'saltar': function () {
      var p = pieza(S.lote.ids[S.lote.i]);
      S.lote.hechos.push({ accion: 'saltada', titulo: p ? p.titulo : '', etapa: p ? p.etapa : null });
      S.lote.i++; S.sucio = false; render(); window.scrollTo(0, 0);
    },
    'terminar-lote': function () { S.lote = null; location.hash = '#/'; },
    'sugerir': function (el) { sugerirEn(el.closest('fieldset.fechas')); S.sucio = true; },
    'copiar': function (el) {
      var p = pieza(el.dataset.id); if (!p) return;
      copiarTexto(p[el.dataset.campo] || '').then(function () { var t = el.textContent; el.textContent = '¡Copiado!'; setTimeout(function () { el.textContent = t; }, 1500); });
    },
    'publicar': function (el) { abrirModal({ tipo: 'publicar', id: el.dataset.id, plat: el.dataset.plat }); },
    'vistas': function (el) { abrirModal({ tipo: 'vistas', id: el.dataset.id }); },
    'espera': function (el) { abrirModal({ tipo: 'espera', id: el.dataset.id }); },
    'editar': function (el) { abrirModal({ tipo: 'editar', id: el.dataset.id }); },
    'fechas': function (el) { abrirModal({ tipo: 'fechas', id: el.dataset.id }); },
    'hueco': function (el) { abrirModal({ tipo: 'hueco', fecha: el.dataset.fecha, plat: el.dataset.plat, tipoPieza: el.dataset.tipo }); },
    'cerrar-modal': function () { S.modal = null; S.sucio = false; pintarCapas(); },
    'cerrar-flash': function () { S.flash = null; pintarCapas(); },
    'cerrar-flash-tarde': function () { setTimeout(function () { S.flash = null; pintarCapas(); }, 400); return 'seguir'; },
    'llego': function (el) {
      var p = pieza(el.dataset.id);
      accion(function () { return ejecutar(p, L.accionLlego(p)); }, function () {
        S.flash = { titulo: '📦 Marcada como llegada', texto: 'Está en el banco. Ahora puedes programarla.' };
      });
    },
    'llego-producto': function (el) {
      var prod = el.dataset.producto.trim().toLowerCase();
      var lista = piezas().filter(function (p) { return p.en_espera && (p.espera_producto || '').trim().toLowerCase() === prod; });
      if (!lista.length) return;
      accion(function () {
        var sec = Promise.resolve();
        lista.forEach(function (p) { sec = sec.then(function () { return ejecutar(p, L.accionLlego(p)); }); });
        return sec;
      }, function () {
        S.flash = { titulo: '📦 Llegó ' + el.dataset.producto, texto: plural(lista.length, 'pieza volvió', 'piezas volvieron') + ' a su lugar. Las aprobadas están en el banco para programarlas.' };
      });
    },
    'archivar': function (el) {
      var p = pieza(el.dataset.id);
      if (!confirm('¿Archivar «' + p.titulo + '»? Se puede reabrir después.')) return;
      accion(function () { return ejecutar(p, L.accionArchivar(p)); }, function () { S.flash = { titulo: 'Archivada' }; });
    },
    'reabrir': function (el) {
      var p = pieza(el.dataset.id);
      accion(function () { return ejecutar(p, L.accionReabrir(p, eventos())); }, function () { S.flash = { titulo: 'Reabierta' }; });
    },
    'confirmar-grab': function (el) {
      var g = grabacion(el.dataset.id), r;
      try { r = L.accionConfirmar(g, yo().user_id, S.data.equipo); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutarG(g, r); }, function (fila) {
        var o = otraPersona(), completa = r.eventos[0].datos.completa;
        S.flash = { titulo: completa ? '🎬 Grabación confirmada' : '✓ Confirmaste', texto: cuandoG(fila) + (completa ? '' : '. Falta que confirme ' + (o ? o.nombre : 'la otra persona') + '.'),
          wa: { href: L.waLink(o && o.telefono, L.msgGrabacion(fila, completa ? 'completa' : 'confirme', base(), o && o.nombre)), label: 'Avisar a ' + (o ? o.nombre : 'la otra') + ' por WhatsApp' } };
      });
    },
    'reagendar': function (el) { abrirModal({ tipo: 'reagendar', id: el.dataset.id }); },
    'no-grabo': function (el) { abrirModal({ tipo: 'no-grabo', id: el.dataset.id }); },
    'hecha-grab': function (el) {
      var g = grabacion(el.dataset.id), r;
      try { r = L.accionCerrarGrabacion(g, true); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutarG(g, r); }, function () { S.flash = { titulo: '✅ Grabación hecha', texto: 'Marca «Grabado ✓» en cada video para que pase a edición.' }; location.hash = '#/grabacion/' + g.id; });
    },
    'reabrir-grab': function (el) {
      var g = grabacion(el.dataset.id), r;
      try { r = L.accionReabrirGrabacion(g); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutarG(g, r); }, null);
    },
    'grabado': function (el) {
      var p = pieza(el.dataset.id), r;
      try { r = L.accionIniciar(p, {}); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function () { S.flash = { titulo: '🎬 Grabado', texto: '«' + p.titulo + '» pasó a edición.' }; });
    },
    'agregar-a-grab': function (el) {
      var p = pieza(el.dataset.id);
      var r = { patch: { grabacion_id: el.dataset.grab }, match: { fase: 'idea' }, eventos: [{ tipo: 'editada', texto: 'agregada a la grabación', datos: { grabacion_id: el.dataset.grab } }] };
      accion(function () { return ejecutar(p, r); }, null);
    }
  };
  function abrirModal(m) { S.modal = m; pintarCapas(); var i = document.querySelector('.hoja input:not([type=hidden]), .hoja textarea'); if (i && m.tipo === 'espera') try { i.focus(); } catch (e) { /* nada */ } }
  function copiarTexto(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).catch(function () { return copiarViejo(t); });
    return copiarViejo(t);
  }
  function copiarViejo(t) {
    var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* nada */ }
    ta.remove();
    return Promise.resolve();
  }

  // Ejecuta algo que guarda, con manejo de errores y recarga
  function accion(fn, alTerminar, boton) {
    if (S.ocupado) return Promise.resolve();
    S.ocupado = true;
    var txt;
    if (boton) { txt = boton.textContent; boton.disabled = true; boton.textContent = 'Guardando…'; }
    return Promise.resolve().then(fn).then(function (res) {
      S.sucio = false;
      return recargar(true, true).then(function () {
        if (alTerminar) alTerminar(res);
        render();
      });
    }).catch(function (e) {
      if (boton && boton.isConnected) { boton.disabled = false; boton.textContent = txt; }
      aviso(e && e.usuario ? e.message : 'Algo falló: ' + (e && e.message ? e.message : e));
      if (e && /cambió mientras/.test(e.message)) recargar(true);
      if (e && e.sesion) { S.data = null; render(); }
    }).then(function () { S.ocupado = false; });
  }

  // ---------- Formularios ----------
  function val(f, n) { var el = f.elements[n]; return el ? el.value : ''; }
  function marcado(f, n) { var el = f.elements[n]; return !!(el && el.checked); }
  function radio(f, n) { var el = f.querySelector('[name="' + n + '"]:checked'); return el ? el.value : null; }

  var FORM = {
    login: function (f, btn) {
      if (S.ocupado) return;
      S.ocupado = true; btn.disabled = true; btn.textContent = 'Entrando…';
      store.entrar(val(f, 'email'), val(f, 'clave')).then(function () {
        S.ocupado = false; S.cargando = true; render(); return recargar();
      }).catch(function (e) {
        S.ocupado = false; btn.disabled = false; btn.textContent = 'Entrar';
        aviso(e.message);
      });
    },
    perfil: function (f, btn) {
      var nombre = val(f, 'nombre').trim(), r = radio(f, 'rol');
      if (!nombre || !r) return aviso('Completa tu nombre y tu papel.');
      var datos = { nombre: nombre, rol: r, telefono: val(f, 'telefono').trim() || null };
      var y = yo();
      accion(function () {
        if (y) return store.actualizar('equipo', y.user_id, datos, null);
        return store.insertar('equipo', Object.assign({ user_id: store.sesion().user.id }, datos));
      }, function () { S.flash = { titulo: y ? 'Perfil guardado' : '¡Listo, ' + nombre + '!', texto: y ? '' : 'Ya puedes usar la app.' }; if (!y) location.hash = '#/'; }, btn);
    },
    nueva: function (f, btn) {
      var idea = f.dataset.modo === 'idea';
      var datos = {
        titulo: val(f, 'titulo'), tipo: radio(f, 'tipo'), ig: marcado(f, 'ig'), tt: marcado(f, 'tt'),
        producto: val(f, 'producto'), gancho: val(f, 'gancho'), objetivo: val(f, 'objetivo'), idea: idea,
        en_espera: marcado(f, 'en_espera'), espera_producto: val(f, 'espera_producto')
      };
      var r;
      try { r = L.nuevaPieza(datos, { id: ST.uuid(), hoy: S.hoy }); } catch (e) { return aviso(e.message); }
      if (datos.en_espera && !String(datos.espera_producto || '').trim()) return aviso('Escribe qué mercancía se está esperando.');
      accion(function () {
        return store.insertar('piezas', r.fila).then(function (fila) {
          var sec = Promise.resolve();
          r.eventos.forEach(function (ev) { sec = sec.then(function () { return store.insertar('eventos', Object.assign({ pieza_id: fila.id }, ev)); }); });
          return sec.then(function () { return fila; });
        });
      }, function (fila) {
        S.flash = { titulo: idea ? '💡 Idea guardada' : '✅ Pieza creada', texto: idea ? 'Está en Piezas › Ideas.' : 'Cuando esté lista, entra a la pieza y toca «Enviar a revisión».' };
        location.hash = idea ? '#/piezas?f=ideas' : '#/p/' + fila.id;
      }, btn);
    },
    iniciar: function (f, btn) {
      var p = pieza(f.dataset.id);
      var r;
      try { r = L.accionIniciar(p, { tipo: radio(f, 'tipo'), ig: marcado(f, 'ig'), tt: marcado(f, 'tt'), producto: val(f, 'producto'), gancho: val(f, 'gancho'), objetivo: val(f, 'objetivo') }); } catch (e) { return aviso(e.message); }
      var tituloNuevo = val(f, 'titulo').trim();
      if (tituloNuevo && tituloNuevo !== p.titulo) r.patch.titulo = tituloNuevo;
      accion(function () { return ejecutar(p, r); }, function () { S.flash = { titulo: '▶️ En producción', texto: 'Ya aparece en «Por hacer».' }; }, btn);
    },
    enviar: function (f, btn) {
      var p = pieza(f.dataset.id);
      var fs = f.querySelector('fieldset.fechas');
      var datos = { nota: val(f, 'nota'), enlace: val(f, 'enlace'), texto_carrusel: val(f, 'texto_carrusel'), copy_ig: val(f, 'copy_ig'), copy_tt: val(f, 'copy_tt') };
      if (fs) Object.assign(datos, leerFechas(fs));
      var card = f.closest('.card');
      var res = [];
      card.querySelectorAll('[data-resuelta]:checked').forEach(function (c) { res.push(parseInt(c.value, 10)); });
      if (res.length) datos.resueltas = res;
      var r;
      try { r = L.accionEnviar(p, datos); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function (fila) {
        var sara = contraparte('aprueba');
        S.flash = { titulo: '📤 Enviado a revisión', texto: 'Avísale para que lo revise' + (p.etapa === 'video' || p.etapa === 'diseno' ? ' y mándale el archivo en el mismo chat.' : '.'),
          wa: { href: L.waLink(sara && sara.telefono, L.msgEnvio(fila || Object.assign({}, p, r.patch), base(), sara && sara.nombre)), label: 'Avisar a ' + (sara ? sara.nombre : 'aprobación') + ' por WhatsApp' } };
      }, btn);
    },
    aprobar: function (f, btn) {
      var p = pieza(f.dataset.id);
      var datos = { texto_carrusel: f.elements.texto_carrusel ? val(f, 'texto_carrusel') : null, copy_ig: f.elements.copy_ig ? val(f, 'copy_ig') : null, copy_tt: f.elements.copy_tt ? val(f, 'copy_tt') : null };
      var fs = f.querySelector('fieldset.fechas');
      if (fs) Object.assign(datos, leerFechas(fs));
      var r;
      try { r = L.accionAprobar(p, datos); } catch (e) { return aviso(e.message); }
      var enLote = !!S.lote && ruta().parts[0] === 'revisar';
      accion(function () { return ejecutar(p, r); }, function () {
        if (enLote) { S.lote.hechos.push({ accion: 'aprobada', titulo: p.titulo, etapa: p.etapa }); S.lote.i = S.lote.ids.indexOf(p.id) + 1; window.scrollTo(0, 0); return; }
        var ed = contraparte('edita');
        var sig = r.patch.etapa || null;
        S.flash = { titulo: '✅ Aprobado', texto: sig ? 'Sigue: ' + L.nombreEtapa(sig) + '.' : (r.eventos[0].datos.banco ? 'Quedó en el banco.' : 'Quedó programada.'),
          wa: { href: L.waLink(ed && ed.telefono, L.msgAprobacion(p, r.eventos[0], base(), sig)), label: 'Avisar a ' + (ed ? ed.nombre : 'edición') + ' por WhatsApp' } };
      }, btn);
    },
    corregir: function (f, btn) {
      var p = pieza(f.dataset.id);
      var chips = [];
      f.querySelectorAll('.chip[aria-pressed="true"]').forEach(function (c) { chips.push(c.dataset.valor); });
      var puntos = [];
      f.querySelectorAll('.punto').forEach(function (d) {
        var u = d.querySelector('[name="ubicacion"]'), t = d.querySelector('[name="punto"]');
        puntos.push({ ubicacion: u ? u.value : null, texto: t ? t.value : '' });
      });
      var r;
      try { r = L.accionCorregir(p, { chips: chips, puntos: puntos, comentario: val(f, 'comentario') }); } catch (e) { return aviso(e.message); }
      var enLote = !!S.lote && ruta().parts[0] === 'revisar';
      accion(function () { return ejecutar(p, r); }, function () {
        if (enLote) { S.lote.hechos.push({ accion: 'correccion', titulo: p.titulo, etapa: p.etapa }); S.lote.i = S.lote.ids.indexOf(p.id) + 1; window.scrollTo(0, 0); return; }
        var ed = contraparte('edita');
        S.flash = { titulo: '✏️ Corrección enviada', texto: 'Le aparece a ' + (ed ? ed.nombre : 'edición') + ' como tarea.',
          wa: { href: L.waLink(ed && ed.telefono, L.msgCorreccion(p, r.eventos[0], base())), label: 'Avisar a ' + (ed ? ed.nombre : 'edición') + ' por WhatsApp' } };
      }, btn);
    },
    comentario: function (f, btn) {
      var p = pieza(f.dataset.id);
      var r;
      try { r = L.accionComentario(p, val(f, 'texto')); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, null, btn);
    },
    publicar: function (f, btn) {
      var p = pieza(f.dataset.id), plat = f.dataset.plat;
      var checks = [];
      f.querySelectorAll('[name="check"]:checked').forEach(function (c) { checks.push(c.value); });
      var r;
      try { r = L.accionPublicar(p, plat, { checklist: checks, enlace: val(f, 'enlace') }, new Date().toISOString(), S.hoy); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function () {
        S.modal = null;
        var otra = plat === 'ig' ? 'tt' : 'ig';
        var falta = p[otra] && !L.publicadoEn(p, otra);
        S.flash = { titulo: '🚀 Publicada en ' + L.PLATAFORMAS[plat], texto: falta ? (L.fechaDe(p, otra) ? L.PLATAFORMAS[otra] + ': ' + L.fmtFechaLarga(L.fechaDe(p, otra)) + '.' : L.PLATAFORMAS[otra] + ' sigue sin fecha (banco).') : 'En 7 días te pedirá anotar las vistas.' };
      }, btn);
    },
    vistas: function (f, btn) {
      var p = pieza(f.dataset.id);
      var r;
      try { r = L.accionVistas(p, { vistas_ig: val(f, 'vistas_ig'), vistas_tt: val(f, 'vistas_tt') }); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function () { S.modal = null; S.flash = { titulo: '👀 Vistas guardadas' }; }, btn);
    },
    espera: function (f, btn) {
      var p = pieza(f.dataset.id);
      var r;
      try { r = L.accionEspera(p, val(f, 'producto'), S.hoy); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function () { S.modal = null; S.flash = { titulo: '📦 En espera', texto: 'Aparece en «En espera de mercancía» hasta que marques que llegó.' }; }, btn);
    },
    editar: function (f, btn) {
      var p = pieza(f.dataset.id);
      var r;
      try { r = L.accionEditar(p, { titulo: val(f, 'titulo'), tipo: radio(f, 'tipo'), ig: marcado(f, 'ig'), tt: marcado(f, 'tt'), producto: val(f, 'producto'), gancho: val(f, 'gancho'), objetivo: val(f, 'objetivo') }); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function () { S.modal = null; S.flash = { titulo: 'Cambios guardados' }; }, btn);
    },
    fechas: function (f, btn) {
      var p = pieza(f.dataset.id);
      var fe = leerFechas(f.querySelector('fieldset.fechas'));
      var r;
      try { r = L.accionFechas(p, fe.banco ? {} : fe); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function () { S.modal = null; S.flash = { titulo: r.eventos[0].datos.banco ? 'Movida al banco' : '📅 Programada' }; }, btn);
    },
    llenar: function (f, btn) {
      var id = radio(f, 'pieza');
      var p = pieza(id);
      if (!p) return aviso('Elige una pieza.');
      var plat = f.dataset.plat, fecha = f.dataset.fecha, otra = plat === 'ig' ? 'tt' : 'ig';
      var fe = { fecha_ig: p.fecha_ig, fecha_tt: p.fecha_tt };
      fe['fecha_' + plat] = fecha;
      if (marcado(f, 'otra') && p[otra] && !L.publicadoEn(p, otra) && !L.fechaDe(p, otra)) {
        fe['fecha_' + otra] = L.slotLibre(piezas(), ajustes(), otra, p.tipo, L.addDias(fecha, L.minimo(ajustes())), p.id);
      }
      fe.primero = fe['fecha_' + otra] && fe['fecha_' + otra] < fecha ? otra : plat;
      var r;
      try { r = L.accionFechas(p, fe); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutar(p, r); }, function () {
        S.modal = null;
        var txt = L.PLATAFORMAS[plat] + ': ' + L.fmtFechaLarga(fecha) + (fe['fecha_' + otra] && p[otra] ? ' · ' + L.PLATAFORMAS[otra] + ': ' + L.fmtFechaLarga(fe['fecha_' + otra]) : '');
        S.flash = { titulo: '📅 «' + p.titulo + '» programada', texto: txt };
      }, btn);
    },
    reagendar: function (f, btn) {
      var g = grabacion(f.dataset.id), r;
      try { r = L.accionReagendar(g, yo().user_id, val(f, 'fecha'), val(f, 'hora'), val(f, 'motivo'), S.hoy); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutarG(g, r); }, function (fila) {
        S.modal = null;
        var o = otraPersona();
        S.flash = { titulo: '🔁 Nueva propuesta', texto: cuandoG(fila) + '. Queda en el historial.',
          wa: { href: L.waLink(o && o.telefono, L.msgGrabacion(fila, 'reagenda', base(), o && o.nombre)), label: 'Avisar a ' + (o ? o.nombre : 'la otra') + ' por WhatsApp' } };
      }, btn);
    },
    'no-grabo': function (f, btn) {
      var g = grabacion(f.dataset.id), r;
      try { r = L.accionCerrarGrabacion(g, false, val(f, 'motivo')); } catch (e) { return aviso(e.message); }
      accion(function () { return ejecutarG(g, r); }, function () { S.modal = null; S.flash = { titulo: 'Anotado', texto: 'La próxima semana la app vuelve a proponer la grabación.' }; }, btn);
    },
    'titulo-grab': function (f, btn) {
      var r;
      try { r = L.nuevaPieza({ titulo: val(f, 'titulo'), tipo: val(f, 'tipo'), idea: true }, { id: ST.uuid(), hoy: S.hoy }); } catch (e) { return aviso(e.message); }
      r.fila.grabacion_id = f.dataset.id;
      accion(function () {
        return store.insertar('piezas', r.fila).then(function (fila) {
          return store.insertar('eventos', Object.assign({ pieza_id: fila.id }, r.eventos[0]));
        });
      }, null, btn);
    },
    ajustes: function (f, btn) {
      var cron = {};
      for (var i = 0; i < 7; i++) {
        var tipo = val(f, 'tipo_' + i);
        var plats = ['ig', 'tt'].filter(function (pl) { return marcado(f, 'plat_' + i + '_' + pl); });
        cron[String(i)] = { tipo: tipo, plataformas: (tipo === 'reel' || tipo === 'carrusel') ? plats : [] };
      }
      var dm = parseInt(val(f, 'dias_minimos'), 10);
      if (isNaN(dm) || dm < 0 || dm > 30) return aviso('Los días mínimos deben estar entre 0 y 30.');
      var gh = val(f, 'grabacion_hora');
      if (!L.horaValida(gh)) return aviso('Revisa la hora de grabación.');
      accion(function () { return store.actualizar('ajustes', 1, { cronograma: cron, dias_minimos: dm, grabacion_dia: parseInt(val(f, 'grabacion_dia'), 10), grabacion_hora: gh }, null); }, function () { S.flash = { titulo: 'Cronograma guardado' }; }, btn);
    }
  };

  // ---------- Eventos globales ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = ACC[el.dataset.act];
    if (!fn) return;
    var esEnlaceExterno = el.tagName === 'A' && el.target === '_blank';
    var esNavegacion = el.tagName === 'A' && !esEnlaceExterno;
    if (!esEnlaceExterno && !esNavegacion) e.preventDefault();
    if (el.dataset.act === 'volver') e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target, fn = FORM[f.dataset.form];
    if (!fn) return;
    e.preventDefault();
    fn(f, f.querySelector('[type="submit"]'));
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches('[data-buscar-en]')) {
      var q = t.value.trim().toLowerCase();
      document.querySelectorAll(t.dataset.buscarEn + ' [data-buscar]').forEach(function (it) { it.hidden = q && it.dataset.buscar.indexOf(q) < 0; });
      return;
    }
    if (t.closest('form')) S.sucio = true;
    var fs = t.closest('fieldset.fechas');
    if (fs) actualizarFechas(fs);
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    var fs = t.closest('fieldset.fechas');
    if (fs) {
      if (t.matches('[data-primero]')) sugerirEn(fs); else actualizarFechas(fs);
    }
    if (t.matches('[data-toggle="espera-prod"]')) {
      var c = t.closest('form').querySelector('[data-espera-prod]');
      c.hidden = !t.checked;
      if (t.checked) c.querySelector('input').focus();
    }
    if (t.closest('form')) S.sucio = true;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.modal) { S.modal = null; pintarCapas(); }
  });
  window.addEventListener('hashchange', function () {
    var r = ruta();
    if (r.parts[0] !== 'revisar') S.lote = null;
    else if (!S.lote && S.data) iniciarLote();
    S.modal = null; S.sucio = false;
    if (S.flash && S.flash.t && Date.now() - S.flash.t > 1500) S.flash = null;
    S.toast = null;
    render();
    window.scrollTo(0, 0);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !S.sucio && !S.modal && !S.ocupado && store.sesion()) recargar(true);
  });
  setInterval(function () {
    if (document.visibilityState === 'visible' && !S.sucio && !S.modal && !S.ocupado && !S.lote && store.sesion() && S.data) recargar(true);
  }, 60000);

  // ---------- Arranque ----------
  if (store.sesion()) recargar(); else { S.cargando = false; render(); }
  window.__bf = { S: S, store: store }; // ayuda para pruebas
})();

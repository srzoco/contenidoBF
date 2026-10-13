# Contenido Barquero — guía de instalación

App web para aprobar videos, carruseles y copys, llevar el calendario de IG y TikTok, el banco de piezas preaprobadas y las piezas en espera de mercancía. Funciona en celular y computadora y no necesita cuenta de Claude. Cuesta $0 (GitHub Pages + Supabase gratis).

**Tiempo total: ~35 minutos.** Hazlo en orden; cada paso termina con un ✅ para confirmar que quedó bien antes de seguir.

---

## Paso 1 · Subir la app a GitHub (10 min)

1. En github.com, toca **New repository**. Ponle de nombre `contenidoBF`, déjalo **Public** y toca **Create repository**.
2. Toca **uploading an existing file**. Arrastra **todos los archivos** de la carpeta descomprimida (no la carpeta) y toca **Commit changes**.
3. Ve a **Settings → Pages**. En *Branch* elige `main` y `/ (root)`, y toca **Save**.
4. Espera 1–2 minutos. Tu dirección será `https://srzoco.github.io/contenidoBF/`.

✅ **Checkpoint:** abres el link y ves la app con una franja amarilla que dice «Modo demo». Prueba los botones **Sara / Editora** de arriba para ver las dos vistas.

## Paso 2 · Crear la base de datos (10 min)

1. Entra a supabase.com, toca **Start your project** y entra con tu cuenta de GitHub.
2. Toca **New project**. Usa de nombre `contenido-barquero`, inventa una contraseña de base de datos (guárdala), elige la región **East US** y el plan **Free**.
3. Cuando termine de crearse, ve al menú **SQL Editor → New query**. Pega **todo** el archivo `supabase.sql` y toca **Run**.

✅ **Checkpoint:** dice *Success*. En **Table Editor** ves 4 tablas: `ajustes`, `equipo`, `eventos` y `piezas`.

## Paso 3 · Crear las dos usuarias y cerrar la puerta (5 min)

1. Ve a **Authentication → Users → Add user → Create new user**. Pon tu correo y una contraseña, y marca **Auto Confirm User**. Repite con el correo de tu editora.
2. Ve a **Authentication → Sign In / Providers** (en algunas versiones está en *Settings*) y **desactiva «Allow new users to sign up»**. Así nadie más puede crearse una cuenta.

✅ **Checkpoint:** ves 2 usuarios en la lista y el registro está desactivado.

## Paso 4 · Conectar la app con la base de datos (3 min)

1. En Supabase, ve a **Project Settings → API** (puede llamarse *Data API* o *API Keys*). Copia dos datos:
   - **Project URL**, por ejemplo `https://abcdxyz.supabase.co`
   - la clave **publishable** (`sb_publishable_…`) o la **anon public**. Nunca uses la *secret* ni la *service_role*.
2. En GitHub, abre el archivo `config.js`, toca el lápiz ✏️, pega los dos datos entre las comillas y toca **Commit changes**.

✅ **Checkpoint:** en 1–2 minutos el link ya no muestra la franja amarilla y pide correo y contraseña. Entras y te pide tu nombre, tu papel («Apruebo») y tu WhatsApp.

## Paso 5 · Probar desde Venezuela (5 min) ← el más importante

1. Mándale a tu editora el link, su correo y su contraseña. Que entre desde su celular y llene su perfil («Edito y publico» + su WhatsApp).
2. Que cree una pieza de prueba con **+ Nueva**, la abra y toque **Enviar a revisión → Avisar por WhatsApp**.

✅ **Checkpoint:** te llega el WhatsApp y la pieza aparece en tus **Pendientes**.
❗ Si a ella no le carga la app, no sigas: avísame y la pasamos a otra base de datos. Lo demás no cambia.

3. Pónganla como app en el celular:
   - **Android:** menú ⋮ → *Agregar a pantalla principal*.
   - **iPhone:** botón Compartir → *Agregar a inicio*.

---

## Cómo se usa (reglas del equipo)

**La regla que hace que funcione:** toda aprobación, corrección y fecha se marca **en la app**. WhatsApp queda solo para el aviso y para mandar el archivo del video.

**Editora**
1. Graba → **+ Nueva** → llena título, tipo, plataformas y el brief (producto, gancho, objetivo).
2. Edita → abre la pieza → **Enviar a revisión** → **Avisar por WhatsApp** (en ese mismo chat manda el video).
3. Si vuelve con correcciones, marca cada una al corregirla y reenvía.
4. En **Pendientes** ve qué publicar hoy. Al publicar, marca la lista y pega el enlace del post.
5. A los 7 días, la app le pide anotar las vistas.

**Sara**
1. **Pendientes → Revisar todo**: pasas por todas las piezas seguidas con **Aprobar** o **Corregir** (con botones rápidos y el minuto exacto). Al final, un solo WhatsApp con el resumen.
2. En el copy puedes arreglar un detalle tú misma y aprobar, sin devolverlo.
3. Las fechas se sugieren solas según el cronograma de cada plataforma (**Instagram:** dom reel · lun carrusel · mar reel · mié solo historias · jue reel · vie carrusel · sáb nada. **TikTok:** todos los días, reel o carrusel) y con **mínimo 3 días** entre IG y TikTok para el mismo contenido. Tú decides cuál plataforma va primero. Al publicar en TikTok, la lista recuerda compartirlo también en historias.
4. **Huecos**: si un día del cronograma no tiene pieza, la app te avisa y te deja llenarlo con algo del **banco** (piezas aprobadas sin fecha). Ese banco es lo que te cubre los días que no puedes revisar.
5. **En espera de mercancía**: la pieza no se publica hasta que marques **Llegó**.
6. Una vez por semana, entra a **Métricas** (10 min): rondas de corrección, lo que más se corrige y qué piezas tienen más vistas. Sirve para darle feedback concreto a tu editora.

**Grabación semanal (las dos)**
- Cada semana la app propone sola la grabación (por defecto **martes 11 a. m.**, se cambia en Ajustes). Nadie tiene que acordarse de escribir.
- Aparece arriba en **Pendientes**: cada una toca **Confirmar** o **Proponer otro día** (con motivo opcional). Si alguien reagenda, la otra tiene que confirmar de nuevo, y el cambio queda en el historial.
- Si falta confirmar y quedan menos de 24 h, la tarjeta se pone roja.
- En el detalle se anotan los **títulos de los videos a grabar** y se suman ideas del banco. Al grabar cada uno, se toca **Grabado ✓** y pasa a edición.
- Después de la hora, la app pregunta **¿Se grabó?** Si no, pide el motivo. Las últimas semanas quedan a la vista (✅ / ❌).

**Flujo de cada pieza**
- **Reel:** Video → Copy y fechas → Programada → Publicada.
- **Carrusel:** Texto → Diseño → Copy y fechas → Programada → Publicada. El texto se aprueba **antes** de diseñar, porque ahí se ahorran la mayoría de las vueltas.
- Cada paso queda en el **Historial** de la pieza, con quién y cuándo. El historial no se puede editar ni borrar.

---

## Mantenimiento

- **Si ya habías instalado la versión anterior:** vuelve a pegar y ejecutar `supabase.sql` completo en el SQL Editor (no borra nada, solo agrega lo de grabación) y reemplaza en GitHub todos los archivos menos `config.js`. Luego entra a **Ajustes → Cronograma** y toca **Guardar** para dejar el cronograma nuevo (IG y TikTok por separado).

- **Cronograma y regla de días:** se cambian en **Ajustes** (solo quien aprueba).
- **Pausa del plan gratis:** si pasan varios días sin que nadie use la app, Supabase puede pausar el proyecto. Se reactiva entrando a supabase.com y tocando **Restore**. Con uso diario no pasa.
- **Actualizar la app:** se reemplazan los archivos en GitHub **menos `config.js`**.
- **Respaldo:** en Supabase, Table Editor → cada tabla → *Export to CSV*.
- **Contraseña olvidada:** por ahora se resuelve desde Supabase (avísame y lo hacemos juntas).

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html`, `app.js`, `styles.css` | La app |
| `logic.js` | Reglas: flujo de aprobación, sugerencia de fechas, huecos y métricas |
| `store.js` | Conexión con la base de datos (o modo demo) |
| `demo.js` | Datos de ejemplo del modo demo |
| `config.js` | **Lo único que se edita**: los dos datos de Supabase |
| `supabase.sql` | Crea la base de datos y su seguridad |
| `manifest.webmanifest`, `icon-*.png` | Para instalarla como app en el celular |

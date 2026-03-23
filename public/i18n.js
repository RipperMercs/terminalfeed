(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Language detection from URL path
  // ---------------------------------------------------------------------------
  var SUPPORTED = ['es', 'pt', 'de'];
  var path = window.location.pathname;
  var langMatch = path.match(/^\/(es|pt|de)\//);
  var lang = langMatch ? langMatch[1] : 'en';

  // ---------------------------------------------------------------------------
  // Translations
  // ---------------------------------------------------------------------------
  var I18N = {
    // =========================================================================
    // SPANISH
    // =========================================================================
    es: {
      common: {
        back_terminal: '\u2190 volver a la terminal',
        back_tools: '\u2190 volver a herramientas',
        runs_locally: 'se ejecuta localmente',
        copy: 'Copiar',
        copied: '\u00a1Copiado!',
        clear: 'Limpiar',
        home: 'Inicio',
        live: 'En vivo',
        tools: 'Herramientas',
        agents: 'Agentes',
        radio: 'Radio',
        privacy_badge: '100% del lado del cliente \u2014 tus datos nunca salen de tu navegador',
        footer_copy: '\u00a9 2026 TerminalFeed.io'
      },

      'tools-index': {
        _title: 'Herramientas para Desarrolladores \u2014 TerminalFeed',
        _description: 'Herramientas online gratuitas para desarrolladores que funcionan 100% en tu navegador. Formateador JSON, codificador Base64, generador UUID, conversor de timestamps, decodificador JWT, probador regex y m\u00e1s.',
        tools_heading: '>_ HERRAMIENTAS PARA DESARROLLADORES',
        tools_subtitle: 'Todas las herramientas se ejecutan localmente en tu navegador \u2014 nada sale de tu m\u00e1quina.',
        tool_json_name: 'Formateador JSON',
        tool_json_desc: 'Formatear, validar y minificar JSON',
        tool_base64_name: 'Base64 Codificar/Decodificar',
        tool_base64_desc: 'Codificar y decodificar cadenas Base64',
        tool_uuid_name: 'Generador UUID',
        tool_uuid_desc: 'Generar UUIDs v4 al instante',
        tool_timestamp_name: 'Conversor de Timestamps',
        tool_timestamp_desc: 'Convertir timestamps Unix \u2194 fechas',
        tool_jwt_name: 'Decodificador JWT',
        tool_jwt_desc: 'Decodificar e inspeccionar tokens JWT',
        tool_regex_name: 'Probador Regex',
        tool_regex_desc: 'Probar patrones regex con coincidencia en vivo'
      },

      'tools-json': {
        _title: 'Formateador y Validador JSON \u2014 TerminalFeed Tools',
        _description: 'Formateador, validador y minificador JSON online y gratuito. Resaltado de sintaxis, detecci\u00f3n de errores con n\u00fameros de l\u00ednea, atajos de teclado. Se ejecuta completamente en tu navegador \u2014 no se env\u00edan datos a ning\u00fan servidor.',
        json_heading: '>_ FORMATEADOR JSON',
        format: 'Formatear',
        minify: 'Minificar',
        validate: 'Validar',
        placeholder: 'Pega tu JSON aqu\u00ed...',
        output_label: 'Salida',
        valid: 'v\u00e1lido',
        invalid: 'inv\u00e1lido',
        characters: 'caracteres',
        lines: 'l\u00edneas',
        depth: 'profundidad',
        no_input: 'No se proporcion\u00f3 entrada.',
        shortcut_hint: 'Ctrl+Enter para formatear',
        seo_heading: 'Formateador y Validador JSON \u2014 Formatear JSON Online',
        seo_content: '<h2>Formateador y Validador JSON \u2014 Formatear JSON Online</h2>' +
          '<p>JSON (JavaScript Object Notation) es el formato de intercambio de datos m\u00e1s utilizado en la web. Las APIs lo devuelven, los archivos de configuraci\u00f3n dependen de \u00e9l y las bases de datos lo almacenan. Sin embargo, el JSON sin formato \u2014 especialmente las respuestas minificadas de APIs en producci\u00f3n \u2014 es pr\u00e1cticamente imposible de leer sin un formato adecuado. Un buen formateador convierte un bloque de texto en un documento estructurado e indentado que realmente puedes comprender.</p>' +
          '<h3>C\u00f3mo usar esta herramienta</h3>' +
          '<p>Pega tu JSON en el \u00e1rea de entrada y haz clic en <strong>Formatear</strong> (o presiona <code>Ctrl+Enter</code>) para mostrarlo con indentaci\u00f3n de dos espacios y resaltado de sintaxis completo. Haz clic en <strong>Minificar</strong> para comprimir el JSON formateado en una sola l\u00ednea, eliminando todos los espacios en blanco innecesarios \u2014 \u00fatil para reducir el tama\u00f1o del payload antes de enviar datos por la red. Haz clic en <strong>Validar</strong> para comprobar si tu JSON es sint\u00e1cticamente correcto y ver un resumen de su estructura incluyendo tipo, n\u00famero de entradas, profundidad de anidamiento y tama\u00f1o minificado. Usa <strong>Copiar</strong> para copiar la salida al portapapeles y <strong>Limpiar</strong> para restablecer ambos campos.</p>' +
          '<h3>Casos de uso comunes de JSON</h3>' +
          '<p>Las APIs REST y GraphQL devuelven JSON que necesita formato para depuraci\u00f3n e inspecci\u00f3n. Herramientas como package.json, tsconfig.json y .eslintrc usan JSON para definir la configuraci\u00f3n del proyecto. JSON es el formato est\u00e1ndar para transferir datos estructurados entre servicios, microservicios y aplicaciones front-end. Bases de datos NoSQL como MongoDB y CouchDB almacenan registros como documentos JSON. Los frameworks de logging estructurado generan logs en JSON para facilitar su an\u00e1lisis con herramientas como Elasticsearch y Datadog.</p>' +
          '<h3>Sintaxis b\u00e1sica de JSON</h3>' +
          '<p>Un valor JSON debe ser de uno de estos seis tipos: <strong>objeto</strong> (<code>{}</code>), <strong>array</strong> (<code>[]</code>), <strong>string</strong> (entre comillas dobles), <strong>n\u00famero</strong>, <strong>booleano</strong> (<code>true</code> o <code>false</code>), o <strong>null</strong>. Los objetos contienen pares clave-valor separados por comas donde las claves deben ser cadenas entre comillas dobles. JSON no admite comentarios, comas finales ni cadenas con comillas simples \u2014 estas son las fuentes m\u00e1s comunes de errores de an\u00e1lisis.</p>' +
          '<h3>Errores comunes de JSON y c\u00f3mo corregirlos</h3>' +
          '<p><strong>Comas finales:</strong> Una coma despu\u00e9s del \u00faltimo elemento de un objeto o array es inv\u00e1lida en JSON, aunque JavaScript lo permita. Elimina la coma final o a\u00f1ade otra entrada despu\u00e9s.</p>' +
          '<p><strong>Comillas simples:</strong> JSON requiere comillas dobles alrededor de cadenas y claves. Reemplaza todas las comillas simples por comillas dobles.</p>' +
          '<p><strong>Claves sin comillas:</strong> A diferencia de los objetos JavaScript, las claves JSON siempre deben estar entre comillas dobles. <code>{name: "value"}</code> es inv\u00e1lido \u2014 debe ser <code>{"name": "value"}</code>.</p>' +
          '<p><strong>Caracteres especiales:</strong> Los saltos de l\u00ednea, tabulaciones y barras invertidas dentro de cadenas deben escaparse como <code>\\n</code>, <code>\\t</code> y <code>\\\\</code> respectivamente.</p>' +
          '<h3>Privacidad y rendimiento</h3>' +
          '<p>Este formateador y validador JSON se ejecuta 100% en tu navegador. No se env\u00edan datos a ning\u00fan servidor. Tu JSON nunca sale de tu m\u00e1quina, lo que lo hace seguro para formatear payloads sensibles como tokens de autenticaci\u00f3n, respuestas de APIs privadas y archivos de configuraci\u00f3n internos. El resaltado de sintaxis y la validaci\u00f3n se realizan instant\u00e1neamente usando el parser JSON nativo del navegador.</p>'
      },

      'tools-base64': {
        _title: 'Base64 Codificar y Decodificar \u2014 TerminalFeed Tools',
        _description: 'Codifica y decodifica cadenas Base64 instant\u00e1neamente en tu navegador. Compatible con Unicode/UTF-8 completo. Ning\u00fan dato sale de tu m\u00e1quina.',
        base64_heading: '>_ BASE64',
        encode: 'Codificar \u2192',
        decode: '\u2190 Decodificar',
        input_label: 'Entrada',
        output_label: 'Salida',
        input_placeholder: 'Escribe o pega texto aqu\u00ed...',
        output_placeholder: 'El resultado aparece aqu\u00ed...',
        copy_output: 'Copiar Salida',
        live_mode: 'Modo en vivo (codificar/decodificar mientras escribes)',
        chars: 'caracteres',
        seo_content: '<h2>Codificador y Decodificador Base64 \u2014 Convertir Base64 Online</h2>' +
          '<h3>\u00bfQu\u00e9 es la codificaci\u00f3n Base64?</h3>' +
          '<p>Base64 es un esquema de codificaci\u00f3n de binario a texto que convierte datos binarios en una secuencia de caracteres ASCII imprimibles. Fue dise\u00f1ado originalmente para permitir la transmisi\u00f3n de datos binarios a trav\u00e9s de canales que solo admiten texto de manera confiable, como el correo electr\u00f3nico (MIME) y el HTTP temprano. El nombre "Base64" se refiere a que la codificaci\u00f3n utiliza un alfabeto de 64 caracteres: las letras may\u00fasculas <code>A-Z</code>, min\u00fasculas <code>a-z</code>, d\u00edgitos <code>0-9</code> y dos s\u00edmbolos adicionales <code>+</code> y <code>/</code>. El car\u00e1cter <code>=</code> se usa como relleno cuando la longitud de entrada no es m\u00faltiplo de tres bytes.</p>' +
          '<h3>C\u00f3mo funciona Base64</h3>' +
          '<p>La codificaci\u00f3n Base64 toma cada tres bytes (24 bits) de datos de entrada y los divide en cuatro grupos de seis bits cada uno. Cada grupo de seis bits se mapea a uno de los 64 caracteres del alfabeto Base64. Como tres bytes de entrada binaria se convierten en cuatro bytes de salida de texto, los datos codificados en Base64 siempre son aproximadamente un 33% m\u00e1s grandes que el original.</p>' +
          '<h3>Casos de uso comunes</h3>' +
          '<p>La codificaci\u00f3n Base64 aparece en todo el desarrollo web. Se usa en <strong>URLs de datos</strong> para incrustar im\u00e1genes, fuentes y otros recursos directamente en HTML o CSS. Los sistemas de correo electr\u00f3nico usan Base64 como parte del est\u00e1ndar <strong>MIME</strong> para codificar archivos adjuntos. Las cabeceras de <strong>autenticaci\u00f3n HTTP Basic</strong> transmiten credenciales en formato <code>usuario:contrase\u00f1a</code> codificado como Base64. Los JSON Web Tokens (<strong>JWT</strong>) codifican sus segmentos de cabecera y payload usando una variante de Base64 segura para URLs.</p>' +
          '<h3>C\u00f3mo usar esta herramienta</h3>' +
          '<p>Pega o escribe tu texto en el campo de entrada de la izquierda. Haz clic en <strong>Codificar</strong> para convertir texto plano a Base64, o en <strong>Decodificar</strong> para convertir una cadena Base64 de vuelta a texto plano. Con el <strong>modo en vivo</strong> activado, la salida se actualiza autom\u00e1ticamente mientras escribes. Haz clic en <strong>Copiar Salida</strong> para copiar el resultado al portapapeles.</p>' +
          '<h3>Compatibilidad con Unicode y UTF-8</h3>' +
          '<p>A diferencia de muchas herramientas Base64 que solo manejan ASCII, este codificador es totalmente compatible con <strong>UTF-8 y Unicode</strong>, incluyendo emojis, caracteres CJK y texto con acentos. La entrada se codifica primero en bytes UTF-8 antes de la conversi\u00f3n Base64, por lo que los caracteres multibyte se manejan correctamente en ambas direcciones.</p>' +
          '<h3>Privacidad y seguridad</h3>' +
          '<p>Esta herramienta se ejecuta <strong>100% del lado del cliente</strong> en tu navegador. No se transmiten datos a ning\u00fan servidor. Tu entrada nunca sale de tu m\u00e1quina, lo que la hace segura para codificar o decodificar cadenas sensibles como claves API, tokens y credenciales.</p>'
      },

      'tools-uuid': {
        _title: 'Generador UUID \u2014 TerminalFeed Tools',
        _description: 'Genera UUIDs aleatorios (v4) instant\u00e1neamente en tu navegador. Generaci\u00f3n masiva, copiar con un clic, opciones de may\u00fasculas y guiones. Ning\u00fan dato sale de tu m\u00e1quina.',
        uuid_heading: '>_ GENERADOR UUID',
        generate: 'Generar',
        copy_all: 'Copiar Todo',
        uppercase: 'May\u00fasculas',
        no_hyphens: 'Sin guiones',
        bulk_label: 'UUIDs',
        bulk_generate: 'Generar en Masa',
        click_to_copy: 'clic para copiar',
        generated_count: 'Generados en esta sesi\u00f3n',
        seo_content: '<h2>Generador UUID \u2014 Generar UUIDs Online</h2>' +
          '<h3>\u00bfQu\u00e9 es un UUID?</h3>' +
          '<p>Un UUID (Identificador \u00danico Universal) es un valor de 128 bits utilizado para identificar informaci\u00f3n de forma \u00fanica en sistemas inform\u00e1ticos sin necesidad de una autoridad de registro central. Los UUIDs tambi\u00e9n se conocen como GUIDs (Identificadores Globalmente \u00danicos) en ecosistemas Microsoft. El formato est\u00e1ndar es una cadena hexadecimal de 32 caracteres mostrada en cinco grupos separados por guiones con el patr\u00f3n <code>8-4-4-4-12</code>, por ejemplo: <code>550e8400-e29b-41d4-a716-446655440000</code>. Los UUIDs est\u00e1n definidos por el RFC 4122 y son ampliamente adoptados en bases de datos, APIs, sistemas distribuidos y desarrollo de software.</p>' +
          '<h3>Versiones de UUID explicadas</h3>' +
          '<p>Los UUID <strong>Versi\u00f3n 1 (v1)</strong> se generan a partir de una marca de tiempo y la direcci\u00f3n MAC de la m\u00e1quina. Los UUID <strong>Versi\u00f3n 4 (v4)</strong> se generan usando n\u00fameros aleatorios o pseudoaleatorios, lo que los convierte en la versi\u00f3n m\u00e1s utilizada para aplicaciones de prop\u00f3sito general. Los UUID <strong>Versi\u00f3n 5 (v5)</strong> se generan mediante el hash de un identificador de espacio de nombres y un nombre usando SHA-1, produciendo un resultado determin\u00edstico.</p>' +
          '<h3>Esta herramienta genera UUIDs v4</h3>' +
          '<p>Este generador crea <strong>UUIDs versi\u00f3n 4</strong> usando la API <code>crypto.randomUUID()</code> integrada en tu navegador, que produce valores aleatorios criptogr\u00e1ficamente fuertes. Cada UUID generado es estad\u00edsticamente \u00fanico. La probabilidad de generar dos UUIDs v4 id\u00e9nticos es astron\u00f3micamente baja.</p>' +
          '<h3>Casos de uso comunes</h3>' +
          '<p>Los UUIDs se utilizan como <strong>claves primarias de bases de datos</strong> en sistemas como PostgreSQL, MySQL y MongoDB. Sirven como <strong>identificadores de sesi\u00f3n</strong> en aplicaciones web. En <strong>sistemas distribuidos</strong> y arquitecturas de microservicios, los UUIDs permiten que m\u00faltiples nodos generen identificadores \u00fanicos de forma independiente. Tambi\u00e9n se usan para IDs de solicitudes API, nombrado de archivos y deduplicaci\u00f3n en colas de mensajes.</p>' +
          '<h3>C\u00f3mo usar esta herramienta</h3>' +
          '<p>Haz clic en <strong>Generar</strong> para crear un UUID \u00fanico, o haz clic en el UUID mostrado para copiarlo al portapapeles. Usa la opci\u00f3n <strong>May\u00fasculas</strong> para mostrar el UUID en caracteres hexadecimales en may\u00fasculas, o <strong>Sin guiones</strong> para producir una cadena compacta de 32 caracteres. Para generaci\u00f3n masiva, ingresa una cantidad (hasta 500) en la secci\u00f3n de generaci\u00f3n en masa y haz clic en <strong>Generar en Masa</strong>.</p>' +
          '<h3>Privacidad y seguridad</h3>' +
          '<p>Esta herramienta se ejecuta <strong>100% del lado del cliente</strong> en tu navegador usando la API Web Crypto. Ning\u00fan UUID se env\u00eda a ning\u00fan servidor ni se almacena. La generaci\u00f3n se realiza completamente en tu dispositivo con aleatoriedad criptogr\u00e1ficamente segura.</p>'
      },

      'tools-timestamp': {
        _title: 'Conversor de Timestamps Unix \u2014 TerminalFeed Tools',
        _description: 'Convierte timestamps Unix a fechas legibles y viceversa. Reloj en vivo, tiempo relativo, ISO 8601, milisegundos. Se ejecuta completamente en tu navegador.',
        timestamp_heading: '>_ CONVERSOR DE TIMESTAMPS',
        current_unix: 'Timestamp Unix Actual',
        to_human: 'Timestamp \u2192 Fecha Legible',
        to_timestamp: 'Fecha \u2192 Timestamp',
        now: 'Ahora',
        plus_hour: '+1 hora',
        plus_day: '+1 d\u00eda',
        plus_week: '+1 semana',
        local_time: 'Hora Local',
        utc: 'UTC',
        iso: 'ISO 8601',
        relative: 'Relativo',
        seconds: 'Segundos',
        milliseconds: 'Milisegundos',
        date: 'Fecha',
        time: 'Hora',
        ts_input_label: 'Timestamp Unix (segundos o milisegundos)',
        seo_content: '<h2>Conversor de Timestamps Unix \u2014 Convertir Epoch Time Online</h2>' +
          '<h3>\u00bfQu\u00e9 es un timestamp Unix?</h3>' +
          '<p>Un timestamp Unix (tambi\u00e9n llamado tiempo Epoch o tiempo POSIX) es el n\u00famero de segundos que han transcurrido desde el <strong>1 de enero de 1970, 00:00:00 UTC</strong> \u2014 un momento conocido como la \u00e9poca Unix. Este \u00fanico entero representa un punto exacto en el tiempo sin dependencia de zonas horarias, reglas de horario de verano o formato de calendario. Por ejemplo, el timestamp <code>1700000000</code> corresponde al 14 de noviembre de 2023 a las 22:13:20 UTC.</p>' +
          '<h3>Por qu\u00e9 los desarrolladores usan tiempo Unix</h3>' +
          '<p>Los timestamps Unix son el est\u00e1ndar de facto para registrar el tiempo en sistemas de software. Son independientes del lenguaje \u2014 todos los lenguajes de programaci\u00f3n principales pueden leerlos y producirlos. Son independientes de la zona horaria, por lo que un timestamp generado en Tokio significa lo mismo cuando se consume en Nueva York. Ordenar eventos cronol\u00f3gicamente es una simple comparaci\u00f3n num\u00e9rica y calcular duraciones es una resta b\u00e1sica.</p>' +
          '<h3>Segundos vs. Milisegundos</h3>' +
          '<p>La mayor\u00eda de los sistemas Unix tradicionales y lenguajes como Python, PHP y C usan timestamps en <strong>segundos</strong>. JavaScript, Java y algunas APIs modernas usan <strong>milisegundos</strong>. Un timestamp en segundos tiene t\u00edpicamente 10 d\u00edgitos (ej. <code>1700000000</code>), mientras que uno en milisegundos tiene 13 d\u00edgitos (ej. <code>1700000000000</code>). Este conversor detecta autom\u00e1ticamente qu\u00e9 formato ingresas.</p>' +
          '<h3>C\u00f3mo usar esta herramienta</h3>' +
          '<p>Pega o escribe cualquier timestamp Unix en el conversor superior para ver la hora local correspondiente, UTC e ISO 8601 \u2014 junto con una etiqueta de tiempo relativo (ej. "hace 3 horas"). Usa los botones r\u00e1pidos para saltar a desplazamientos comunes como ahora, +1 hora, +1 d\u00eda o +1 semana. Para la direcci\u00f3n inversa, selecciona una fecha y hora en el conversor inferior para obtener el timestamp Unix en segundos y milisegundos.</p>' +
          '<h3>Manejo de zonas horarias</h3>' +
          '<p>Los timestamps Unix son inherentemente UTC. Cuando esta herramienta muestra "Hora Local", convierte el timestamp basado en UTC a la zona horaria local de tu navegador. La salida ISO 8601 siempre incluye el desplazamiento UTC para una comunicaci\u00f3n inequ\u00edvoca.</p>' +
          '<p>Este conversor se ejecuta <strong>100% del lado del cliente</strong> \u2014 no se env\u00edan datos a ning\u00fan servidor. Tus timestamps permanecen en tu navegador.</p>'
      },

      'tools-jwt': {
        _title: 'Decodificador JWT \u2014 TerminalFeed Tools',
        _description: 'Decodifica e inspecciona tokens JWT instant\u00e1neamente. Visualiza cabecera, payload y claims con verificaci\u00f3n de expiraci\u00f3n. Se ejecuta completamente en tu navegador \u2014 los tokens nunca salen de tu m\u00e1quina.',
        jwt_heading: '>_ DECODIFICADOR JWT',
        placeholder: 'Pega tu token JWT aqu\u00ed...',
        header: 'Cabecera',
        payload: 'Payload',
        signature: 'Firma',
        paste_jwt: 'Pegar Token JWT',
        expired: 'Expirado',
        valid: 'V\u00e1lido',
        algorithm: 'Algoritmo',
        issued_at: 'Emitido el',
        expires_at: 'Expira el',
        is_expired: '\u00bfExpirado?',
        yes: 'S\u00ed',
        no: 'No',
        warning: '\u26a0 Esta herramienta no verifica firmas. La decodificaci\u00f3n se realiza completamente en tu navegador \u2014 los tokens nunca salen de tu m\u00e1quina.',
        sig_note: 'La verificaci\u00f3n de firma requiere la clave secreta \u2014 esta herramienta solo decodifica.',
        seo_content: '<h2>Decodificador JWT \u2014 Decodificar JSON Web Tokens Online</h2>' +
          '<h3>\u00bfQu\u00e9 es un JWT?</h3>' +
          '<p>Un JSON Web Token (JWT, pronunciado "yot") es un formato de token compacto y seguro para URLs definido por el <strong>RFC 7519</strong>. Los JWTs permiten que los claims \u2014 datos sobre un usuario o sesi\u00f3n \u2014 se transmitan de forma segura entre partes como un objeto JSON. Son autocontenidos, lo que significa que el token mismo lleva toda la informaci\u00f3n necesaria para autenticar una solicitud sin consultar una base de datos o almac\u00e9n de sesiones.</p>' +
          '<h3>Estructura JWT: Header.Payload.Signature</h3>' +
          '<p>Cada JWT consta de tres partes separadas por puntos: <code>header.payload.signature</code>. Cada parte est\u00e1 codificada en Base64URL. La <strong>cabecera</strong> t\u00edpicamente contiene el algoritmo de firma (<code>alg</code>) y el tipo de token (<code>typ</code>). El <strong>payload</strong> contiene los claims \u2014 los datos reales que se transmiten. La <strong>firma</strong> se crea firmando la cabecera y el payload codificados con una clave secreta (HMAC) o una clave privada (RSA/ECDSA).</p>' +
          '<h3>D\u00f3nde se usan los JWTs</h3>' +
          '<p>Los JWTs se usan ampliamente en la pila de desarrollo moderna. En <strong>autenticaci\u00f3n de APIs</strong>, los clientes env\u00edan un JWT en la cabecera <code>Authorization: Bearer</code> con cada solicitud. <strong>OAuth 2.0</strong> y <strong>OpenID Connect</strong> usan JWTs como tokens de acceso y tokens de identidad. Los sistemas de <strong>Single Sign-On (SSO)</strong> emiten JWTs para que los usuarios se autentiquen una vez y accedan a m\u00faltiples servicios.</p>' +
          '<h3>Consideraciones de seguridad</h3>' +
          '<p><strong>Los JWTs est\u00e1n codificados, no cifrados.</strong> Cualquiera que tenga un JWT puede decodificar la cabecera y el payload \u2014 no se necesita clave secreta para leer el contenido. Esto significa que nunca debes poner informaci\u00f3n sensible en el payload de un JWT a menos que tambi\u00e9n apliques JWE (JSON Web Encryption).</p>' +
          '<h3>C\u00f3mo usar esta herramienta</h3>' +
          '<p>Pega cualquier JWT en el \u00e1rea de texto de arriba. El decodificador dividir\u00e1 instant\u00e1neamente el token en sus tres partes y mostrar\u00e1 la cabecera y el payload como JSON formateado con resaltado de sintaxis. Los claims basados en tiempo como <code>exp</code>, <code>iat</code> y <code>nbf</code> se convierten autom\u00e1ticamente a fechas legibles.</p>' +
          '<p>Este decodificador se ejecuta <strong>100% del lado del cliente</strong> en tu navegador. Tus tokens nunca se transmiten a ning\u00fan servidor.</p>'
      },

      'tools-regex': {
        _title: 'Probador Regex \u2014 TerminalFeed Tools',
        _description: 'Probador regex online gratuito con coincidencia en vivo, resaltado de grupos de captura y patrones r\u00e1pidos. Se ejecuta 100% en tu navegador \u2014 nada sale de tu m\u00e1quina.',
        regex_heading: '>_ PROBADOR REGEX',
        pattern_label: 'Patr\u00f3n',
        pattern_placeholder: 'introduce patr\u00f3n regex...',
        test_label: 'Cadena de prueba',
        test_placeholder: 'introduce cadena de prueba...',
        flags_global: 'g',
        flags_case: 'i',
        flags_multiline: 'm',
        flags_dotall: 's',
        flag_global_title: 'Global',
        flag_case_title: 'Sin distinci\u00f3n de may\u00fasculas/min\u00fasculas',
        flag_multiline_title: 'Multil\u00ednea',
        flag_dotall_title: 'DotAll',
        quick_patterns: 'Patrones r\u00e1pidos',
        matches: 'Coincidencias',
        matches_placeholder: 'las coincidencias aparecer\u00e1n aqu\u00ed...',
        match_details: 'Detalles de coincidencias',
        match_count: 'coincidencias',
        exec_time: 'ms',
        idle: 'inactivo',
        match_header_num: '#',
        match_header_index: '\u00cdndice',
        match_header_value: 'Valor',
        match_header_groups: 'Grupos',
        seo_content: '<h2>Probador Regex \u2014 Probar Expresiones Regulares Online</h2>' +
          '<p>Las expresiones regulares (regex) son secuencias de caracteres que definen patrones de b\u00fasqueda. Los desarrolladores, ingenieros de datos y administradores de sistemas usan regex para validar entrada, buscar y reemplazar texto, analizar archivos de log, extraer datos de cadenas y aplicar reglas de formato. A pesar de su potencia, las expresiones regulares pueden ser dif\u00edciles de escribir y depurar sin una herramienta de prueba en vivo.</p>' +
          '<h3>C\u00f3mo usar esta herramienta</h3>' +
          '<p>Introduce tu patr\u00f3n regex en el campo de patr\u00f3n en la parte superior de la p\u00e1gina. Activa los flags como <code>g</code> (global), <code>i</code> (sin distinci\u00f3n de may\u00fasculas/min\u00fasculas), <code>m</code> (multil\u00ednea) y <code>s</code> (dotall) para ajustar el comportamiento de coincidencia. Pega o escribe tu cadena de prueba en el \u00e1rea de texto inferior. Las coincidencias se resaltan instant\u00e1neamente mientras escribes. La tabla de detalles muestra el \u00edndice, valor y grupos capturados de cada coincidencia.</p>' +
          '<h3>Patrones regex comunes</h3>' +
          '<p>Email, URL, direcci\u00f3n IP, n\u00famero de tel\u00e9fono, fecha, color hexadecimal y c\u00f3digo postal son algunos de los patrones m\u00e1s utilizados. Usa los botones de patrones r\u00e1pidos para cargar patrones comunes con cadenas de prueba de ejemplo.</p>' +
          '<h3>Referencia r\u00e1pida de sintaxis regex</h3>' +
          '<p><strong>Clases de caracteres:</strong> <code>\\d</code> coincide con cualquier d\u00edgito (0-9). <code>\\w</code> coincide con cualquier car\u00e1cter de palabra. <code>\\s</code> coincide con cualquier espacio en blanco. Los corchetes definen conjuntos personalizados: <code>[aeiou]</code> coincide con cualquier vocal.</p>' +
          '<p><strong>Cuantificadores:</strong> <code>*</code> coincide cero o m\u00e1s veces. <code>+</code> coincide una o m\u00e1s veces. <code>?</code> coincide cero o una vez. <code>{n}</code> coincide exactamente n veces.</p>' +
          '<p><strong>Anclas:</strong> <code>^</code> coincide con el inicio de una l\u00ednea y <code>$</code> coincide con el final. <code>\\b</code> coincide con un l\u00edmite de palabra.</p>' +
          '<p><strong>Grupos y alternancia:</strong> Los par\u00e9ntesis <code>()</code> crean grupos de captura. Usa <code>|</code> para alternancia \u2014 por ejemplo, <code>(gato|perro)</code> coincide con "gato" o "perro".</p>' +
          '<h3>Privacidad y rendimiento</h3>' +
          '<p>Este probador regex se ejecuta 100% en tu navegador usando el motor RegExp de JavaScript. No se transmiten datos a ning\u00fan servidor. Tus patrones y cadenas de prueba nunca salen de tu m\u00e1quina.</p>'
      },

      'agent': {
        _title: 'Rastreador de Agentes IA \u2014 TerminalFeed',
        _description: 'Rastrea todos los principales agentes de IA en tiempo real. Estado en vivo, capacidades, precios y m\u00e1s para Claude, GPT, Gemini, Copilot, Devin y m\u00e1s de 30 agentes de IA.',
        agent_heading: '>_ RASTREADOR DE AGENTES IA',
        agent_subtitle: 'Directorio en tiempo real de agentes, modelos y plataformas de IA',
        filter_all: 'Todos',
        filter_coding: 'Programaci\u00f3n',
        filter_general: 'General',
        filter_research: 'Investigaci\u00f3n',
        filter_creative: 'Creativo',
        filter_autonomous: 'Aut\u00f3nomo',
        filter_search: 'B\u00fasqueda',
        filter_data: 'Datos',
        search_placeholder: 'Buscar agentes por nombre...',
        sort_by: 'Ordenar por:',
        sort_name: 'Nombre',
        sort_company: 'Empresa',
        sort_status: 'Estado',
        agents_tracked: 'Agentes Rastreados',
        operational_now: 'Operativos Ahora',
        categories: 'Categor\u00edas',
        last_status_check: '\u00daltima verificaci\u00f3n de estado',
        pricing_free: 'Gratis',
        pricing_freemium: 'Freemium',
        pricing_paid: 'De pago',
        pricing_enterprise: 'Empresarial',
        status_operational: 'Operativo',
        status_degraded: 'Degradado',
        status_down: 'Ca\u00eddo',
        status_unknown: 'Desconocido'
      },

      'radio': {
        _title: 'Terminal Radio \u2014 TerminalFeed',
        _description: 'Streams lo-fi, ambient y chill para programar y concentrarte. Radio por internet gratuita con est\u00e9tica de terminal. Groove Salad, Drone Zone, DEF CON Radio y m\u00e1s.',
        radio_heading: '>_ TERMINAL RADIO',
        radio_subtitle: 'ambient \u00b7 lo-fi \u00b7 downtempo \u00b7 concentraci\u00f3n',
        on_air: 'EN VIVO',
        now_playing: 'REPRODUCIENDO',
        play: 'Reproducir',
        pause: 'Pausa',
        vol: 'VOL',
        stations: 'ESTACIONES',
        featured_artist: 'ARTISTA DESTACADO',
        featured_desc: 'Paisajes sonoros atmosf\u00e9ricos y cinem\u00e1ticos que combinan texturas ambient y electr\u00f3nicas. Perfecto para sesiones de concentraci\u00f3n profunda y programaci\u00f3n nocturna.',
        stream_error: 'Stream no disponible \u2014 prueba con otra estaci\u00f3n',
        space_to_play: 'Espacio para reproducir / pausar',
        listen_on_spotify: '\u2192 Escuchar en Spotify',
        seo_content: '<h2>Terminal Radio \u2014 Radio por Internet Gratuita para Programar y Concentrarse</h2>' +
          '<p>Terminal Radio es una experiencia de radio por internet curada para desarrolladores, dise\u00f1adores y cualquier persona que necesite un fondo sonoro enfocado mientras trabaja. Dise\u00f1ado con la misma est\u00e9tica de terminal que el resto de TerminalFeed, re\u00fane algunos de los mejores streams ambient, lo-fi y downtempo de internet \u2014 todo en una interfaz oscura y sin distracciones.</p>' +
          '<p>Los streams presentados en Terminal Radio son proporcionados por SomaFM, una de las estaciones de radio independientes m\u00e1s longevas de internet. Fundada en 2000 por Rusty Hodge en San Francisco, SomaFM es completamente financiada por oyentes y totalmente libre de publicidad. Cada stream est\u00e1 curado manualmente por DJs reales que se preocupan profundamente por la m\u00fasica que reproducen.</p>' +
          '<p>La investigaci\u00f3n ha demostrado consistentemente que la m\u00fasica ambient y lo-fi puede mejorar la concentraci\u00f3n, reducir el estr\u00e9s y ayudar a mantener un estado de flujo durante el trabajo profundo. A diferencia de la m\u00fasica con voces prominentes o cambios impredecibles, los g\u00e9neros ambient y downtempo proporcionan una textura sonora consistente que apoya la concentraci\u00f3n sin exigir atenci\u00f3n.</p>' +
          '<p>Nuestra selecci\u00f3n de estaciones cubre una variedad de estados de \u00e1nimo y estilos. Groove Salad ofrece beats ambient y downtempo suaves. Drone Zone se adentra en territorio m\u00e1s profundo y atmosf\u00e9rico con paisajes sonoros ambient texturizados. DEF CON Radio trae ambient oscuro, industrial y synthwave con un toque hacker. Space Station Soma ofrece electr\u00f3nica espacial de tempo medio, mientras que Lush presenta voces sensuales y suaves.</p>' +
          '<p>Todo aqu\u00ed es gratuito. No hay anuncios en los streams de audio \u2014 esa es la promesa de SomaFM. La interfaz est\u00e1 dise\u00f1ada para no estorbar: elige una estaci\u00f3n, dale play y vuelve al trabajo.</p>'
      }
    },

    // =========================================================================
    // PORTUGUESE
    // =========================================================================
    pt: {
      common: {
        back_terminal: '\u2190 voltar ao terminal',
        back_tools: '\u2190 voltar \u00e0s ferramentas',
        runs_locally: 'executa localmente',
        copy: 'Copiar',
        copied: 'Copiado!',
        clear: 'Limpar',
        home: 'In\u00edcio',
        live: 'Ao vivo',
        tools: 'Ferramentas',
        agents: 'Agentes',
        radio: 'R\u00e1dio',
        privacy_badge: '100% no navegador \u2014 seus dados nunca saem do seu navegador',
        footer_copy: '\u00a9 2026 TerminalFeed.io'
      },

      'tools-index': {
        _title: 'Ferramentas para Desenvolvedores \u2014 TerminalFeed',
        _description: 'Ferramentas online gratuitas para desenvolvedores que rodam 100% no seu navegador. Formatador JSON, codificador Base64, gerador UUID, conversor de timestamps, decodificador JWT, testador regex e mais.',
        tools_heading: '>_ FERRAMENTAS PARA DESENVOLVEDORES',
        tools_subtitle: 'Todas as ferramentas rodam localmente no seu navegador \u2014 nada sai da sua m\u00e1quina.',
        tool_json_name: 'Formatador JSON',
        tool_json_desc: 'Formatar, validar e minificar JSON',
        tool_base64_name: 'Base64 Codificar/Decodificar',
        tool_base64_desc: 'Codificar e decodificar strings Base64',
        tool_uuid_name: 'Gerador UUID',
        tool_uuid_desc: 'Gerar UUIDs v4 instantaneamente',
        tool_timestamp_name: 'Conversor de Timestamps',
        tool_timestamp_desc: 'Converter timestamps Unix \u2194 datas',
        tool_jwt_name: 'Decodificador JWT',
        tool_jwt_desc: 'Decodificar e inspecionar tokens JWT',
        tool_regex_name: 'Testador Regex',
        tool_regex_desc: 'Testar padr\u00f5es regex com correspond\u00eancia ao vivo'
      },

      'tools-json': {
        _title: 'Formatador e Validador JSON \u2014 TerminalFeed Tools',
        _description: 'Formatador, validador e minificador JSON online e gratuito. Destaque de sintaxe, detec\u00e7\u00e3o de erros com n\u00fameros de linha, atalhos de teclado. Roda inteiramente no seu navegador \u2014 nenhum dado \u00e9 enviado a qualquer servidor.',
        json_heading: '>_ FORMATADOR JSON',
        format: 'Formatar',
        minify: 'Minificar',
        validate: 'Validar',
        placeholder: 'Cole seu JSON aqui...',
        output_label: 'Sa\u00edda',
        valid: 'v\u00e1lido',
        invalid: 'inv\u00e1lido',
        characters: 'caracteres',
        lines: 'linhas',
        depth: 'profundidade',
        no_input: 'Nenhuma entrada fornecida.',
        shortcut_hint: 'Ctrl+Enter para formatar',
        seo_heading: 'Formatador e Validador JSON \u2014 Formatar JSON Online',
        seo_content: '<h2>Formatador e Validador JSON \u2014 Formatar JSON Online</h2>' +
          '<p>JSON (JavaScript Object Notation) \u00e9 o formato de interc\u00e2mbio de dados mais utilizado na web. APIs o retornam, arquivos de configura\u00e7\u00e3o dependem dele e bancos de dados o armazenam. No entanto, JSON bruto \u2014 especialmente respostas minificadas de APIs em produ\u00e7\u00e3o \u2014 \u00e9 praticamente imposs\u00edvel de ler sem formata\u00e7\u00e3o adequada. Um bom formatador transforma um bloco de texto em um documento estruturado e indentado que voc\u00ea realmente consegue compreender.</p>' +
          '<h3>Como usar esta ferramenta</h3>' +
          '<p>Cole seu JSON na \u00e1rea de entrada e clique em <strong>Formatar</strong> (ou pressione <code>Ctrl+Enter</code>) para exibi-lo com indenta\u00e7\u00e3o de dois espa\u00e7os e destaque de sintaxe completo. Clique em <strong>Minificar</strong> para comprimir o JSON formatado em uma \u00fanica linha, removendo todos os espa\u00e7os desnecess\u00e1rios \u2014 \u00fatil para reduzir o tamanho do payload antes de enviar dados pela rede. Clique em <strong>Validar</strong> para verificar se seu JSON \u00e9 sintaticamente correto e ver um resumo da sua estrutura incluindo tipo, n\u00famero de entradas, profundidade de aninhamento e tamanho minificado. Use <strong>Copiar</strong> para copiar a sa\u00edda para a \u00e1rea de transfer\u00eancia e <strong>Limpar</strong> para redefinir ambos os campos.</p>' +
          '<h3>Casos de uso comuns de JSON</h3>' +
          '<p>APIs REST e GraphQL retornam JSON que precisa de formata\u00e7\u00e3o para depura\u00e7\u00e3o e inspe\u00e7\u00e3o. Ferramentas como package.json, tsconfig.json e .eslintrc usam JSON para definir configura\u00e7\u00f5es do projeto. JSON \u00e9 o formato padr\u00e3o para transferir dados estruturados entre servi\u00e7os, microsservi\u00e7os e aplica\u00e7\u00f5es front-end. Bancos de dados NoSQL como MongoDB e CouchDB armazenam registros como documentos JSON.</p>' +
          '<h3>Sintaxe b\u00e1sica do JSON</h3>' +
          '<p>Um valor JSON deve ser de um dos seis tipos: <strong>objeto</strong> (<code>{}</code>), <strong>array</strong> (<code>[]</code>), <strong>string</strong> (entre aspas duplas), <strong>n\u00famero</strong>, <strong>booleano</strong> (<code>true</code> ou <code>false</code>), ou <strong>null</strong>. JSON n\u00e3o suporta coment\u00e1rios, v\u00edrgulas finais ou strings com aspas simples \u2014 estas s\u00e3o as fontes mais comuns de erros de an\u00e1lise.</p>' +
          '<h3>Erros comuns de JSON e como corrigi-los</h3>' +
          '<p><strong>V\u00edrgulas finais:</strong> Uma v\u00edrgula ap\u00f3s o \u00faltimo item de um objeto ou array \u00e9 inv\u00e1lida em JSON. Remova a v\u00edrgula final ou adicione outra entrada depois dela.</p>' +
          '<p><strong>Aspas simples:</strong> JSON requer aspas duplas ao redor de strings e chaves. Substitua todas as aspas simples por aspas duplas.</p>' +
          '<p><strong>Chaves sem aspas:</strong> Diferente de objetos JavaScript, chaves JSON devem sempre estar entre aspas duplas.</p>' +
          '<h3>Privacidade e desempenho</h3>' +
          '<p>Este formatador e validador JSON roda 100% no seu navegador. Nenhum dado \u00e9 enviado a qualquer servidor. Seu JSON nunca sai da sua m\u00e1quina, tornando-o seguro para formatar payloads sens\u00edveis como tokens de autentica\u00e7\u00e3o, respostas de APIs privadas e arquivos de configura\u00e7\u00e3o internos.</p>'
      },

      'tools-base64': {
        _title: 'Base64 Codificar e Decodificar \u2014 TerminalFeed Tools',
        _description: 'Codifique e decodifique strings Base64 instantaneamente no seu navegador. Suporte completo a Unicode/UTF-8. Nenhum dado sai da sua m\u00e1quina.',
        base64_heading: '>_ BASE64',
        encode: 'Codificar \u2192',
        decode: '\u2190 Decodificar',
        input_label: 'Entrada',
        output_label: 'Sa\u00edda',
        input_placeholder: 'Digite ou cole texto aqui...',
        output_placeholder: 'O resultado aparece aqui...',
        copy_output: 'Copiar Sa\u00edda',
        live_mode: 'Modo ao vivo (codificar/decodificar enquanto digita)',
        chars: 'caracteres',
        seo_content: '<h2>Codificador e Decodificador Base64 \u2014 Converter Base64 Online</h2>' +
          '<h3>O que \u00e9 a codifica\u00e7\u00e3o Base64?</h3>' +
          '<p>Base64 \u00e9 um esquema de codifica\u00e7\u00e3o de bin\u00e1rio para texto que converte dados bin\u00e1rios em uma sequ\u00eancia de caracteres ASCII imprim\u00edveis. Foi originalmente projetado para permitir a transmiss\u00e3o de dados bin\u00e1rios atrav\u00e9s de canais que s\u00f3 suportam texto de forma confi\u00e1vel, como e-mail (MIME) e HTTP antigo. O nome "Base64" refere-se ao fato de que a codifica\u00e7\u00e3o usa um alfabeto de 64 caracteres: as letras mai\u00fasculas <code>A-Z</code>, min\u00fasculas <code>a-z</code>, d\u00edgitos <code>0-9</code> e dois s\u00edmbolos adicionais <code>+</code> e <code>/</code>.</p>' +
          '<h3>Como funciona o Base64</h3>' +
          '<p>A codifica\u00e7\u00e3o Base64 pega cada tr\u00eas bytes (24 bits) de dados de entrada e os divide em quatro grupos de seis bits cada. Cada grupo de seis bits mapeia para um dos 64 caracteres do alfabeto Base64. Como tr\u00eas bytes de entrada bin\u00e1ria se tornam quatro bytes de sa\u00edda de texto, dados codificados em Base64 s\u00e3o sempre aproximadamente 33% maiores que o original.</p>' +
          '<h3>Casos de uso comuns</h3>' +
          '<p>A codifica\u00e7\u00e3o Base64 aparece em todo o desenvolvimento web. \u00c9 usada em <strong>URLs de dados</strong> para incorporar imagens, fontes e outros recursos diretamente em HTML ou CSS. Sistemas de e-mail usam Base64 como parte do padr\u00e3o <strong>MIME</strong> para codificar anexos. Cabe\u00e7alhos de <strong>autentica\u00e7\u00e3o HTTP Basic</strong> transmitem credenciais no formato <code>usu\u00e1rio:senha</code> codificado como Base64.</p>' +
          '<h3>Como usar esta ferramenta</h3>' +
          '<p>Cole ou digite seu texto no campo de entrada \u00e0 esquerda. Clique em <strong>Codificar</strong> para converter texto simples em Base64, ou em <strong>Decodificar</strong> para converter uma string Base64 de volta para texto simples. Com o <strong>modo ao vivo</strong> ativado, a sa\u00edda \u00e9 atualizada automaticamente enquanto voc\u00ea digita.</p>' +
          '<h3>Suporte a Unicode e UTF-8</h3>' +
          '<p>Diferente de muitas ferramentas Base64 que s\u00f3 lidam com ASCII, este codificador suporta totalmente <strong>UTF-8 e Unicode</strong>, incluindo emojis, caracteres CJK e texto acentuado.</p>' +
          '<h3>Privacidade e seguran\u00e7a</h3>' +
          '<p>Esta ferramenta roda <strong>100% no navegador</strong>. Nenhum dado \u00e9 transmitido a qualquer servidor. Sua entrada nunca sai da sua m\u00e1quina, tornando-a segura para codificar ou decodificar strings sens\u00edveis como chaves de API, tokens e credenciais.</p>'
      },

      'tools-uuid': {
        _title: 'Gerador UUID \u2014 TerminalFeed Tools',
        _description: 'Gere UUIDs aleat\u00f3rios (v4) instantaneamente no seu navegador. Gera\u00e7\u00e3o em massa, copiar com um clique, op\u00e7\u00f5es de mai\u00fasculas e h\u00edfens. Nenhum dado sai da sua m\u00e1quina.',
        uuid_heading: '>_ GERADOR UUID',
        generate: 'Gerar',
        copy_all: 'Copiar Tudo',
        uppercase: 'Mai\u00fasculas',
        no_hyphens: 'Sem h\u00edfens',
        bulk_label: 'UUIDs',
        bulk_generate: 'Gerar em Massa',
        click_to_copy: 'clique para copiar',
        generated_count: 'Gerados nesta sess\u00e3o',
        seo_content: '<h2>Gerador UUID \u2014 Gerar UUIDs Online</h2>' +
          '<h3>O que \u00e9 um UUID?</h3>' +
          '<p>Um UUID (Identificador Universalmente \u00danico) \u00e9 um valor de 128 bits usado para identificar informa\u00e7\u00f5es de forma \u00fanica em sistemas computacionais sem necessidade de uma autoridade central de registro. Os UUIDs tamb\u00e9m s\u00e3o conhecidos como GUIDs (Identificadores Globalmente \u00danicos) em ecossistemas Microsoft. O formato padr\u00e3o \u00e9 uma string hexadecimal de 32 caracteres exibida em cinco grupos separados por h\u00edfens no padr\u00e3o <code>8-4-4-4-12</code>, por exemplo: <code>550e8400-e29b-41d4-a716-446655440000</code>.</p>' +
          '<h3>Vers\u00f5es de UUID explicadas</h3>' +
          '<p>UUIDs <strong>Vers\u00e3o 1 (v1)</strong> s\u00e3o gerados a partir de um timestamp e do endere\u00e7o MAC da m\u00e1quina. UUIDs <strong>Vers\u00e3o 4 (v4)</strong> s\u00e3o gerados usando n\u00fameros aleat\u00f3rios ou pseudoaleat\u00f3rios, tornando-os a vers\u00e3o mais utilizada para aplica\u00e7\u00f5es de prop\u00f3sito geral. UUIDs <strong>Vers\u00e3o 5 (v5)</strong> s\u00e3o gerados pelo hash de um identificador de namespace e um nome usando SHA-1.</p>' +
          '<h3>Esta ferramenta gera UUIDs v4</h3>' +
          '<p>Este gerador cria <strong>UUIDs vers\u00e3o 4</strong> usando a API <code>crypto.randomUUID()</code> integrada ao seu navegador, que produz valores aleat\u00f3rios criptograficamente fortes. Cada UUID gerado \u00e9 estatisticamente \u00fanico.</p>' +
          '<h3>Casos de uso comuns</h3>' +
          '<p>UUIDs s\u00e3o usados como <strong>chaves prim\u00e1rias de bancos de dados</strong> em sistemas como PostgreSQL, MySQL e MongoDB. Servem como <strong>identificadores de sess\u00e3o</strong> em aplica\u00e7\u00f5es web. Em <strong>sistemas distribu\u00eddos</strong> e arquiteturas de microsservi\u00e7os, UUIDs permitem que m\u00faltiplos n\u00f3s gerem identificadores \u00fanicos independentemente.</p>' +
          '<h3>Como usar esta ferramenta</h3>' +
          '<p>Clique em <strong>Gerar</strong> para criar um UUID \u00fanico, ou clique no UUID exibido para copi\u00e1-lo. Use a op\u00e7\u00e3o <strong>Mai\u00fasculas</strong> para exibir em caracteres hexadecimais mai\u00fasculos, ou <strong>Sem h\u00edfens</strong> para uma string compacta de 32 caracteres. Para gera\u00e7\u00e3o em massa, insira uma quantidade (at\u00e9 500) e clique em <strong>Gerar em Massa</strong>.</p>' +
          '<h3>Privacidade e seguran\u00e7a</h3>' +
          '<p>Esta ferramenta roda <strong>100% no navegador</strong> usando a API Web Crypto. Nenhum UUID \u00e9 enviado a qualquer servidor ou armazenado. A gera\u00e7\u00e3o acontece inteiramente no seu dispositivo com aleatoriedade criptograficamente segura.</p>'
      },

      'tools-timestamp': {
        _title: 'Conversor de Timestamps Unix \u2014 TerminalFeed Tools',
        _description: 'Converta timestamps Unix para datas leg\u00edveis e vice-versa. Rel\u00f3gio ao vivo, tempo relativo, ISO 8601, milissegundos. Roda inteiramente no seu navegador.',
        timestamp_heading: '>_ CONVERSOR DE TIMESTAMPS',
        current_unix: 'Timestamp Unix Atual',
        to_human: 'Timestamp \u2192 Data Leg\u00edvel',
        to_timestamp: 'Data \u2192 Timestamp',
        now: 'Agora',
        plus_hour: '+1 hora',
        plus_day: '+1 dia',
        plus_week: '+1 semana',
        local_time: 'Hora Local',
        utc: 'UTC',
        iso: 'ISO 8601',
        relative: 'Relativo',
        seconds: 'Segundos',
        milliseconds: 'Milissegundos',
        date: 'Data',
        time: 'Hora',
        ts_input_label: 'Timestamp Unix (segundos ou milissegundos)',
        seo_content: '<h2>Conversor de Timestamps Unix \u2014 Converter Epoch Time Online</h2>' +
          '<h3>O que \u00e9 um timestamp Unix?</h3>' +
          '<p>Um timestamp Unix (tamb\u00e9m chamado de tempo Epoch ou tempo POSIX) \u00e9 o n\u00famero de segundos que se passaram desde <strong>1 de janeiro de 1970, 00:00:00 UTC</strong> \u2014 um momento conhecido como a \u00e9poca Unix. Este \u00fanico inteiro representa um ponto exato no tempo sem depend\u00eancia de fusos hor\u00e1rios, regras de hor\u00e1rio de ver\u00e3o ou formata\u00e7\u00e3o de calend\u00e1rio.</p>' +
          '<h3>Por que desenvolvedores usam tempo Unix</h3>' +
          '<p>Timestamps Unix s\u00e3o o padr\u00e3o de facto para registrar tempo em sistemas de software. S\u00e3o independentes de linguagem \u2014 todas as principais linguagens de programa\u00e7\u00e3o podem l\u00ea-los e produzi-los. S\u00e3o independentes de fuso hor\u00e1rio, ent\u00e3o um timestamp gerado em T\u00f3quio significa a mesma coisa quando consumido em Nova York.</p>' +
          '<h3>Segundos vs. Milissegundos</h3>' +
          '<p>A maioria dos sistemas Unix tradicionais e linguagens como Python, PHP e C usam timestamps em <strong>segundos</strong>. JavaScript, Java e algumas APIs modernas usam <strong>milissegundos</strong>. Um timestamp em segundos tem tipicamente 10 d\u00edgitos, enquanto um em milissegundos tem 13 d\u00edgitos. Este conversor detecta automaticamente qual formato voc\u00ea insere.</p>' +
          '<h3>Como usar esta ferramenta</h3>' +
          '<p>Cole ou digite qualquer timestamp Unix no conversor superior para ver a hora local correspondente, UTC e ISO 8601 \u2014 junto com um r\u00f3tulo de tempo relativo. Use os bot\u00f5es r\u00e1pidos para pular para deslocamentos comuns. Para a dire\u00e7\u00e3o inversa, selecione uma data e hora no conversor inferior para obter o timestamp Unix em segundos e milissegundos.</p>' +
          '<p>Este conversor roda <strong>100% no navegador</strong> \u2014 nenhum dado \u00e9 enviado a qualquer servidor.</p>'
      },

      'tools-jwt': {
        _title: 'Decodificador JWT \u2014 TerminalFeed Tools',
        _description: 'Decodifique e inspecione tokens JWT instantaneamente. Visualize cabe\u00e7alho, payload e claims com verifica\u00e7\u00e3o de expira\u00e7\u00e3o. Roda inteiramente no seu navegador \u2014 os tokens nunca saem da sua m\u00e1quina.',
        jwt_heading: '>_ DECODIFICADOR JWT',
        placeholder: 'Cole seu token JWT aqui...',
        header: 'Cabe\u00e7alho',
        payload: 'Payload',
        signature: 'Assinatura',
        paste_jwt: 'Colar Token JWT',
        expired: 'Expirado',
        valid: 'V\u00e1lido',
        algorithm: 'Algoritmo',
        issued_at: 'Emitido em',
        expires_at: 'Expira em',
        is_expired: 'Expirado?',
        yes: 'Sim',
        no: 'N\u00e3o',
        warning: '\u26a0 Esta ferramenta n\u00e3o verifica assinaturas. A decodifica\u00e7\u00e3o acontece inteiramente no seu navegador \u2014 os tokens nunca saem da sua m\u00e1quina.',
        sig_note: 'A verifica\u00e7\u00e3o de assinatura requer a chave secreta \u2014 esta ferramenta apenas decodifica.',
        seo_content: '<h2>Decodificador JWT \u2014 Decodificar JSON Web Tokens Online</h2>' +
          '<h3>O que \u00e9 um JWT?</h3>' +
          '<p>Um JSON Web Token (JWT) \u00e9 um formato de token compacto e seguro para URLs definido pelo <strong>RFC 7519</strong>. JWTs permitem que claims \u2014 informa\u00e7\u00f5es sobre um usu\u00e1rio ou sess\u00e3o \u2014 sejam transmitidos de forma segura entre partes como um objeto JSON. S\u00e3o autocontidos, o que significa que o pr\u00f3prio token carrega todas as informa\u00e7\u00f5es necess\u00e1rias para autenticar uma solicita\u00e7\u00e3o.</p>' +
          '<h3>Estrutura JWT: Header.Payload.Signature</h3>' +
          '<p>Todo JWT consiste em tr\u00eas partes separadas por pontos: <code>header.payload.signature</code>. Cada parte \u00e9 codificada em Base64URL. O <strong>cabe\u00e7alho</strong> tipicamente cont\u00e9m o algoritmo de assinatura (<code>alg</code>) e o tipo de token (<code>typ</code>). O <strong>payload</strong> cont\u00e9m os claims. A <strong>assinatura</strong> \u00e9 criada assinando o cabe\u00e7alho e payload codificados com uma chave secreta (HMAC) ou chave privada (RSA/ECDSA).</p>' +
          '<h3>Onde JWTs s\u00e3o usados</h3>' +
          '<p>JWTs s\u00e3o amplamente usados na pilha de desenvolvimento moderna. Na <strong>autentica\u00e7\u00e3o de APIs</strong>, clientes enviam um JWT no cabe\u00e7alho <code>Authorization: Bearer</code>. <strong>OAuth 2.0</strong> e <strong>OpenID Connect</strong> usam JWTs como tokens de acesso e identidade. Sistemas de <strong>Single Sign-On (SSO)</strong> emitem JWTs para que usu\u00e1rios se autentiquem uma vez e acessem m\u00faltiplos servi\u00e7os.</p>' +
          '<h3>Considera\u00e7\u00f5es de seguran\u00e7a</h3>' +
          '<p><strong>JWTs s\u00e3o codificados, n\u00e3o criptografados.</strong> Qualquer pessoa com um JWT pode decodificar o cabe\u00e7alho e o payload. Nunca coloque informa\u00e7\u00f5es sens\u00edveis no payload de um JWT a menos que tamb\u00e9m aplique JWE (JSON Web Encryption).</p>' +
          '<h3>Como usar esta ferramenta</h3>' +
          '<p>Cole qualquer JWT na \u00e1rea de texto acima. O decodificador dividir\u00e1 instantaneamente o token em suas tr\u00eas partes e exibir\u00e1 o cabe\u00e7alho e payload como JSON formatado com destaque de sintaxe.</p>' +
          '<p>Este decodificador roda <strong>100% no navegador</strong>. Seus tokens nunca s\u00e3o transmitidos a qualquer servidor.</p>'
      },

      'tools-regex': {
        _title: 'Testador Regex \u2014 TerminalFeed Tools',
        _description: 'Testador regex online gratuito com correspond\u00eancia ao vivo, destaque de grupos de captura e padr\u00f5es r\u00e1pidos. Roda 100% no seu navegador \u2014 nada sai da sua m\u00e1quina.',
        regex_heading: '>_ TESTADOR REGEX',
        pattern_label: 'Padr\u00e3o',
        pattern_placeholder: 'insira padr\u00e3o regex...',
        test_label: 'String de teste',
        test_placeholder: 'insira string de teste...',
        flags_global: 'g',
        flags_case: 'i',
        flags_multiline: 'm',
        flags_dotall: 's',
        flag_global_title: 'Global',
        flag_case_title: 'Sem distin\u00e7\u00e3o de mai\u00fasculas/min\u00fasculas',
        flag_multiline_title: 'Multilinha',
        flag_dotall_title: 'DotAll',
        quick_patterns: 'Padr\u00f5es r\u00e1pidos',
        matches: 'Correspond\u00eancias',
        matches_placeholder: 'correspond\u00eancias aparecer\u00e3o aqui...',
        match_details: 'Detalhes das correspond\u00eancias',
        match_count: 'correspond\u00eancias',
        exec_time: 'ms',
        idle: 'inativo',
        match_header_num: '#',
        match_header_index: '\u00cdndice',
        match_header_value: 'Valor',
        match_header_groups: 'Grupos',
        seo_content: '<h2>Testador Regex \u2014 Testar Express\u00f5es Regulares Online</h2>' +
          '<p>Express\u00f5es regulares (regex) s\u00e3o sequ\u00eancias de caracteres que definem padr\u00f5es de busca. Desenvolvedores, engenheiros de dados e administradores de sistemas usam regex para validar entrada, buscar e substituir texto, analisar arquivos de log, extrair dados de strings e aplicar regras de formata\u00e7\u00e3o. Apesar de seu poder, express\u00f5es regulares podem ser dif\u00edceis de escrever e depurar sem uma ferramenta de teste ao vivo.</p>' +
          '<h3>Como usar esta ferramenta</h3>' +
          '<p>Insira seu padr\u00e3o regex no campo de padr\u00e3o no topo da p\u00e1gina. Alterne flags como <code>g</code> (global), <code>i</code> (sem distin\u00e7\u00e3o de mai\u00fasculas), <code>m</code> (multilinha) e <code>s</code> (dotall) para ajustar o comportamento de correspond\u00eancia. Cole ou digite sua string de teste na \u00e1rea de texto abaixo. As correspond\u00eancias s\u00e3o destacadas instantaneamente enquanto voc\u00ea digita.</p>' +
          '<h3>Padr\u00f5es regex comuns</h3>' +
          '<p>Email, URL, endere\u00e7o IP, n\u00famero de telefone, data, cor hexadecimal e c\u00f3digo postal s\u00e3o alguns dos padr\u00f5es mais utilizados. Use os bot\u00f5es de padr\u00f5es r\u00e1pidos para carregar padr\u00f5es comuns com strings de teste de exemplo.</p>' +
          '<h3>Refer\u00eancia r\u00e1pida de sintaxe regex</h3>' +
          '<p><strong>Classes de caracteres:</strong> <code>\\d</code> corresponde a qualquer d\u00edgito. <code>\\w</code> corresponde a qualquer caractere de palavra. <code>\\s</code> corresponde a qualquer espa\u00e7o em branco. Colchetes definem conjuntos personalizados.</p>' +
          '<p><strong>Quantificadores:</strong> <code>*</code> corresponde zero ou mais vezes. <code>+</code> corresponde uma ou mais vezes. <code>?</code> corresponde zero ou uma vez. <code>{n}</code> corresponde exatamente n vezes.</p>' +
          '<p><strong>\u00c2ncoras:</strong> <code>^</code> corresponde ao in\u00edcio de uma linha e <code>$</code> corresponde ao final. <code>\\b</code> corresponde a um limite de palavra.</p>' +
          '<p><strong>Grupos e altern\u00e2ncia:</strong> Par\u00eanteses <code>()</code> criam grupos de captura. Use <code>|</code> para altern\u00e2ncia \u2014 por exemplo, <code>(gato|cachorro)</code> corresponde a "gato" ou "cachorro".</p>' +
          '<h3>Privacidade e desempenho</h3>' +
          '<p>Este testador regex roda 100% no seu navegador usando o motor RegExp do JavaScript. Nenhum dado \u00e9 transmitido a qualquer servidor.</p>'
      },

      'agent': {
        _title: 'Rastreador de Agentes IA \u2014 TerminalFeed',
        _description: 'Rastreie todos os principais agentes de IA em tempo real. Status ao vivo, capacidades, pre\u00e7os e mais para Claude, GPT, Gemini, Copilot, Devin e mais de 30 agentes de IA.',
        agent_heading: '>_ RASTREADOR DE AGENTES IA',
        agent_subtitle: 'Diret\u00f3rio em tempo real de agentes, modelos e plataformas de IA',
        filter_all: 'Todos',
        filter_coding: 'Programa\u00e7\u00e3o',
        filter_general: 'Geral',
        filter_research: 'Pesquisa',
        filter_creative: 'Criativo',
        filter_autonomous: 'Aut\u00f4nomo',
        filter_search: 'Busca',
        filter_data: 'Dados',
        search_placeholder: 'Buscar agentes por nome...',
        sort_by: 'Ordenar por:',
        sort_name: 'Nome',
        sort_company: 'Empresa',
        sort_status: 'Status',
        agents_tracked: 'Agentes Rastreados',
        operational_now: 'Operacionais Agora',
        categories: 'Categorias',
        last_status_check: '\u00daltima verifica\u00e7\u00e3o de status',
        pricing_free: 'Gratuito',
        pricing_freemium: 'Freemium',
        pricing_paid: 'Pago',
        pricing_enterprise: 'Empresarial',
        status_operational: 'Operacional',
        status_degraded: 'Degradado',
        status_down: 'Fora do ar',
        status_unknown: 'Desconhecido'
      },

      'radio': {
        _title: 'Terminal Radio \u2014 TerminalFeed',
        _description: 'Streams lo-fi, ambient e chill para programar e focar. R\u00e1dio pela internet gratuita com est\u00e9tica de terminal. Groove Salad, Drone Zone, DEF CON Radio e mais.',
        radio_heading: '>_ TERMINAL RADIO',
        radio_subtitle: 'ambient \u00b7 lo-fi \u00b7 downtempo \u00b7 foco',
        on_air: 'NO AR',
        now_playing: 'TOCANDO AGORA',
        play: 'Tocar',
        pause: 'Pausar',
        vol: 'VOL',
        stations: 'ESTA\u00c7\u00d5ES',
        featured_artist: 'ARTISTA EM DESTAQUE',
        featured_desc: 'Paisagens sonoras atmosf\u00e9ricas e cinem\u00e1ticas que combinam texturas ambient e eletr\u00f4nicas. Perfeito para sess\u00f5es de foco profundo e programa\u00e7\u00e3o noturna.',
        stream_error: 'Stream indispon\u00edvel \u2014 tente outra esta\u00e7\u00e3o',
        space_to_play: 'Espa\u00e7o para tocar / pausar',
        listen_on_spotify: '\u2192 Ouvir no Spotify',
        seo_content: '<h2>Terminal Radio \u2014 R\u00e1dio pela Internet Gratuita para Programar e Focar</h2>' +
          '<p>Terminal Radio \u00e9 uma experi\u00eancia de r\u00e1dio pela internet curada para desenvolvedores, designers e qualquer pessoa que precise de um fundo sonoro focado enquanto trabalha. Projetado com a mesma est\u00e9tica de terminal do resto do TerminalFeed, re\u00fane alguns dos melhores streams ambient, lo-fi e downtempo da internet \u2014 tudo em uma interface escura e sem distra\u00e7\u00f5es.</p>' +
          '<p>Os streams apresentados no Terminal Radio s\u00e3o fornecidos pelo SomaFM, uma das esta\u00e7\u00f5es de r\u00e1dio independentes mais longevas da internet. Fundada em 2000 por Rusty Hodge em S\u00e3o Francisco, o SomaFM \u00e9 inteiramente mantido por ouvintes e completamente livre de publicidade.</p>' +
          '<p>Pesquisas t\u00eam mostrado consistentemente que m\u00fasica ambient e lo-fi pode melhorar a concentra\u00e7\u00e3o, reduzir o estresse e ajudar a manter um estado de fluxo durante o trabalho profundo. Diferente de m\u00fasica com vocais proeminentes ou mudan\u00e7as imprevis\u00edveis, g\u00eaneros ambient e downtempo fornecem uma textura sonora consistente que apoia o foco sem exigir aten\u00e7\u00e3o.</p>' +
          '<p>Nossa sele\u00e7\u00e3o de esta\u00e7\u00f5es cobre uma variedade de humores e estilos. Groove Salad oferece beats ambient e downtempo suaves. Drone Zone mergulha em territ\u00f3rio mais profundo e atmosf\u00e9rico. DEF CON Radio traz ambient sombrio, industrial e synthwave com uma pegada hacker. Space Station Soma oferece eletr\u00f4nica espacial de tempo m\u00e9dio, enquanto Lush apresenta vocais sensuais e suaves.</p>' +
          '<p>Tudo aqui \u00e9 gratuito. N\u00e3o h\u00e1 an\u00fancios nos streams de \u00e1udio \u2014 essa \u00e9 a promessa do SomaFM. A interface foi projetada para n\u00e3o atrapalhar: escolha uma esta\u00e7\u00e3o, aperte play e volte ao trabalho.</p>'
      }
    },

    // =========================================================================
    // GERMAN
    // =========================================================================
    de: {
      common: {
        back_terminal: '\u2190 zur\u00fcck zum Terminal',
        back_tools: '\u2190 zur\u00fcck zu Werkzeugen',
        runs_locally: 'l\u00e4uft lokal',
        copy: 'Kopieren',
        copied: 'Kopiert!',
        clear: 'Leeren',
        home: 'Startseite',
        live: 'Live',
        tools: 'Werkzeuge',
        agents: 'Agenten',
        radio: 'Radio',
        privacy_badge: '100% clientseitig \u2014 deine Daten verlassen niemals deinen Browser',
        footer_copy: '\u00a9 2026 TerminalFeed.io'
      },

      'tools-index': {
        _title: 'Entwickler-Werkzeuge \u2014 TerminalFeed',
        _description: 'Kostenlose Online-Entwicklerwerkzeuge, die 100% in deinem Browser laufen. JSON-Formatierer, Base64-Kodierer, UUID-Generator, Timestamp-Konverter, JWT-Decoder, Regex-Tester und mehr.',
        tools_heading: '>_ ENTWICKLER-WERKZEUGE',
        tools_subtitle: 'Alle Werkzeuge laufen lokal in deinem Browser \u2014 nichts verl\u00e4sst deinen Rechner.',
        tool_json_name: 'JSON-Formatierer',
        tool_json_desc: 'JSON formatieren, validieren und minifizieren',
        tool_base64_name: 'Base64 Kodieren/Dekodieren',
        tool_base64_desc: 'Base64-Zeichenketten kodieren und dekodieren',
        tool_uuid_name: 'UUID-Generator',
        tool_uuid_desc: 'V4-UUIDs sofort generieren',
        tool_timestamp_name: 'Timestamp-Konverter',
        tool_timestamp_desc: 'Unix-Timestamps \u2194 Daten konvertieren',
        tool_jwt_name: 'JWT-Decoder',
        tool_jwt_desc: 'JWT-Token dekodieren und inspizieren',
        tool_regex_name: 'Regex-Tester',
        tool_regex_desc: 'Regex-Muster mit Live-Abgleich testen'
      },

      'tools-json': {
        _title: 'JSON-Formatierer und Validator \u2014 TerminalFeed Tools',
        _description: 'Kostenloser Online-JSON-Formatierer, Validator und Minifizierer. Syntaxhervorhebung, Fehlererkennung mit Zeilennummern, Tastaturk\u00fcrzel. L\u00e4uft vollst\u00e4ndig in deinem Browser \u2014 keine Daten werden an einen Server gesendet.',
        json_heading: '>_ JSON-FORMATIERER',
        format: 'Formatieren',
        minify: 'Minifizieren',
        validate: 'Validieren',
        placeholder: 'F\u00fcge dein JSON hier ein...',
        output_label: 'Ausgabe',
        valid: 'g\u00fcltig',
        invalid: 'ung\u00fcltig',
        characters: 'Zeichen',
        lines: 'Zeilen',
        depth: 'Tiefe',
        no_input: 'Keine Eingabe vorhanden.',
        shortcut_hint: 'Strg+Enter zum Formatieren',
        seo_heading: 'JSON-Formatierer und Validator \u2014 JSON Online Formatieren',
        seo_content: '<h2>JSON-Formatierer und Validator \u2014 JSON Online Formatieren</h2>' +
          '<p>JSON (JavaScript Object Notation) ist das am weitesten verbreitete Datenaustauschformat im Web. APIs geben es zur\u00fcck, Konfigurationsdateien basieren darauf und Datenbanken speichern es. Allerdings ist rohes JSON \u2014 insbesondere minifizierte Antworten von Produktions-APIs \u2014 ohne ordentliche Formatierung praktisch unlesbar. Ein guter Formatierer verwandelt eine Textwand in ein strukturiertes, eingercktes Dokument, das du tats\u00e4chlich verstehen kannst.</p>' +
          '<h3>So verwendest du dieses Werkzeug</h3>' +
          '<p>F\u00fcge dein JSON in den Eingabebereich ein und klicke auf <strong>Formatieren</strong> (oder dr\u00fccke <code>Strg+Enter</code>), um es mit Zwei-Leerzeichen-Einr\u00fcckung und vollst\u00e4ndiger Syntaxhervorhebung anzuzeigen. Klicke auf <strong>Minifizieren</strong>, um formatiertes JSON in eine einzelne Zeile zu komprimieren und alle unn\u00f6tigen Leerzeichen zu entfernen \u2014 n\u00fctzlich zur Reduzierung der Payload-Gr\u00f6\u00dfe vor dem Senden von Daten \u00fcber das Netzwerk. Klicke auf <strong>Validieren</strong>, um zu pr\u00fcfen, ob dein JSON syntaktisch korrekt ist.</p>' +
          '<h3>H\u00e4ufige JSON-Anwendungsf\u00e4lle</h3>' +
          '<p>REST- und GraphQL-APIs geben JSON zur\u00fcck, das zur Fehlersuche und Inspektion formatiert werden muss. Werkzeuge wie package.json, tsconfig.json und .eslintrc verwenden JSON zur Definition von Projekteinstellungen. JSON ist das Standardformat f\u00fcr den Transfer strukturierter Daten zwischen Diensten, Microservices und Frontend-Anwendungen. NoSQL-Datenbanken wie MongoDB und CouchDB speichern Datens\u00e4tze als JSON-Dokumente.</p>' +
          '<h3>JSON-Syntax-Grundlagen</h3>' +
          '<p>Ein JSON-Wert muss einer von sechs Typen sein: <strong>Objekt</strong> (<code>{}</code>), <strong>Array</strong> (<code>[]</code>), <strong>String</strong> (in doppelten Anf\u00fchrungszeichen), <strong>Zahl</strong>, <strong>Boolean</strong> (<code>true</code> oder <code>false</code>) oder <strong>null</strong>. JSON unterst\u00fctzt keine Kommentare, nachgestellte Kommas oder Strings mit einfachen Anf\u00fchrungszeichen \u2014 dies sind die h\u00e4ufigsten Ursachen f\u00fcr Parse-Fehler.</p>' +
          '<h3>H\u00e4ufige JSON-Fehler und ihre Behebung</h3>' +
          '<p><strong>Nachgestellte Kommas:</strong> Ein Komma nach dem letzten Element eines Objekts oder Arrays ist in JSON ung\u00fcltig. Entferne das nachgestellte Komma oder f\u00fcge einen weiteren Eintrag danach hinzu.</p>' +
          '<p><strong>Einfache Anf\u00fchrungszeichen:</strong> JSON erfordert doppelte Anf\u00fchrungszeichen um Strings und Schl\u00fcssel. Ersetze alle einfachen durch doppelte Anf\u00fchrungszeichen.</p>' +
          '<p><strong>Schl\u00fcssel ohne Anf\u00fchrungszeichen:</strong> Anders als JavaScript-Objekte m\u00fcssen JSON-Schl\u00fcssel immer in doppelten Anf\u00fchrungszeichen stehen.</p>' +
          '<h3>Datenschutz und Leistung</h3>' +
          '<p>Dieser JSON-Formatierer und Validator l\u00e4uft 100% in deinem Browser. Es werden keine Daten an einen Server gesendet. Dein JSON verl\u00e4sst niemals deinen Rechner, was ihn sicher f\u00fcr die Formatierung sensibler Payloads wie Authentifizierungstoken, private API-Antworten und interne Konfigurationsdateien macht.</p>'
      },

      'tools-base64': {
        _title: 'Base64 Kodieren und Dekodieren \u2014 TerminalFeed Tools',
        _description: 'Kodiere und dekodiere Base64-Zeichenketten sofort in deinem Browser. Volle Unicode/UTF-8-Unterst\u00fctzung. Keine Daten verlassen deinen Rechner.',
        base64_heading: '>_ BASE64',
        encode: 'Kodieren \u2192',
        decode: '\u2190 Dekodieren',
        input_label: 'Eingabe',
        output_label: 'Ausgabe',
        input_placeholder: 'Tippe oder f\u00fcge Text hier ein...',
        output_placeholder: 'Ergebnis erscheint hier...',
        copy_output: 'Ausgabe Kopieren',
        live_mode: 'Live-Modus (kodieren/dekodieren w\u00e4hrend du tippst)',
        chars: 'Zeichen',
        seo_content: '<h2>Base64-Kodierer und Dekodierer \u2014 Base64 Online Konvertieren</h2>' +
          '<h3>Was ist Base64-Kodierung?</h3>' +
          '<p>Base64 ist ein Bin\u00e4r-zu-Text-Kodierungsschema, das Bin\u00e4rdaten in eine Folge druckbarer ASCII-Zeichen umwandelt. Es wurde urspr\u00fcnglich entwickelt, um die \u00dcbertragung von Bin\u00e4rdaten \u00fcber Kan\u00e4le zu erm\u00f6glichen, die nur zuverl\u00e4ssig Text unterst\u00fctzen, wie E-Mail (MIME) und fr\u00fches HTTP. Der Name "Base64" bezieht sich darauf, dass die Kodierung ein 64-Zeichen-Alphabet verwendet: die Gro\u00dfbuchstaben <code>A-Z</code>, Kleinbuchstaben <code>a-z</code>, Ziffern <code>0-9</code> und zwei zus\u00e4tzliche Symbole <code>+</code> und <code>/</code>.</p>' +
          '<h3>Wie Base64 funktioniert</h3>' +
          '<p>Die Base64-Kodierung nimmt jeweils drei Bytes (24 Bit) Eingabedaten und teilt sie in vier Gruppen zu je sechs Bit auf. Jede Sechs-Bit-Gruppe wird auf eines der 64 Zeichen des Base64-Alphabets abgebildet. Da drei Bytes bin\u00e4rer Eingabe zu vier Bytes Textausgabe werden, sind Base64-kodierte Daten immer etwa 33% gr\u00f6\u00dfer als das Original.</p>' +
          '<h3>H\u00e4ufige Anwendungsf\u00e4lle</h3>' +
          '<p>Base64-Kodierung erscheint in der gesamten Webentwicklung. Sie wird in <strong>Daten-URLs</strong> verwendet, um Bilder, Schriftarten und andere Ressourcen direkt in HTML oder CSS einzubetten. E-Mail-Systeme verwenden Base64 als Teil des <strong>MIME-Standards</strong> zur Kodierung von Anh\u00e4ngen. <strong>HTTP-Basic-Authentifizierung</strong>-Header \u00fcbertragen Anmeldedaten im Format <code>Benutzer:Passwort</code> als Base64 kodiert.</p>' +
          '<h3>So verwendest du dieses Werkzeug</h3>' +
          '<p>F\u00fcge deinen Text in das Eingabefeld links ein oder tippe ihn ein. Klicke auf <strong>Kodieren</strong>, um Klartext in Base64 umzuwandeln, oder auf <strong>Dekodieren</strong>, um eine Base64-Zeichenkette zur\u00fcck in Klartext umzuwandeln. Mit aktiviertem <strong>Live-Modus</strong> wird die Ausgabe automatisch aktualisiert, w\u00e4hrend du tippst.</p>' +
          '<h3>Unicode- und UTF-8-Unterst\u00fctzung</h3>' +
          '<p>Anders als viele Base64-Werkzeuge, die nur ASCII verarbeiten, unterst\u00fctzt dieser Kodierer vollst\u00e4ndig <strong>UTF-8 und Unicode</strong>, einschlie\u00dflich Emojis, CJK-Zeichen und akzentuiertem Text.</p>' +
          '<h3>Datenschutz und Sicherheit</h3>' +
          '<p>Dieses Werkzeug l\u00e4uft <strong>100% clientseitig</strong> in deinem Browser. Es werden keine Daten an einen Server \u00fcbertragen. Deine Eingabe verl\u00e4sst niemals deinen Rechner, was es sicher macht, sensible Zeichenketten wie API-Schl\u00fcssel, Token und Anmeldedaten zu kodieren oder dekodieren.</p>'
      },

      'tools-uuid': {
        _title: 'UUID-Generator \u2014 TerminalFeed Tools',
        _description: 'Generiere zuf\u00e4llige UUIDs (v4) sofort in deinem Browser. Massengenerierung, Klick-zum-Kopieren, Gro\u00dfschreibung und Bindestrich-Optionen. Keine Daten verlassen deinen Rechner.',
        uuid_heading: '>_ UUID-GENERATOR',
        generate: 'Generieren',
        copy_all: 'Alle Kopieren',
        uppercase: 'Gro\u00dfbuchstaben',
        no_hyphens: 'Ohne Bindestriche',
        bulk_label: 'UUIDs',
        bulk_generate: 'Massengenerierung',
        click_to_copy: 'Klicken zum Kopieren',
        generated_count: 'In dieser Sitzung generiert',
        seo_content: '<h2>UUID-Generator \u2014 UUIDs Online Generieren</h2>' +
          '<h3>Was ist eine UUID?</h3>' +
          '<p>Eine UUID (Universally Unique Identifier) ist ein 128-Bit-Wert, der verwendet wird, um Informationen in Computersystemen eindeutig zu identifizieren, ohne eine zentrale Registrierungsstelle zu ben\u00f6tigen. UUIDs sind auch als GUIDs (Globally Unique Identifiers) in Microsoft-\u00d6kosystemen bekannt. Das Standardformat ist eine 32-stellige Hexadezimalzeichenkette, dargestellt in f\u00fcnf Gruppen, getrennt durch Bindestriche im Muster <code>8-4-4-4-12</code>, zum Beispiel: <code>550e8400-e29b-41d4-a716-446655440000</code>.</p>' +
          '<h3>UUID-Versionen erkl\u00e4rt</h3>' +
          '<p><strong>Version 1 (v1)</strong> UUIDs werden aus einem Zeitstempel und der MAC-Adresse des Rechners generiert. <strong>Version 4 (v4)</strong> UUIDs werden mit Zufalls- oder Pseudozufallszahlen generiert und sind die am h\u00e4ufigsten verwendete Version f\u00fcr allgemeine Anwendungen. <strong>Version 5 (v5)</strong> UUIDs werden durch Hashing eines Namespace-Identifikators und eines Namens mit SHA-1 erzeugt.</p>' +
          '<h3>Dieses Werkzeug generiert v4-UUIDs</h3>' +
          '<p>Dieser Generator erstellt <strong>Version 4 UUIDs</strong> mit der im Browser integrierten <code>crypto.randomUUID()</code>-API, die kryptographisch starke Zufallswerte erzeugt. Jede generierte UUID ist statistisch einzigartig.</p>' +
          '<h3>H\u00e4ufige Anwendungsf\u00e4lle</h3>' +
          '<p>UUIDs werden als <strong>Datenbank-Prim\u00e4rschl\u00fcssel</strong> in Systemen wie PostgreSQL, MySQL und MongoDB verwendet. Sie dienen als <strong>Sitzungskennungen</strong> in Webanwendungen. In <strong>verteilten Systemen</strong> und Microservice-Architekturen erm\u00f6glichen UUIDs mehreren Knoten, unabh\u00e4ngig eindeutige Kennungen zu generieren.</p>' +
          '<h3>So verwendest du dieses Werkzeug</h3>' +
          '<p>Klicke auf <strong>Generieren</strong>, um eine einzelne UUID zu erstellen, oder klicke auf die angezeigte UUID, um sie zu kopieren. Verwende die Option <strong>Gro\u00dfbuchstaben</strong> f\u00fcr Hexadezimalzeichen in Gro\u00dfschreibung oder <strong>Ohne Bindestriche</strong> f\u00fcr eine kompakte 32-Zeichen-Zeichenkette. F\u00fcr Massengenerierung gib eine Menge (bis 500) ein und klicke auf <strong>Massengenerierung</strong>.</p>' +
          '<h3>Datenschutz und Sicherheit</h3>' +
          '<p>Dieses Werkzeug l\u00e4uft <strong>100% clientseitig</strong> in deinem Browser mit der Web Crypto API. Keine UUID wird an einen Server gesendet oder gespeichert.</p>'
      },

      'tools-timestamp': {
        _title: 'Unix-Timestamp-Konverter \u2014 TerminalFeed Tools',
        _description: 'Konvertiere Unix-Timestamps in lesbare Daten und zur\u00fcck. Live-Uhr, relative Zeit, ISO 8601, Millisekunden. L\u00e4uft vollst\u00e4ndig in deinem Browser.',
        timestamp_heading: '>_ TIMESTAMP-KONVERTER',
        current_unix: 'Aktueller Unix-Timestamp',
        to_human: 'Timestamp \u2192 Lesbares Datum',
        to_timestamp: 'Datum \u2192 Timestamp',
        now: 'Jetzt',
        plus_hour: '+1 Stunde',
        plus_day: '+1 Tag',
        plus_week: '+1 Woche',
        local_time: 'Lokale Zeit',
        utc: 'UTC',
        iso: 'ISO 8601',
        relative: 'Relativ',
        seconds: 'Sekunden',
        milliseconds: 'Millisekunden',
        date: 'Datum',
        time: 'Uhrzeit',
        ts_input_label: 'Unix-Timestamp (Sekunden oder Millisekunden)',
        seo_content: '<h2>Unix-Timestamp-Konverter \u2014 Epoch-Zeit Online Konvertieren</h2>' +
          '<h3>Was ist ein Unix-Timestamp?</h3>' +
          '<p>Ein Unix-Timestamp (auch Epoch-Zeit oder POSIX-Zeit genannt) ist die Anzahl der Sekunden, die seit dem <strong>1. Januar 1970, 00:00:00 UTC</strong> vergangen sind \u2014 ein Moment, der als Unix-Epoche bekannt ist. Diese einzelne Ganzzahl repr\u00e4sentiert einen exakten Zeitpunkt ohne Abh\u00e4ngigkeit von Zeitzonen, Sommerzeitregeln oder Kalenderformatierung.</p>' +
          '<h3>Warum Entwickler Unix-Zeit verwenden</h3>' +
          '<p>Unix-Timestamps sind der De-facto-Standard f\u00fcr die Zeiterfassung in Softwaresystemen. Sie sind sprachunabh\u00e4ngig \u2014 jede g\u00e4ngige Programmiersprache kann sie lesen und erzeugen. Sie sind zeitzonen-unabh\u00e4ngig, sodass ein in Tokio generierter Timestamp in New York dasselbe bedeutet.</p>' +
          '<h3>Sekunden vs. Millisekunden</h3>' +
          '<p>Die meisten traditionellen Unix-Systeme und Sprachen wie Python, PHP und C verwenden Timestamps in <strong>Sekunden</strong>. JavaScript, Java und einige moderne APIs verwenden <strong>Millisekunden</strong>. Ein Sekunden-Timestamp hat typischerweise 10 Stellen, w\u00e4hrend ein Millisekunden-Timestamp 13 Stellen hat. Dieser Konverter erkennt automatisch, welches Format du eingibst.</p>' +
          '<h3>So verwendest du dieses Werkzeug</h3>' +
          '<p>F\u00fcge einen beliebigen Unix-Timestamp in den oberen Konverter ein, um die entsprechende lokale Zeit, UTC und ISO 8601 zu sehen \u2014 zusammen mit einer relativen Zeitangabe. Verwende die Schnellschaltfl\u00e4chen f\u00fcr g\u00e4ngige Zeitverschiebungen. F\u00fcr die umgekehrte Richtung w\u00e4hle ein Datum und eine Uhrzeit im unteren Konverter, um den Unix-Timestamp in Sekunden und Millisekunden zu erhalten.</p>' +
          '<p>Dieser Konverter l\u00e4uft <strong>100% clientseitig</strong> \u2014 keine Daten werden an einen Server gesendet.</p>'
      },

      'tools-jwt': {
        _title: 'JWT-Decoder \u2014 TerminalFeed Tools',
        _description: 'Dekodiere und inspiziere JWT-Token sofort. Zeige Header, Payload und Claims mit Ablaufpr\u00fcfung an. L\u00e4uft vollst\u00e4ndig in deinem Browser \u2014 Token verlassen niemals deinen Rechner.',
        jwt_heading: '>_ JWT-DECODER',
        placeholder: 'F\u00fcge dein JWT-Token hier ein...',
        header: 'Header',
        payload: 'Payload',
        signature: 'Signatur',
        paste_jwt: 'JWT-Token Einf\u00fcgen',
        expired: 'Abgelaufen',
        valid: 'G\u00fcltig',
        algorithm: 'Algorithmus',
        issued_at: 'Ausgestellt am',
        expires_at: 'L\u00e4uft ab am',
        is_expired: 'Abgelaufen?',
        yes: 'Ja',
        no: 'Nein',
        warning: '\u26a0 Dieses Werkzeug verifiziert keine Signaturen. Die Dekodierung erfolgt vollst\u00e4ndig in deinem Browser \u2014 Token verlassen niemals deinen Rechner.',
        sig_note: 'Die Signaturverifizierung erfordert den geheimen Schl\u00fcssel \u2014 dieses Werkzeug dekodiert nur.',
        seo_content: '<h2>JWT-Decoder \u2014 JSON Web Token Online Dekodieren</h2>' +
          '<h3>Was ist ein JWT?</h3>' +
          '<p>Ein JSON Web Token (JWT) ist ein kompaktes, URL-sicheres Token-Format, definiert durch <strong>RFC 7519</strong>. JWTs erm\u00f6glichen es, Claims \u2014 Informationen \u00fcber einen Benutzer oder eine Sitzung \u2014 sicher als JSON-Objekt zwischen Parteien zu \u00fcbertragen. Sie sind eigenst\u00e4ndig, das hei\u00dft, das Token selbst enth\u00e4lt alle Informationen, die zur Authentifizierung einer Anfrage ben\u00f6tigt werden.</p>' +
          '<h3>JWT-Struktur: Header.Payload.Signature</h3>' +
          '<p>Jedes JWT besteht aus drei durch Punkte getrennten Teilen: <code>header.payload.signature</code>. Jeder Teil ist Base64URL-kodiert. Der <strong>Header</strong> enth\u00e4lt typischerweise den Signaturalgorithmus (<code>alg</code>) und den Token-Typ (<code>typ</code>). Der <strong>Payload</strong> enth\u00e4lt die Claims. Die <strong>Signatur</strong> wird erstellt, indem der kodierte Header und Payload mit einem geheimen Schl\u00fcssel (HMAC) oder einem privaten Schl\u00fcssel (RSA/ECDSA) signiert werden.</p>' +
          '<h3>Wo JWTs verwendet werden</h3>' +
          '<p>JWTs werden im modernen Entwicklungsstack breit eingesetzt. Bei der <strong>API-Authentifizierung</strong> senden Clients ein JWT im <code>Authorization: Bearer</code>-Header. <strong>OAuth 2.0</strong> und <strong>OpenID Connect</strong> verwenden JWTs als Zugangs- und Identit\u00e4tstoken. <strong>Single Sign-On (SSO)</strong>-Systeme stellen JWTs aus, damit Benutzer sich einmal authentifizieren und auf mehrere Dienste zugreifen k\u00f6nnen.</p>' +
          '<h3>Sicherheitsaspekte</h3>' +
          '<p><strong>JWTs sind kodiert, nicht verschl\u00fcsselt.</strong> Jeder, der ein JWT hat, kann Header und Payload dekodieren. Speichere niemals sensible Informationen im Payload eines JWTs, es sei denn, du wendest zus\u00e4tzlich JWE (JSON Web Encryption) an.</p>' +
          '<h3>So verwendest du dieses Werkzeug</h3>' +
          '<p>F\u00fcge ein beliebiges JWT in das Textfeld oben ein. Der Decoder teilt das Token sofort in seine drei Teile auf und zeigt Header und Payload als formatiertes JSON mit Syntaxhervorhebung an.</p>' +
          '<p>Dieser Decoder l\u00e4uft <strong>100% clientseitig</strong> in deinem Browser. Deine Token werden niemals an einen Server \u00fcbertragen.</p>'
      },

      'tools-regex': {
        _title: 'Regex-Tester \u2014 TerminalFeed Tools',
        _description: 'Kostenloser Online-Regex-Tester mit Live-Abgleich, Erfassungsgruppen-Hervorhebung und Schnellmustern. L\u00e4uft 100% in deinem Browser \u2014 nichts verl\u00e4sst deinen Rechner.',
        regex_heading: '>_ REGEX-TESTER',
        pattern_label: 'Muster',
        pattern_placeholder: 'Regex-Muster eingeben...',
        test_label: 'Testzeichenkette',
        test_placeholder: 'Testzeichenkette eingeben...',
        flags_global: 'g',
        flags_case: 'i',
        flags_multiline: 'm',
        flags_dotall: 's',
        flag_global_title: 'Global',
        flag_case_title: 'Gro\u00df-/Kleinschreibung ignorieren',
        flag_multiline_title: 'Mehrzeilig',
        flag_dotall_title: 'DotAll',
        quick_patterns: 'Schnellmuster',
        matches: 'Treffer',
        matches_placeholder: 'Treffer erscheinen hier...',
        match_details: 'Treffer-Details',
        match_count: 'Treffer',
        exec_time: 'ms',
        idle: 'Leerlauf',
        match_header_num: '#',
        match_header_index: 'Index',
        match_header_value: 'Wert',
        match_header_groups: 'Gruppen',
        seo_content: '<h2>Regex-Tester \u2014 Regul\u00e4re Ausdr\u00fccke Online Testen</h2>' +
          '<p>Regul\u00e4re Ausdr\u00fccke (Regex) sind Zeichenfolgen, die Suchmuster definieren. Entwickler, Dateningenieure und Systemadministratoren verwenden Regex, um Eingaben zu validieren, Text zu suchen und zu ersetzen, Log-Dateien zu analysieren, Daten aus Zeichenketten zu extrahieren und Formatierungsregeln durchzusetzen. Trotz ihrer Leistungsf\u00e4higkeit k\u00f6nnen regul\u00e4re Ausdr\u00fccke schwer zu schreiben und zu debuggen sein ohne ein Live-Testwerkzeug.</p>' +
          '<h3>So verwendest du dieses Werkzeug</h3>' +
          '<p>Gib dein Regex-Muster in das Musterfeld oben auf der Seite ein. Schalte Flags wie <code>g</code> (global), <code>i</code> (Gro\u00df-/Kleinschreibung ignorieren), <code>m</code> (mehrzeilig) und <code>s</code> (DotAll) um, um das Abgleichverhalten anzupassen. F\u00fcge deine Testzeichenkette in das Textfeld unten ein oder tippe sie ein. Treffer werden sofort hervorgehoben, w\u00e4hrend du tippst.</p>' +
          '<h3>H\u00e4ufige Regex-Muster</h3>' +
          '<p>E-Mail, URL, IP-Adresse, Telefonnummer, Datum, Hexfarbe und Postleitzahl geh\u00f6ren zu den am h\u00e4ufigsten verwendeten Mustern. Verwende die Schnellmuster-Schaltfl\u00e4chen, um g\u00e4ngige Muster mit Beispiel-Testzeichenketten zu laden.</p>' +
          '<h3>Regex-Syntax-Kurzreferenz</h3>' +
          '<p><strong>Zeichenklassen:</strong> <code>\\d</code> stimmt mit jeder Ziffer \u00fcberein. <code>\\w</code> stimmt mit jedem Wortzeichen \u00fcberein. <code>\\s</code> stimmt mit jedem Leerzeichen \u00fcberein. Eckige Klammern definieren benutzerdefinierte Mengen.</p>' +
          '<p><strong>Quantifizierer:</strong> <code>*</code> stimmt null oder mehrmals \u00fcberein. <code>+</code> stimmt einmal oder mehrmals \u00fcberein. <code>?</code> stimmt null oder einmal \u00fcberein. <code>{n}</code> stimmt genau n-mal \u00fcberein.</p>' +
          '<p><strong>Anker:</strong> <code>^</code> stimmt mit dem Zeilenanfang \u00fcberein und <code>$</code> mit dem Zeilenende. <code>\\b</code> stimmt mit einer Wortgrenze \u00fcberein.</p>' +
          '<p><strong>Gruppen und Alternation:</strong> Klammern <code>()</code> erstellen Erfassungsgruppen. Verwende <code>|</code> f\u00fcr Alternation \u2014 zum Beispiel stimmt <code>(Katze|Hund)</code> mit "Katze" oder "Hund" \u00fcberein.</p>' +
          '<h3>Datenschutz und Leistung</h3>' +
          '<p>Dieser Regex-Tester l\u00e4uft 100% in deinem Browser mit der JavaScript-RegExp-Engine. Keine Daten werden an einen Server \u00fcbertragen.</p>'
      },

      'agent': {
        _title: 'KI-Agenten-Tracker \u2014 TerminalFeed',
        _description: 'Verfolge alle wichtigen KI-Agenten in Echtzeit. Live-Status, F\u00e4higkeiten, Preise und mehr f\u00fcr Claude, GPT, Gemini, Copilot, Devin und \u00fcber 30 KI-Agenten.',
        agent_heading: '>_ KI-AGENTEN-TRACKER',
        agent_subtitle: 'Echtzeit-Verzeichnis von KI-Agenten, Modellen und Plattformen',
        filter_all: 'Alle',
        filter_coding: 'Programmierung',
        filter_general: 'Allgemein',
        filter_research: 'Forschung',
        filter_creative: 'Kreativ',
        filter_autonomous: 'Autonom',
        filter_search: 'Suche',
        filter_data: 'Daten',
        search_placeholder: 'Agenten nach Name suchen...',
        sort_by: 'Sortieren nach:',
        sort_name: 'Name',
        sort_company: 'Unternehmen',
        sort_status: 'Status',
        agents_tracked: 'Verfolgte Agenten',
        operational_now: 'Derzeit Betriebsbereit',
        categories: 'Kategorien',
        last_status_check: 'Letzte Statuspr\u00fcfung',
        pricing_free: 'Kostenlos',
        pricing_freemium: 'Freemium',
        pricing_paid: 'Kostenpflichtig',
        pricing_enterprise: 'Enterprise',
        status_operational: 'Betriebsbereit',
        status_degraded: 'Beeintr\u00e4chtigt',
        status_down: 'Ausgefallen',
        status_unknown: 'Unbekannt'
      },

      'radio': {
        _title: 'Terminal Radio \u2014 TerminalFeed',
        _description: 'Lo-fi, Ambient und Chill-Streams zum Programmieren und Konzentrieren. Kostenloses Internetradio mit Terminal-\u00c4sthetik. Groove Salad, Drone Zone, DEF CON Radio und mehr.',
        radio_heading: '>_ TERMINAL RADIO',
        radio_subtitle: 'Ambient \u00b7 Lo-fi \u00b7 Downtempo \u00b7 Fokus',
        on_air: 'AUF SENDUNG',
        now_playing: 'L\u00c4UFT GERADE',
        play: 'Abspielen',
        pause: 'Pause',
        vol: 'VOL',
        stations: 'SENDER',
        featured_artist: 'VORGESTELLTER K\u00dcNSTLER',
        featured_desc: 'Atmosph\u00e4rische, filmische Klanglandschaften, die Ambient- und elektronische Texturen verbinden. Perfekt f\u00fcr tiefe Konzentrationsphasen und n\u00e4chtliche Programmiersessions.',
        stream_error: 'Stream nicht verf\u00fcgbar \u2014 versuche einen anderen Sender',
        space_to_play: 'Leertaste zum Abspielen / Pausieren',
        listen_on_spotify: '\u2192 Auf Spotify h\u00f6ren',
        seo_content: '<h2>Terminal Radio \u2014 Kostenloses Internetradio zum Programmieren und Konzentrieren</h2>' +
          '<p>Terminal Radio ist ein kuratiertes Internetradio-Erlebnis f\u00fcr Entwickler, Designer und alle, die beim Arbeiten einen fokussierten Klanghintergrund brauchen. Gestaltet mit der gleichen Terminal-\u00c4sthetik wie der Rest von TerminalFeed, vereint es einige der besten Ambient-, Lo-fi- und Downtempo-Streams aus dem Internet \u2014 alles in einer dunklen, ablenkungsfreien Oberfl\u00e4che.</p>' +
          '<p>Die auf Terminal Radio pr\u00e4sentierten Streams werden von SomaFM bereitgestellt, einem der \u00e4ltesten unabh\u00e4ngigen Internetsender. Im Jahr 2000 von Rusty Hodge in San Francisco gegr\u00fcndet, wird SomaFM vollst\u00e4ndig von H\u00f6rern finanziert und ist komplett werbefrei.</p>' +
          '<p>Forschungen haben durchg\u00e4ngig gezeigt, dass Ambient- und Lo-fi-Musik die Konzentration verbessern, Stress reduzieren und helfen kann, einen Flow-Zustand bei vertiefter Arbeit aufrechtzuerhalten. Anders als Musik mit markanten Gesangseinlagen oder unvorhersehbaren Wechseln bieten Ambient- und Downtempo-Genres eine konsistente Klangtextur, die den Fokus unterst\u00fctzt, ohne Aufmerksamkeit zu fordern.</p>' +
          '<p>Unsere Senderauswahl deckt eine Bandbreite an Stimmungen und Stilen ab. Groove Salad liefert geschmeidige Ambient- und Downtempo-Beats. Drone Zone bewegt sich in tieferes, atmosph\u00e4rischeres Terrain mit texturierten Ambient-Klanglandschaften. DEF CON Radio bringt Dark Ambient, Industrial und Synthwave mit Hacker-Attitude. Space Station Soma bietet spacige Mid-Tempo-Elektronik, w\u00e4hrend Lush sinnliche, sanfte Vocals pr\u00e4sentiert.</p>' +
          '<p>Alles hier ist kostenlos. Es gibt keine Werbung in den Audio-Streams \u2014 das ist das SomaFM-Versprechen. Die Oberfl\u00e4che ist so gestaltet, dass sie dir nicht im Weg steht: w\u00e4hle einen Sender, dr\u00fccke Play und arbeite weiter.</p>'
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
    if (lang === 'en') return;
    if (!I18N[lang]) return;

    var langData = I18N[lang];
    var pageId = document.body && document.body.dataset ? document.body.dataset.page : null;
    var common = langData.common || {};
    var pageTranslations = pageId && langData[pageId] ? langData[pageId] : {};

    // Merge common + page-specific (page overrides common)
    var translations = {};
    var key;
    for (key in common) {
      if (common.hasOwnProperty(key)) translations[key] = common[key];
    }
    for (key in pageTranslations) {
      if (pageTranslations.hasOwnProperty(key)) translations[key] = pageTranslations[key];
    }

    // Update <html lang="">
    document.documentElement.lang = lang;

    // Update document.title
    if (translations._title) {
      document.title = translations._title;
    }

    // Update meta description
    if (translations._description) {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', translations._description);
    }

    // data-i18n: replace textContent
    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var tKey = textEls[i].getAttribute('data-i18n');
      if (translations[tKey] !== undefined) {
        textEls[i].textContent = translations[tKey];
      }
    }

    // data-i18n-html: replace innerHTML
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlEls.length; j++) {
      var hKey = htmlEls[j].getAttribute('data-i18n-html');
      if (translations[hKey] !== undefined) {
        htmlEls[j].innerHTML = translations[hKey];
      }
    }

    // data-i18n-placeholder: replace placeholder
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < phEls.length; k++) {
      var pKey = phEls[k].getAttribute('data-i18n-placeholder');
      if (translations[pKey] !== undefined) {
        phEls[k].placeholder = translations[pKey];
      }
    }

    // Add language switcher
    addLanguageSwitcher();
  }

  // ---------------------------------------------------------------------------
  // Language Switcher
  // ---------------------------------------------------------------------------
  function addLanguageSwitcher() {
    var langNames = { en: 'EN', es: 'ES', pt: 'PT', de: 'DE' };
    var langLabels = { en: 'English', es: 'Espa\u00f1ol', pt: 'Portugu\u00eas', de: 'Deutsch' };
    var allLangs = ['en', 'es', 'pt', 'de'];

    var switcher = document.createElement('div');
    switcher.id = 'i18n-switcher';
    switcher.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'right:16px',
      'z-index:9999',
      'font-family:\'SF Mono\',\'Fira Code\',\'Consolas\',monospace',
      'font-size:11px'
    ].join(';');

    var btn = document.createElement('button');
    btn.textContent = langNames[lang] + ' \u25b4';
    btn.style.cssText = [
      'background:#111114',
      'color:#5DCAA5',
      'border:1px solid #1A1A22',
      'padding:6px 12px',
      'border-radius:4px',
      'cursor:pointer',
      'font-family:inherit',
      'font-size:11px',
      'letter-spacing:0.5px'
    ].join(';');

    var dropdown = document.createElement('div');
    dropdown.style.cssText = [
      'display:none',
      'position:absolute',
      'bottom:100%',
      'right:0',
      'margin-bottom:4px',
      'background:#111114',
      'border:1px solid #1A1A22',
      'border-radius:4px',
      'overflow:hidden',
      'min-width:120px'
    ].join(';');

    for (var i = 0; i < allLangs.length; i++) {
      var l = allLangs[i];
      var link = document.createElement('a');
      link.textContent = langLabels[l];
      link.href = buildLangUrl(l);
      link.style.cssText = [
        'display:block',
        'padding:6px 12px',
        'color:' + (l === lang ? '#5DCAA5' : '#7A7A72'),
        'text-decoration:none',
        'font-size:11px',
        'transition:background 0.15s'
      ].join(';');
      if (l === lang) {
        link.style.fontWeight = '600';
      }
      link.addEventListener('mouseenter', function () {
        this.style.background = '#1A1A22';
      });
      link.addEventListener('mouseleave', function () {
        this.style.background = 'transparent';
      });
      dropdown.appendChild(link);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', function () {
      dropdown.style.display = 'none';
    });

    switcher.appendChild(dropdown);
    switcher.appendChild(btn);
    document.body.appendChild(switcher);
  }

  function buildLangUrl(targetLang) {
    var currentPath = window.location.pathname;
    // Strip existing language prefix
    var stripped = currentPath.replace(/^\/(es|pt|de)\//, '/');
    if (targetLang === 'en') {
      return stripped + window.location.search;
    }
    // Ensure stripped starts with /
    if (stripped.charAt(0) !== '/') stripped = '/' + stripped;
    return '/' + targetLang + stripped + window.location.search;
  }

  // ---------------------------------------------------------------------------
  // Run on DOMContentLoaded
  // ---------------------------------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

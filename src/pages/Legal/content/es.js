// Textos legales en español. Cada documento tiene secciones; cada bloque de una sección es un
// párrafo (texto) o una lista (arreglo de textos).
//
// Antes de cambiar algo aquí, cambia también content/en.js: las dos versiones deben decir lo mismo.

const EMPRESA = 'Ludopata, LLC';
const CORREO = 'info@ludopata.org';

export const ACTUALIZADO = '25 de noviembre de 2026';

const es = {
    terms: {
        title: 'Términos de uso',
        intro: [
            `Estos términos regulan el uso de Ludopata (el sitio ludopata.org y sus servicios), operado por ${EMPRESA}, una empresa de Estados Unidos. Al crear una cuenta o usar el servicio aceptas estos términos. Si no estás de acuerdo, no uses el servicio.`
        ],
        sections: [
            {
                heading: '1. Qué es Ludopata',
                body: [
                    'Ludopata es una comunidad y un conjunto de herramientas de autoayuda para personas afectadas por el juego problemático y sus familias: comunidad, registro de recaídas y deudas, compromisos personales, estrategias, formularios de autoevaluación, un asistente virtual y, en el plan Premium, acompañamiento de personas de nuestro equipo.',
                    'Ludopata no es un servicio de apuestas ni promueve el juego de ninguna forma.'
                ]
            },
            {
                heading: '2. No sustituye la atención profesional',
                body: [
                    'Ludopata es un apoyo, no un servicio médico, psicológico, legal ni financiero. La información, las respuestas del asistente virtual y el acompañamiento de nuestro equipo no son un diagnóstico ni un tratamiento, y no sustituyen la atención de profesionales de la salud.',
                    'Si estás en peligro o piensas en hacerte daño, contacta de inmediato con los servicios de emergencia de tu país. Ludopata no atiende emergencias ni está disponible las 24 horas.'
                ]
            },
            {
                heading: '3. Quién puede usarlo',
                body: [
                    'Debes tener al menos 18 años. Al registrarte confirmas que los tienes y que los datos que nos das son verdaderos.'
                ]
            },
            {
                heading: '4. Tu cuenta',
                body: [
                    'Eres responsable de mantener segura tu contraseña y de lo que se haga con tu cuenta. Avísanos de inmediato si crees que alguien entró sin permiso. Una persona solo puede tener una cuenta, y no puedes cederla ni venderla.'
                ]
            },
            {
                heading: '5. Normas de la comunidad',
                body: [
                    'Para que la comunidad sea un lugar seguro, no está permitido:',
                    [
                        'Promocionar casas de apuestas, casinos, pronósticos o cualquier forma de juego, ni publicar enlaces a ellos.',
                        'Acosar, insultar, amenazar o discriminar a otras personas.',
                        'Publicar datos personales de terceros o contenido íntimo de otras personas.',
                        'Ofrecer préstamos, inversiones o "soluciones" a cambio de dinero.',
                        'Publicar contenido ilegal, violento, sexual explícito o que infrinja derechos de otros.',
                        'Hacerte pasar por otra persona o por nuestro equipo.',
                        'Usar programas automáticos, intentar acceder a cuentas ajenas o interferir con el funcionamiento del servicio.'
                    ],
                    'Cualquier persona puede reportar una publicación. Podemos ocultar o eliminar contenido y suspender o cerrar cuentas que incumplan estas normas, con o sin aviso previo según la gravedad.'
                ]
            },
            {
                heading: '6. Tu contenido',
                body: [
                    'Lo que publicas sigue siendo tuyo. Para poder mostrarlo nos das un permiso no exclusivo y gratuito para alojarlo, mostrarlo a los demás usuarios, adaptarlo a distintos tamaños y formatos y traducirlo automáticamente a otros idiomas dentro del servicio. Ese permiso termina cuando eliminas el contenido o tu cuenta, salvo copias de seguridad que se borran en un plazo limitado.',
                    'Eres responsable de lo que publicas. Piensa bien antes de compartir información personal en la comunidad: lo que publicas allí lo ven los demás usuarios.'
                ]
            },
            {
                heading: '7. Asistente virtual',
                body: [
                    'El asistente virtual genera respuestas de forma automática con inteligencia artificial. Puede equivocarse o dar respuestas incompletas, así que no tomes decisiones importantes solo con base en ellas. Si en el plan Premium pides apoyo humano, una persona de nuestro equipo leerá esa conversación para atenderte.'
                ]
            },
            {
                heading: '8. Plan Premium y pagos',
                body: [
                    [
                        'Puedes usar Ludopata gratis con los límites del plan gratuito. El plan Premium se contrata por periodos (mensual, trimestral, semestral o anual) al precio que se muestra antes de pagar.',
                        'El pago lo procesa Stripe. Nosotros no vemos ni guardamos los datos de tu tarjeta.',
                        'El primer periodo se cobra al suscribirte. Si es tu primera suscripción, te regalamos 7 días extra: el siguiente cobro se retrasa 7 días. En la página de pago verás la fecha exacta.',
                        'La suscripción se renueva automáticamente al final de cada periodo, al precio vigente, hasta que la canceles.',
                        'Puedes cancelar la renovación en cualquier momento desde la sección de suscripción. Conservas el Premium hasta el final del periodo que ya pagaste y luego tu cuenta vuelve al plan gratuito, sin perder tus datos.',
                        'Si cambias de plan, el nuevo plan empieza cuando se acaba el tiempo que ya tenías, para que no lo pierdas.',
                        'Si cambiamos los precios, te avisaremos antes de que el cambio afecte tu siguiente renovación.',
                        'Los reembolsos se rigen por nuestra Política de reembolsos.'
                    ]
                ]
            },
            {
                heading: '9. Disponibilidad y cambios del servicio',
                body: [
                    'Trabajamos para que Ludopata funcione siempre, pero no podemos garantizar que no haya interrupciones o errores. Podemos cambiar, añadir o retirar funciones. Si retiramos una función de pago de forma importante, te avisaremos.'
                ]
            },
            {
                heading: '10. Cierre de la cuenta',
                body: [
                    'Puedes dejar de usar el servicio y pedir la eliminación de tu cuenta y tus datos desde tu perfil. Nosotros podemos suspender o cerrar una cuenta que incumpla estos términos. Si cerramos tu cuenta sin que hayas incumplido nada, te devolveremos la parte proporcional del periodo pagado que no hayas usado.'
                ]
            },
            {
                heading: '11. Responsabilidad',
                body: [
                    'El servicio se ofrece "tal cual". En la medida que lo permita la ley, Ludopata, LLC no responde por daños indirectos ni por decisiones que tomes basándote en el contenido del servicio, en publicaciones de otros usuarios o en respuestas del asistente virtual. Nuestra responsabilidad total frente a ti se limita a lo que nos hayas pagado en los 12 meses anteriores al hecho que la origine. Nada de esto limita derechos que la ley de tu país no permita limitar.'
                ]
            },
            {
                heading: '12. Ley aplicable',
                body: [
                    'Estos términos se rigen por las leyes del Estado de Georgia, Estados Unidos, sin perjuicio de los derechos que te reconozca la ley de tu país de residencia como consumidor.'
                ]
            },
            {
                heading: '13. Cambios en estos términos',
                body: [
                    'Podemos actualizar estos términos. Si el cambio es importante, te avisaremos en la app o por correo antes de que entre en vigor. Si sigues usando el servicio después, entendemos que aceptas la nueva versión.'
                ]
            },
            {
                heading: '14. Contacto',
                body: [
                    `Para cualquier duda sobre estos términos escríbenos a ${CORREO} o desde "Ayuda y Soporte" en la app.`
                ]
            }
        ]
    },

    privacy: {
        title: 'Política de privacidad',
        intro: [
            `Esta política explica qué datos personales trata ${EMPRESA} (Estados Unidos) cuando usas Ludopata, para qué los usa y qué derechos tienes. Sabemos que la información que compartes aquí es muy personal, y la tratamos con ese cuidado.`
        ],
        sections: [
            {
                heading: '1. Qué datos recogemos',
                body: [
                    [
                        'Datos de la cuenta: nombre, apodo, correo electrónico, género, idioma y contraseña (guardada de forma cifrada, nunca en texto plano).',
                        'Perfil: tu foto y la información que decidas añadir.',
                        'Contenido que publicas: publicaciones, comentarios, historias, fotos, videos, votos y mensajes de chat.',
                        'Información de autoayuda que tú registras: juegos que te afectan, motivos y compromisos, recaídas, deudas y pagos, estrategias, respuestas a formularios de autoevaluación y conversaciones con el asistente virtual o con nuestro equipo. Puede incluir información sobre tu salud y tu situación económica: solo la registras si quieres y solo la usamos para prestarte el servicio.',
                        'Pagos: si te suscribes, guardamos tu plan, las fechas de tu suscripción y los identificadores que nos da Stripe. Los datos de tu tarjeta los trata Stripe; nosotros no los vemos.',
                        'Soporte: lo que nos escribes cuando pides ayuda o envías una sugerencia.',
                        'Datos técnicos: dirección IP, tipo de navegador y dispositivo, y registros del servidor necesarios para la seguridad y el funcionamiento.'
                    ],
                    'No accedemos a tu ubicación, contactos ni otros datos de tu dispositivo.'
                ]
            },
            {
                heading: '2. Para qué los usamos',
                body: [
                    [
                        'Crear y mantener tu cuenta, y verificar tu correo.',
                        'Mostrar tus herramientas personales y tu contenido en la comunidad.',
                        'Enviarte correos del servicio: códigos de verificación, recuperación de contraseña y avisos de actividad (por ejemplo, comentarios en tus publicaciones).',
                        'Darte respuestas del asistente virtual y, si lo pides, el acompañamiento de nuestro equipo.',
                        'Cobrar y gestionar tu suscripción.',
                        'Moderar la comunidad, revisar reportes y prevenir abusos y fraudes.',
                        'Atender tus mensajes de soporte y mejorar el servicio.'
                    ],
                    'Tratamos tus datos porque son necesarios para darte el servicio que pides, porque nos das tu consentimiento (por ejemplo, al registrar información de autoayuda) o por nuestro interés legítimo en mantener el servicio seguro. Puedes retirar tu consentimiento en cualquier momento borrando esa información o tu cuenta.'
                ]
            },
            {
                heading: '3. Lo que nunca hacemos',
                body: [
                    'No vendemos tus datos. No los compartimos con casas de apuestas, anunciantes, aseguradoras ni entidades financieras. No usamos tu información para publicidad.'
                ]
            },
            {
                heading: '4. Quién más trata tus datos',
                body: [
                    'Usamos proveedores que tratan datos solo por encargo nuestro y para prestarnos su servicio:',
                    [
                        'Amazon Web Services: servidores y almacenamiento de archivos (Estados Unidos).',
                        'Neon: base de datos (Estados Unidos).',
                        'Stripe: procesamiento de pagos.',
                        'OpenAI: respuestas del asistente virtual e informes de los formularios.',
                        'DeepL: traducción automática del contenido de la comunidad.',
                        'Hostinger: alojamiento del sitio web y envío de correos.'
                    ],
                    'También podemos revelar datos si una ley u orden judicial nos obliga, o para proteger la seguridad de alguna persona.',
                    'Dentro de la app, tus registros personales (deudas, recaídas, compromisos, formularios) solo los ves tú. Tus publicaciones y comentarios los ve la comunidad. El equipo de Ludopata solo accede a tu información cuando hace falta para atenderte, moderar contenido reportado o resolver un problema técnico.'
                ]
            },
            {
                heading: '5. Transferencias internacionales',
                body: [
                    'Nuestros servidores y varios proveedores están en Estados Unidos, así que tus datos pueden tratarse fuera de tu país. Elegimos proveedores que ofrecen garantías adecuadas de protección.'
                ]
            },
            {
                heading: '6. Cuánto tiempo los guardamos',
                body: [
                    'Guardamos tus datos mientras tengas tu cuenta. Si pides eliminarla, borramos tus datos personales y tu contenido, salvo lo que la ley nos obligue a conservar (por ejemplo, registros de pagos con fines fiscales). Las copias de seguridad se sobrescriben en un plazo limitado.'
                ]
            },
            {
                heading: '7. Tus derechos',
                body: [
                    'Puedes pedirnos acceder a tus datos, corregirlos, eliminarlos, recibir una copia, oponerte a un tratamiento o limitarlo. Muchos datos puedes cambiarlos tú desde tu perfil, y desde ahí también puedes pedir la eliminación de tu cuenta.',
                    `Para cualquier otra solicitud escríbenos a ${CORREO}. Te responderemos en un máximo de 30 días. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la autoridad de protección de datos de tu país.`
                ]
            },
            {
                heading: '8. Seguridad',
                body: [
                    'La información viaja cifrada (HTTPS), las contraseñas se guardan cifradas y el acceso interno está limitado a quien lo necesita. Ningún sistema es infalible: si ocurriera un incidente que afecte tus datos, te avisaremos.'
                ]
            },
            {
                heading: '9. Cookies y almacenamiento del navegador',
                body: [
                    'No usamos cookies de publicidad ni de analítica. Guardamos en tu navegador lo necesario para que funcione la app: tu sesión y preferencias como el idioma. La página de pago de Stripe usa sus propias cookies para procesar el pago y prevenir fraudes.'
                ]
            },
            {
                heading: '10. Menores de edad',
                body: [
                    'Ludopata es solo para mayores de 18 años. Si descubrimos que una cuenta pertenece a un menor, la eliminaremos.'
                ]
            },
            {
                heading: '11. Cambios en esta política',
                body: [
                    'Si cambiamos esta política de forma importante, te avisaremos en la app o por correo antes de que entre en vigor.'
                ]
            },
            {
                heading: '12. Contacto',
                body: [
                    `Responsable: ${EMPRESA} (Estados Unidos). Correo: ${CORREO}.`
                ]
            }
        ]
    },

    refunds: {
        title: 'Política de cancelación y reembolsos',
        intro: [
            'Queremos que pagar por Ludopata sea claro y sin sorpresas. Aquí explicamos cómo cancelar y cuándo devolvemos un pago.'
        ],
        sections: [
            {
                heading: '1. Cómo funciona el cobro',
                body: [
                    'El plan Premium se paga por adelantado al suscribirte y se renueva automáticamente al final de cada periodo. Si es tu primera suscripción, el siguiente cobro se retrasa 7 días como regalo. La fecha del siguiente cobro aparece en la página de pago.'
                ]
            },
            {
                heading: '2. Cancelar',
                body: [
                    'Puedes cancelar la renovación automática cuando quieras desde la sección de suscripción de la app. No se te volverá a cobrar, y mantienes el Premium hasta el final del periodo que ya pagaste. Después, tu cuenta vuelve al plan gratuito y conservas toda tu información.'
                ]
            },
            {
                heading: '3. Cuándo hacemos un reembolso',
                body: [
                    'Te devolvemos el dinero completo en estos casos:',
                    [
                        'Cobro duplicado o por un importe distinto al que se te mostró.',
                        'Cobro de una renovación después de que cancelaste a tiempo.',
                        'Un fallo técnico de nuestra parte que te impidió usar el Premium y que no pudimos resolver.',
                        'Si cerramos tu cuenta sin que hayas incumplido los términos (en ese caso, la parte del periodo que no usaste).'
                    ],
                    'Fuera de estos casos, los periodos ya empezados no se reembolsan, ni total ni parcialmente, salvo que la ley de tu país lo exija.'
                ]
            },
            {
                heading: '4. Cómo pedirlo',
                body: [
                    'Escríbenos desde "Ayuda y Soporte" en la app o a info@ludopata.org en los 30 días siguientes al cobro. Incluye el correo de tu cuenta, la fecha del cobro y el plan. Te responderemos en un máximo de 5 días hábiles.',
                    'Los reembolsos aprobados se devuelven al mismo medio de pago a través de Stripe. Según tu banco, pueden tardar entre 5 y 10 días hábiles en aparecer.'
                ]
            },
            {
                heading: '5. Antes de disputar un cargo',
                body: [
                    'Si no reconoces un cobro, escríbenos antes de abrir una disputa con tu banco: casi siempre podemos resolverlo más rápido. Al abrir una disputa, Stripe puede suspender la suscripción mientras se revisa.'
                ]
            }
        ]
    }
};

export default es;

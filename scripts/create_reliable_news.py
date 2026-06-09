import html
import json
import os
import time
import urllib.error
import urllib.request


API_BASE = "https://ga-c0745f1cf0154a6cab5f8599d47e9b0c.ecs.us-east-2.on.aws"
SPANISH_LANGUAGE_ID = "6892a523-0dc1-4e3b-9ddd-c9a558c7920b"
DEFAULT_MEDIA_URL = "https://s3.us-east-2.amazonaws.com/ludopata.org/es.png"


def post_json(path, token, body, retries=3):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method="POST")
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if not payload.get("status", False):
                    raise RuntimeError(f"API status=false: {payload}")
                return payload
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError):
            if attempt == retries:
                raise
            time.sleep(1.5 * attempt)


def content_html(summary, why_it_matters, current_reality, source_name, source_url):
    body = (
        f"<p>{html.escape(summary)}</p>"
        f"<p><strong>Por qué importa:</strong> {html.escape(why_it_matters)}</p>"
        f"<p><strong>Realidad actual:</strong> {html.escape(current_reality)}</p>"
        "<p>Esta nota es informativa y no reemplaza una evaluación clínica. "
        "Si el juego se combina con ansiedad, depresión, deuda o pérdida de control, "
        "conviene buscar apoyo profesional y activar límites de protección.</p>"
    )
    source = (
        f'<p><strong>Fuente:</strong> <a href="{html.escape(source_url)}" '
        f'target="_blank" rel="noopener noreferrer">{html.escape(source_name)}</a></p>'
    )
    return body + source


NEWS = [
    {
        "title": "OMS: el juego problemático ya es un tema de salud pública",
        "source_name": "Organización Mundial de la Salud",
        "source_url": "https://www.who.int/news-room/fact-sheets/detail/gambling",
        "summary": "La OMS advierte que el juego puede producir daños financieros, familiares y de salud mental, especialmente cuando se vuelve frecuente, impulsivo o difícil de controlar.",
        "why": "El juego no afecta únicamente el bolsillo: puede deteriorar sueño, ánimo, relaciones y capacidad de tomar decisiones.",
        "reality": "La expansión de plataformas digitales hace que la exposición sea permanente, con apuestas disponibles desde el teléfono a cualquier hora.",
    },
    {
        "title": "The Lancet: el casino ahora cabe en el bolsillo",
        "source_name": "The Lancet Public Health Commission",
        "source_url": "https://www.thelancet.com/commissions/gambling",
        "summary": "Una comisión de The Lancet Public Health describe el juego como una amenaza global creciente, impulsada por tecnología, publicidad digital y productos cada vez más accesibles.",
        "why": "El riesgo aumenta cuando las apuestas se integran al celular, a eventos deportivos y a rutinas cotidianas.",
        "reality": "El usuario ya no necesita desplazarse a un casino: puede apostar en segundos, repetir jugadas y recibir estímulos constantes.",
    },
    {
        "title": "Jóvenes y apuestas: una generación expuesta antes de entender el riesgo",
        "source_name": "UK Gambling Commission",
        "source_url": "https://www.gamblingcommission.gov.uk/statistics-and-research/publication/young-people-and-gambling-2024",
        "summary": "El informe británico sobre jóvenes y juego muestra que la exposición al juego comienza temprano, incluso antes de la edad legal para muchos productos.",
        "why": "La adolescencia es una etapa de alta sensibilidad a recompensas, presión social y toma de decisiones impulsiva.",
        "reality": "La mezcla de videojuegos, redes sociales, deportes y publicidad puede normalizar el juego como entretenimiento común.",
    },
    {
        "title": "Gambling Survey GB: el juego online gana peso en la rutina diaria",
        "source_name": "UK Gambling Commission",
        "source_url": "https://www.gamblingcommission.gov.uk/statistics-and-research/publication/gambling-survey-for-great-britain-annual-report-2024",
        "summary": "La encuesta de Gran Bretaña confirma que el juego online forma parte de los hábitos de una proporción relevante de adultos.",
        "why": "Cuando el acceso es remoto, rápido y privado, algunas señales de deterioro pueden tardar más en ser detectadas por familiares o instituciones.",
        "reality": "El celular facilita apuestas frecuentes, sesiones cortas repetidas y seguimiento constante de resultados.",
    },
    {
        "title": "Depresión y juego: una combinación que puede intensificar el aislamiento",
        "source_name": "National Library of Medicine",
        "source_url": "https://pubmed.ncbi.nlm.nih.gov/?term=gambling+disorder+depression+systematic+review",
        "summary": "La literatura científica vincula el juego problemático con síntomas depresivos, culpa, aislamiento y deterioro del funcionamiento diario.",
        "why": "Una persona puede usar el juego para aliviar tristeza por momentos, pero las pérdidas y la culpa pueden empeorar el malestar.",
        "reality": "Los formularios de tamizaje deben explorar no solo cuánto apuesta una persona, sino qué emoción intenta regular cuando apuesta.",
    },
    {
        "title": "Ansiedad y apuestas: la urgencia por recuperar control",
        "source_name": "National Library of Medicine",
        "source_url": "https://pubmed.ncbi.nlm.nih.gov/?term=gambling+disorder+anxiety",
        "summary": "Estudios indexados relacionan ansiedad y juego problemático, especialmente cuando la persona apuesta para reducir tensión o escapar de preocupaciones.",
        "why": "La ansiedad puede empujar decisiones rápidas, búsqueda de certeza y dificultad para detenerse ante pérdidas.",
        "reality": "Las apuestas en vivo y las notificaciones móviles aumentan la presión de decidir en poco tiempo.",
    },
    {
        "title": "El juego problemático también se refleja en el sueño",
        "source_name": "National Library of Medicine",
        "source_url": "https://pubmed.ncbi.nlm.nih.gov/?term=problem+gambling+sleep",
        "summary": "La investigación sobre juego problemático describe alteraciones del sueño, preocupación persistente y seguimiento nocturno de resultados como señales frecuentes.",
        "why": "Dormir peor puede reducir autocontrol, aumentar irritabilidad y favorecer decisiones impulsivas al día siguiente.",
        "reality": "El teléfono permite apostar o revisar marcadores de madrugada, extendiendo el ciclo de activación emocional.",
    },
    {
        "title": "Juego, deuda y salud mental: una cadena de riesgo",
        "source_name": "Organización Mundial de la Salud",
        "source_url": "https://www.who.int/news-room/fact-sheets/detail/gambling",
        "summary": "La OMS señala que los daños del juego incluyen endeudamiento, conflicto familiar, estrés psicológico y consecuencias sociales amplias.",
        "why": "La deuda puede transformar una conducta recreativa en una fuente constante de angustia.",
        "reality": "El acceso a tarjetas, billeteras digitales y créditos rápidos puede acelerar pérdidas sin que el usuario perciba el acumulado.",
    },
    {
        "title": "Apuestas deportivas: cuando el deporte deja de ser entretenimiento",
        "source_name": "American Psychological Association",
        "source_url": "https://www.apa.org/news/press/releases/2024/03/sports-betting-addiction",
        "summary": "La APA ha advertido sobre el crecimiento de las apuestas deportivas y su potencial relación con conductas adictivas, especialmente en públicos jóvenes.",
        "why": "El vínculo emocional con equipos y partidos puede hacer que el riesgo parezca menor de lo que realmente es.",
        "reality": "Las apuestas en vivo convierten cada jugada en una posible decisión financiera.",
    },
    {
        "title": "CDC: salud mental juvenil bajo presión en la era digital",
        "source_name": "Centers for Disease Control and Prevention",
        "source_url": "https://www.cdc.gov/yrbs/",
        "summary": "Los datos del CDC sobre juventud muestran preocupación sostenida por tristeza persistente, salud mental y conductas de riesgo en adolescentes.",
        "why": "Cuando la vulnerabilidad emocional coincide con acceso digital a apuestas o dinámicas similares al azar, el riesgo preventivo aumenta.",
        "reality": "Las futuras generaciones crecen con pantallas, recompensas inmediatas y publicidad personalizada.",
    },
    {
        "title": "Ganancias récord: la industria del juego comercial sigue creciendo",
        "source_name": "American Gaming Association",
        "source_url": "https://www.americangaming.org/resources/state-of-the-states-2025/",
        "summary": "La American Gaming Association reportó que el juego comercial en Estados Unidos alcanzó nuevos niveles de ingresos en los últimos años.",
        "why": "El crecimiento económico de la industria debe leerse junto con políticas de prevención, tratamiento y juego responsable.",
        "reality": "Casinos, apuestas deportivas e iGaming forman un ecosistema cada vez más rentable y más digital.",
    },
    {
        "title": "2024 cerró con otro máximo para el juego comercial en EE. UU.",
        "source_name": "American Gaming Association",
        "source_url": "https://www.americangaming.org/news/american-gaming-association-commercial-gaming-revenue-tracker/",
        "summary": "El Commercial Gaming Revenue Tracker de la AGA documenta el fuerte desempeño reciente de casinos, apuestas deportivas e iGaming.",
        "why": "Los ingresos altos muestran demanda creciente y también la necesidad de medir daños, no solo ganancias.",
        "reality": "El mercado moderno combina espacios físicos, aplicaciones, promociones y pagos digitales.",
    },
    {
        "title": "Apuestas deportivas: motor de crecimiento para la industria",
        "source_name": "American Gaming Association",
        "source_url": "https://www.americangaming.org/research/state-of-play/",
        "summary": "La expansión legal de las apuestas deportivas ha abierto una nueva fuente de ingresos para operadores y estados.",
        "why": "A medida que el producto crece, también crece la exposición de usuarios que antes solo consumían deporte.",
        "reality": "El partido ya no es solo un evento deportivo: para muchos usuarios se convierte en una experiencia financiera continua.",
    },
    {
        "title": "iGaming: el casino digital acelera la competencia por la atención",
        "source_name": "American Gaming Association",
        "source_url": "https://www.americangaming.org/news/american-gaming-association-commercial-gaming-revenue-tracker/",
        "summary": "Los datos de ingresos de la AGA muestran que el iGaming es una de las líneas de mayor dinamismo dentro del juego comercial.",
        "why": "El casino digital reduce fricción: no hay traslado, horario ni barrera social visible.",
        "reality": "La experiencia se parece más a una aplicación cotidiana que a una visita excepcional al casino.",
    },
    {
        "title": "Reino Unido: el juego online representa una parte central del mercado",
        "source_name": "UK Gambling Commission",
        "source_url": "https://www.gamblingcommission.gov.uk/statistics-and-research/publication/industry-statistics-november-2024",
        "summary": "Las estadísticas de la industria británica muestran el peso económico del juego remoto y su papel dentro del mercado regulado.",
        "why": "El crecimiento online exige monitoreo de accesibilidad, publicidad, gasto acumulado y daños invisibles.",
        "reality": "El juego remoto permite apostar desde casa, transporte, trabajo o cualquier espacio con conexión.",
    },
    {
        "title": "El celular como puerta de entrada al juego continuo",
        "source_name": "DataReportal",
        "source_url": "https://datareportal.com/reports/digital-2025-global-overview-report",
        "summary": "DataReportal muestra que el uso global de teléfonos móviles e internet sigue siendo masivo, creando una infraestructura ideal para servicios digitales permanentes.",
        "why": "Cuando una conducta de riesgo vive dentro del dispositivo principal de la persona, los límites requieren más diseño y autocontrol.",
        "reality": "Las apuestas compiten por atención con redes sociales, mensajería y entretenimiento móvil.",
    },
    {
        "title": "Publicidad digital: exposición personalizada al riesgo",
        "source_name": "The Lancet Public Health Commission",
        "source_url": "https://www.thelancet.com/commissions/gambling",
        "summary": "The Lancet describe cómo la tecnología y el marketing digital pueden ampliar el alcance de productos de juego.",
        "why": "La publicidad segmentada puede llegar justo cuando el usuario está más vulnerable o más interesado.",
        "reality": "Bonos, cuotas destacadas y promociones pueden normalizar apuestas repetidas desde el celular.",
    },
    {
        "title": "Futuras generaciones: prevención antes de la primera deuda",
        "source_name": "UNICEF",
        "source_url": "https://www.unicef.org/reports/state-worlds-children-2021",
        "summary": "UNICEF ha subrayado la importancia de atender la salud mental de niñas, niños y adolescentes como prioridad social.",
        "why": "La prevención del juego problemático debe integrarse con educación emocional, alfabetización digital y protección financiera.",
        "reality": "El reto no es solo prohibir: es enseñar límites, detectar señales tempranas y reducir exposición dañina.",
    },
    {
        "title": "Cuando apostar se vuelve una forma de regular emociones",
        "source_name": "National Library of Medicine",
        "source_url": "https://pubmed.ncbi.nlm.nih.gov/?term=gambling+emotion+regulation",
        "summary": "Investigaciones sobre regulación emocional explican que algunas personas apuestan para escapar, calmarse o sentir control momentáneo.",
        "why": "Si la apuesta funciona como alivio emocional, la conducta puede repetirse incluso cuando causa pérdidas.",
        "reality": "Las herramientas de evaluación deben preguntar por tristeza, ansiedad, enojo, soledad y aburrimiento antes de jugar.",
    },
    {
        "title": "La pérdida de control no siempre empieza con grandes montos",
        "source_name": "Organización Mundial de la Salud",
        "source_url": "https://www.who.int/news-room/fact-sheets/detail/gambling",
        "summary": "Los daños del juego pueden acumularse por frecuencia, tiempo, ocultamiento y deterioro relacional, no solo por el tamaño de una apuesta.",
        "why": "Apuestas pequeñas pero repetidas pueden construir un patrón difícil de ver hasta que ya afecta la vida diaria.",
        "reality": "Las microapuestas móviles y pagos digitales hacen menos visible el gasto acumulado.",
    },
    {
        "title": "Juego responsable: la industria crece, la protección debe crecer también",
        "source_name": "National Council on Problem Gambling",
        "source_url": "https://www.ncpgambling.org/",
        "summary": "Organizaciones especializadas en juego problemático promueven prevención, tratamiento, autoexclusión y herramientas de límites.",
        "why": "El crecimiento de ingresos sin inversión proporcional en prevención puede dejar atrás a usuarios vulnerables.",
        "reality": "La protección moderna requiere límites de depósito, alertas de tiempo, mensajes claros y rutas de ayuda visibles.",
    },
    {
        "title": "Apuestas y familia: daños que van más allá del usuario",
        "source_name": "The Lancet Public Health Commission",
        "source_url": "https://www.thelancet.com/commissions/gambling",
        "summary": "The Lancet enfatiza que los daños del juego alcanzan a familias, comunidades y sistemas de salud, no solo a la persona que apuesta.",
        "why": "Mentiras, deuda, conflicto y pérdida de confianza pueden afectar hogares completos.",
        "reality": "Las evaluaciones deben incluir impacto social, comunicación familiar y apoyo disponible.",
    },
    {
        "title": "Deporte, identidad y riesgo: por qué apostar no se siente como azar",
        "source_name": "American Psychological Association",
        "source_url": "https://www.apa.org/news/press/releases/2024/03/sports-betting-addiction",
        "summary": "La psicología del deporte y las apuestas muestra que la familiaridad con equipos puede crear sensación de control.",
        "why": "Sentirse experto puede hacer que una persona subestime la incertidumbre real del resultado.",
        "reality": "Las aplicaciones refuerzan esa confianza con estadísticas, cuotas y transmisiones en tiempo real.",
    },
    {
        "title": "Datos, cuotas y velocidad: el nuevo lenguaje de las apuestas",
        "source_name": "UK Gambling Commission",
        "source_url": "https://www.gamblingcommission.gov.uk/statistics-and-research",
        "summary": "Los reguladores observan un ecosistema de apuestas cada vez más dependiente de datos, interfaces digitales y productos remotos.",
        "why": "La velocidad de la interfaz puede superar la capacidad del usuario para reflexionar sobre el riesgo.",
        "reality": "Cada notificación, cuota o actualización puede convertirse en un disparador de conducta impulsiva.",
    },
    {
        "title": "Evaluar al jugador moderno exige mirar salud mental y tecnología",
        "source_name": "Organización Mundial de la Salud",
        "source_url": "https://www.who.int/news-room/fact-sheets/detail/gambling",
        "summary": "La evaluación del comportamiento de jugadores debe integrar frecuencia, pérdidas, emociones, relaciones, acceso digital y señales de ansiedad o depresión.",
        "why": "El problema actual no es únicamente cuánto se apuesta, sino por qué, cuándo, desde dónde y con qué consecuencias.",
        "reality": "El teléfono, los pagos digitales y las apuestas en vivo cambiaron la forma en que se desarrolla el riesgo.",
    },
]


def main():
    token = os.environ.get("GAMBLER_ADMIN_TOKEN")
    if not token:
        raise SystemExit("Set GAMBLER_ADMIN_TOKEN before running this script.")

    results = []
    for index, item in enumerate(NEWS, start=1):
        body = {
            "languageId": SPANISH_LANGUAGE_ID,
            "title": item["title"],
            "mediaUrl": DEFAULT_MEDIA_URL,
            "mediaType": 0,
            "contentHtml": content_html(
                item["summary"],
                item["why"],
                item["reality"],
                item["source_name"],
                item["source_url"],
            ),
        }
        created = post_json("/api/News/createNews", token, body)
        news_id = created["data"]
        print(f"[{index:02d}/{len(NEWS)}] News created: {news_id} - {item['title']}")
        results.append({
            "newsId": news_id,
            "title": item["title"],
            "sourceName": item["source_name"],
            "sourceUrl": item["source_url"],
        })

    output_path = os.path.join(os.getcwd(), "created_reliable_news.json")
    with open(output_path, "w", encoding="utf-8") as output:
        json.dump(results, output, ensure_ascii=False, indent=2)
    print(f"Report written: {output_path}")


if __name__ == "__main__":
    main()

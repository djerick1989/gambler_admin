import json
import os
import time
import urllib.error
import urllib.request


API_BASE = "https://api.ludopata.org"
SPANISH_LANGUAGE_ID = "6892a523-0dc1-4e3b-9ddd-c9a558c7920b"
SELF_ASSESSMENT_CATEGORY_ID = "93afb95a-4631-4bd6-b305-9450b9950b47"
AUTODIAGNOSIS_CATEGORY_ID = "a829a662-96cc-46ab-a693-9e40ac853fa5"

FORM_TYPE_SELF_ASSESSMENT = 0
FORM_TYPE_GAMBLING_PROBLEM = 1
FORM_TYPE_ADDICTION_EVALUATION = 2
QUESTION_TYPE_SINGLE_CHOICE = 0

LIKERT_OPTIONS = ["Nunca", "Rara vez", "A veces", "Frecuentemente", "Casi siempre"]


def request_json(method, path, token, body=None, retries=3):
    data = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if not payload.get("status", False):
                    raise RuntimeError(f"API status=false: {payload}")
                return payload
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError) as exc:
            last_error = exc
            if attempt == retries:
                raise
            time.sleep(1.5 * attempt)
    raise last_error


def q(text):
    return {
        "questionText": text,
        "questionType": QUESTION_TYPE_SINGLE_CHOICE,
        "required": True,
        "answerOptions": LIKERT_OPTIONS,
    }


casino_control = [
    "¿Has jugado en casino más tiempo del que planeabas inicialmente?",
    "¿Te resulta difícil detenerte cuando estás ganando?",
    "¿Te resulta difícil detenerte cuando estás perdiendo?",
    "¿Has vuelto al casino para intentar recuperar dinero perdido?",
    "¿Has aumentado la cantidad de dinero apostada para sentir la misma emoción?",
    "¿Has ocultado a otras personas cuánto tiempo pasas jugando en casinos?",
    "¿Has ocultado a otras personas cuánto dinero gastas en casinos?",
    "¿Has usado dinero destinado a gastos importantes para jugar?",
    "¿Has pedido dinero prestado para seguir jugando en casino?",
    "¿Has sentido culpa después de jugar en casino?",
    "¿Has sentido irritación cuando no puedes jugar?",
    "¿Has dejado responsabilidades por ir a jugar?",
    "¿Has pensado en el casino mientras realizas otras actividades?",
    "¿Has jugado para aliviar tristeza, estrés o enojo?",
    "¿Has prometido reducir el juego y luego no lo has logrado?",
    "¿Has sentido que necesitas apostar más para recuperar el control?",
    "¿Has tenido discusiones familiares o de pareja por jugar en casino?",
    "¿Has perdido sueño por quedarte jugando o pensando en jugar?",
    "¿Has minimizado tus pérdidas cuando alguien te pregunta?",
    "¿Has sentido que el casino controla parte de tus decisiones?",
]

casino_triggers = [
    "¿Sientes deseo de jugar cuando recibes dinero o cobras tu salario?",
    "¿Te dan ganas de jugar cuando ves publicidad de casinos?",
    "¿Te impulsa a jugar pasar cerca de un casino o sala de apuestas?",
    "¿Juegas cuando te sientes aburrido o sin actividades claras?",
    "¿Juegas cuando te sientes solo o desconectado de otras personas?",
    "¿Juegas para escapar de preocupaciones personales?",
    "¿Te cuesta evitar invitaciones de amigos para ir al casino?",
    "¿El consumo de alcohol aumenta tus ganas de jugar?",
    "¿Las pérdidas recientes aumentan tu urgencia por volver a apostar?",
    "¿Las ganancias recientes te hacen apostar con menos cuidado?",
    "¿Revisas promociones o bonos aunque no planeabas jugar?",
    "¿Te dices que solo jugarás un poco y luego continúas?",
    "¿Sientes ansiedad antes de empezar a jugar?",
    "¿Sientes euforia intensa al anticipar una apuesta?",
    "¿Te cuesta salir del casino aunque ya cumpliste tu límite?",
    "¿Buscas cajeros, tarjetas o préstamos cuando se acaba tu efectivo?",
    "¿Ignoras señales físicas de cansancio o hambre mientras juegas?",
    "¿Te quedas jugando para no enfrentar problemas fuera del casino?",
    "¿Te cuesta aceptar una pérdida como definitiva?",
    "¿Crees que una racha ganadora está cerca después de perder varias veces?",
]

sports_control = [
    "¿Apuestas en deportes más veces por semana de lo que planeabas?",
    "¿Apuestas en partidos que no conoces bien solo por tener acción?",
    "¿Has apostado en vivo de forma impulsiva durante un partido?",
    "¿Has aumentado el monto de tus apuestas deportivas con el tiempo?",
    "¿Has intentado recuperar pérdidas apostando en más eventos el mismo día?",
    "¿Has ocultado tus apuestas deportivas a familiares o pareja?",
    "¿Has usado dinero reservado para gastos básicos en apuestas deportivas?",
    "¿Has pedido dinero prestado para apostar en deportes?",
    "¿Sientes ansiedad cuando no puedes revisar resultados o cuotas?",
    "¿Revisas marcadores o aplicaciones de apuestas de manera repetitiva?",
    "¿Has perdido sueño por seguir partidos o esperar resultados?",
    "¿Has apostado estando molesto, triste o bajo presión?",
    "¿Te cuesta disfrutar un deporte sin apostar?",
    "¿Has dejado responsabilidades por ver partidos apostados?",
    "¿Has discutido con otras personas por tus apuestas deportivas?",
    "¿Has prometido dejar de apostar y luego volviste a hacerlo?",
    "¿Sientes culpa después de una jornada de apuestas?",
    "¿Apuestas más cuando acabas de ganar?",
    "¿Apuestas más cuando acabas de perder?",
    "¿Sientes que las apuestas deportivas influyen demasiado en tu estado de ánimo?",
]

sports_distortions = [
    "¿Crees que conocer un equipo garantiza que puedes predecir el resultado?",
    "¿Confías demasiado en rachas, estadísticas aisladas o intuiciones?",
    "¿Sientes que una pérdida fue mala suerte y que debes compensarla pronto?",
    "¿Apuestas por recomendaciones de redes sociales sin analizarlas?",
    "¿Sigues pronosticadores aunque hayan fallado repetidamente?",
    "¿Te cuesta aceptar que una cuota alta también implica mayor riesgo?",
    "¿Piensas que apostar en muchos eventos reduce el riesgo total?",
    "¿Te convences de apostar porque el partido parece seguro?",
    "¿Cambias tu plan de apuesta por emociones durante el evento?",
    "¿Apuestas para sentir que participas más en el partido?",
    "¿Subestimas cuánto pierdes sumando apuestas pequeñas?",
    "¿Llevas un registro incompleto de tus apuestas?",
    "¿Celebras ganancias pequeñas e ignoras pérdidas acumuladas?",
    "¿Apuestas en combinadas aunque sabes que son difíciles de acertar?",
    "¿Sientes presión por apostar antes de que cambie una cuota?",
    "¿Tomas decisiones rápidas por miedo a perder una oportunidad?",
    "¿Justificas una apuesta diciendo que solo será esta vez?",
    "¿Crees que puedes recuperar el dinero si analizas mejor la siguiente apuesta?",
    "¿Te cuesta parar después de acertar una predicción?",
    "¿Te cuesta parar después de fallar una predicción?",
]

depression_mood = [
    "¿Has sentido poco interés o placer en actividades que antes disfrutabas?",
    "¿Has sentido tristeza, vacío o desesperanza durante el día?",
    "¿Te ha costado levantarte o iniciar tus actividades cotidianas?",
    "¿Has tenido menos energía de lo habitual?",
    "¿Has sentido cansancio incluso después de descansar?",
    "¿Has dormido mucho más o mucho menos de lo normal?",
    "¿Has notado cambios importantes en tu apetito?",
    "¿Te ha costado concentrarte en tareas simples?",
    "¿Has sentido que no vales lo suficiente?",
    "¿Has sentido culpa excesiva por errores pasados?",
    "¿Te has aislado de familiares, amistades o actividades sociales?",
    "¿Has sentido que el futuro se ve difícil o sin salida?",
    "¿Has usado el juego o las apuestas para dejar de sentir tristeza?",
    "¿Has perdido motivación para cuidar tu salud o tus responsabilidades?",
    "¿Te ha costado disfrutar logros o momentos positivos?",
    "¿Has sentido irritabilidad relacionada con tristeza o agotamiento?",
    "¿Has evitado hablar de cómo te sientes?",
    "¿Has sentido que tus problemas emocionales afectan tus decisiones de juego?",
    "¿Has pensado que jugar podría mejorar temporalmente tu ánimo?",
    "¿Has sentido que necesitas apoyo emocional pero no sabes cómo pedirlo?",
]

depression_functional = [
    "¿Tu estado de ánimo ha afectado tu rendimiento laboral o académico?",
    "¿Has dejado de cumplir compromisos por falta de energía?",
    "¿Has descuidado pagos, trámites o tareas del hogar?",
    "¿Te ha costado mantener rutinas básicas de autocuidado?",
    "¿Has reducido el contacto con personas importantes para ti?",
    "¿Has rechazado invitaciones por sentirte sin ánimo?",
    "¿Has sentido que pequeñas tareas se vuelven abrumadoras?",
    "¿Has postergado decisiones importantes por desmotivación?",
    "¿Has tenido dificultad para tomar decisiones financieras?",
    "¿Has usado apuestas para llenar tiempo cuando te sientes sin propósito?",
    "¿Has sentido alivio momentáneo al jugar seguido de mayor malestar?",
    "¿Has dejado de practicar actividades saludables por jugar o aislarte?",
    "¿Has sentido que tu ánimo cambia mucho después de ganar o perder?",
    "¿Has tenido menos paciencia con personas cercanas?",
    "¿Has sentido vergüenza por tu estado emocional?",
    "¿Has evitado buscar ayuda por pensar que deberías resolverlo solo?",
    "¿Has sentido que tus emociones te llevan a decisiones impulsivas?",
    "¿Has tenido días en los que casi nada te parece importante?",
    "¿Has sentido que las pérdidas de juego empeoran tu ánimo por varios días?",
    "¿Has notado que tu bienestar depende demasiado del resultado de apuestas o juegos?",
]

anxiety_symptoms = [
    "¿Te has sentido nervioso, inquieto o en tensión sin poder relajarte?",
    "¿Te ha costado controlar preocupaciones repetitivas?",
    "¿Has sentido miedo a que algo malo ocurra?",
    "¿Has tenido palpitaciones, sudoración o temblores por preocupación?",
    "¿Has sentido presión en el pecho o dificultad para respirar por ansiedad?",
    "¿Te ha costado dormir por pensamientos acelerados?",
    "¿Has revisado repetidamente resultados, mensajes o cuentas por ansiedad?",
    "¿Te cuesta esperar sin mirar el celular o una aplicación de apuestas?",
    "¿Has apostado para calmar inquietud o tensión?",
    "¿Has sentido ansiedad cuando intentas no jugar o no apostar?",
    "¿Te irritas cuando alguien interrumpe tus planes de apostar?",
    "¿Sientes urgencia por resolver una pérdida de inmediato?",
    "¿Anticipas escenarios negativos aunque no tengas evidencia clara?",
    "¿Evitas conversaciones por miedo a críticas sobre tu juego?",
    "¿Te preocupa que otros descubran cuánto juegas o apuestas?",
    "¿Has sentido tensión muscular o dolor de cabeza por preocupación?",
    "¿Te cuesta concentrarte por pensar en dinero, deudas o resultados?",
    "¿Buscas certeza antes de decidir, pero nunca te sientes tranquilo?",
    "¿Sientes alivio breve al apostar y luego vuelve la ansiedad?",
    "¿La ansiedad influye en cuánto dinero decides arriesgar?",
]

anxiety_risk = [
    "¿Tomas decisiones de juego apresuradas cuando te sientes ansioso?",
    "¿Aumentas tus apuestas para terminar rápido con la incertidumbre?",
    "¿Apuestas para distraerte de preocupaciones económicas?",
    "¿Revisas tu saldo o deudas de manera compulsiva?",
    "¿Te cuesta poner límites cuando estás bajo presión emocional?",
    "¿Te cuesta decir que no a una apuesta por miedo a perder una oportunidad?",
    "¿Sientes urgencia por actuar aunque sabes que conviene esperar?",
    "¿Interpretas una pérdida como señal de que debes hacer algo de inmediato?",
    "¿Te cuesta seguir un presupuesto cuando estás nervioso?",
    "¿Evitas pedir ayuda por miedo a ser juzgado?",
    "¿La incertidumbre de un resultado deportivo te altera durante horas?",
    "¿Te cuesta disfrutar actividades tranquilas sin revisar apuestas o juegos?",
    "¿Has discutido con alguien por estar tenso después de apostar?",
    "¿Te sientes atrapado entre querer parar y sentir urgencia por continuar?",
    "¿La ansiedad aumenta cuando no tienes dinero disponible para jugar?",
    "¿Has usado créditos, adelantos o préstamos para reducir ansiedad momentánea?",
    "¿Te cuesta reconocer señales corporales antes de apostar impulsivamente?",
    "¿Has tomado apuestas nocturnas por no poder dormir?",
    "¿El miedo a perder te hace apostar de forma menos racional?",
    "¿La ansiedad afecta tu capacidad para evaluar riesgos reales?",
]

behavior_patterns = [
    "¿Llevas un registro claro de cuánto dinero juegas o apuestas?",
    "¿Defines un límite de dinero antes de empezar?",
    "¿Respetas el límite de dinero que definiste?",
    "¿Defines un límite de tiempo antes de empezar?",
    "¿Respetas el límite de tiempo que definiste?",
    "¿Evitas jugar cuando estás bajo emociones intensas?",
    "¿Evitas jugar cuando has consumido alcohol u otras sustancias?",
    "¿Hablas con alguien de confianza sobre tus hábitos de juego?",
    "¿Revisas tus pérdidas y ganancias con honestidad?",
    "¿Puedes pasar varios días sin apostar sin sentir malestar?",
    "¿Tienes actividades alternativas al juego para manejar estrés?",
    "¿Has instalado límites, bloqueos o controles de gasto?",
    "¿Consultas tus decisiones financieras antes de apostar montos altos?",
    "¿Identificas señales tempranas de pérdida de control?",
    "¿Te retiras cuando notas impulsividad o cansancio?",
    "¿Evitas perseguir pérdidas después de un mal resultado?",
    "¿Diferencias entretenimiento de necesidad emocional?",
    "¿Mantienes tus gastos esenciales separados del dinero para ocio?",
    "¿Reconoces cuándo una apuesta está afectando tu ánimo?",
    "¿Buscas apoyo cuando notas que el juego supera tus límites?",
]

family_social = [
    "¿El juego o las apuestas han reducido tiempo con tu familia?",
    "¿Has evitado reuniones sociales por preferir jugar o apostar?",
    "¿Has mentido sobre dónde estabas cuando estabas jugando?",
    "¿Has mentido sobre cuánto dinero perdiste o ganaste?",
    "¿Has recibido comentarios de preocupación por tu forma de jugar?",
    "¿Te molesta cuando alguien te pregunta por tus apuestas?",
    "¿Has tenido discusiones por deudas relacionadas con juego?",
    "¿Has dejado de compartir planes por vergüenza o culpa?",
    "¿Tus relaciones han cambiado por tu dedicación al juego?",
    "¿Has pedido a otros que cubran gastos por haber apostado dinero?",
    "¿Has cancelado compromisos por seguir jugando o viendo resultados?",
    "¿Te cuesta estar presente con otros por pensar en apuestas?",
    "¿Has sentido soledad después de jugar o apostar?",
    "¿Has evitado hablar de pérdidas con personas cercanas?",
    "¿Has sentido que decepcionas a alguien por tus hábitos de juego?",
    "¿Has prometido cambios a tu familia y luego no los mantuviste?",
    "¿El juego ha afectado la confianza en tus relaciones?",
    "¿Te aíslas más cuando pierdes dinero?",
    "¿Buscas compañía solo en ambientes relacionados con apuestas?",
    "¿Te sería difícil pedir apoyo a alguien cercano para reducir el juego?",
]


FORMS = [
    {
        "title": "Autoevaluación de control en juegos de casino",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Evalúa señales de pérdida de control, persecución de pérdidas y dificultad para detenerse en juegos de casino. Este formulario orienta riesgos y no reemplaza una valoración profesional.",
        "questions": casino_control,
    },
    {
        "title": "Autodiagnóstico de riesgo por casino",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_ADDICTION_EVALUATION,
        "description": "Identifica patrones compatibles con riesgo elevado de adicción al juego en casinos, incluyendo ocultamiento, endeudamiento, urgencia y afectación personal.",
        "questions": casino_control,
    },
    {
        "title": "Autoevaluación de detonantes para jugar en casino",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Explora situaciones, emociones y estímulos que pueden aumentar el deseo de jugar en casino para reconocer momentos de mayor vulnerabilidad.",
        "questions": casino_triggers,
    },
    {
        "title": "Autodiagnóstico de impulsividad en casino",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Ayuda a detectar decisiones impulsivas, dificultad para respetar límites y conductas de riesgo asociadas con el juego presencial o digital de casino.",
        "questions": casino_triggers,
    },
    {
        "title": "Autoevaluación de consecuencias por casino",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Revisa posibles consecuencias financieras, familiares, emocionales y de rutina relacionadas con el juego en casino.",
        "questions": family_social,
    },
    {
        "title": "Autoevaluación de control en apuestas deportivas",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Evalúa frecuencia, control, urgencia y afectación emocional vinculada con apuestas deportivas y apuestas en vivo.",
        "questions": sports_control,
    },
    {
        "title": "Autodiagnóstico de riesgo en apuestas deportivas",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_ADDICTION_EVALUATION,
        "description": "Identifica señales de riesgo elevado en apuestas deportivas, como persecución de pérdidas, aumento de montos, ocultamiento y dependencia del resultado.",
        "questions": sports_control,
    },
    {
        "title": "Autoevaluación de creencias sobre apuestas deportivas",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Explora sesgos, confianza excesiva y creencias de control que pueden influir en decisiones de apuestas deportivas.",
        "questions": sports_distortions,
    },
    {
        "title": "Autodiagnóstico de apuestas en vivo e impulsividad",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Permite reconocer decisiones rápidas, presión por cuotas y cambios emocionales durante apuestas deportivas en vivo.",
        "questions": sports_distortions,
    },
    {
        "title": "Autoevaluación de impacto financiero por apuestas",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Evalúa cómo las apuestas pueden afectar presupuesto, deudas, registro de gastos y decisiones económicas cotidianas.",
        "questions": behavior_patterns,
    },
    {
        "title": "Autoevaluación de estado de ánimo depresivo",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Explora señales de bajo estado de ánimo, pérdida de interés y reducción de energía que pueden relacionarse con decisiones de juego.",
        "questions": depression_mood,
    },
    {
        "title": "Autodiagnóstico de depresión y juego",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Identifica la relación entre tristeza, desesperanza, aislamiento y uso del juego o apuestas como forma de alivio emocional.",
        "questions": depression_mood,
    },
    {
        "title": "Autoevaluación de funcionamiento diario y depresión",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Evalúa cómo el ánimo bajo puede afectar rutinas, relaciones, responsabilidades y decisiones financieras o de juego.",
        "questions": depression_functional,
    },
    {
        "title": "Autodiagnóstico de impacto emocional por pérdidas",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Revisa si las pérdidas, deudas o resultados de juego intensifican síntomas de tristeza, culpa, aislamiento o desesperanza.",
        "questions": depression_functional,
    },
    {
        "title": "Autoevaluación de síntomas de ansiedad",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Explora señales de ansiedad, preocupación persistente, tensión física y dificultad para controlar pensamientos relacionados con juego o apuestas.",
        "questions": anxiety_symptoms,
    },
    {
        "title": "Autodiagnóstico de ansiedad y apuestas",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Identifica si la ansiedad, urgencia o necesidad de alivio emocional influyen en el comportamiento de juego y apuestas.",
        "questions": anxiety_symptoms,
    },
    {
        "title": "Autoevaluación de toma de decisiones bajo ansiedad",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Evalúa cómo la ansiedad puede afectar límites, impulsividad, manejo del dinero y tolerancia a la incertidumbre.",
        "questions": anxiety_risk,
    },
    {
        "title": "Autodiagnóstico de urgencia e incertidumbre",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Ayuda a reconocer conductas de riesgo cuando la incertidumbre, el miedo a perder o la presión emocional impulsan apuestas.",
        "questions": anxiety_risk,
    },
    {
        "title": "Autoevaluación integral del comportamiento del jugador",
        "category": SELF_ASSESSMENT_CATEGORY_ID,
        "formType": FORM_TYPE_SELF_ASSESSMENT,
        "description": "Revisa hábitos de control, límites, registro de gastos, autocuidado y señales tempranas de pérdida de control en jugadores.",
        "questions": behavior_patterns,
    },
    {
        "title": "Autodiagnóstico de impacto social y familiar del juego",
        "category": AUTODIAGNOSIS_CATEGORY_ID,
        "formType": FORM_TYPE_GAMBLING_PROBLEM,
        "description": "Evalúa cómo el juego o las apuestas pueden estar afectando relaciones, confianza, comunicación, compromisos y apoyo social.",
        "questions": family_social,
    },
]


def main():
    token = os.environ.get("GAMBLER_ADMIN_TOKEN")
    if not token:
        raise SystemExit("Set GAMBLER_ADMIN_TOKEN before running this script.")

    results = []
    for index, form in enumerate(FORMS, start=1):
        form_payload = {
            "formCategoryId": form["category"],
            "languageId": SPANISH_LANGUAGE_ID,
            "title": form["title"],
            "icon": "",
            "description": form["description"],
            "formType": form["formType"],
        }
        created = request_json("POST", "/api/Form/create", token, form_payload)
        form_id = created["data"]
        print(f"[{index:02d}/20] Form created: {form_id} - {form['title']}")

        question_ids = []
        for order, question in enumerate(form["questions"], start=1):
            question_payload = q(question)
            question_payload.update({
                "formId": form_id,
                "languageId": SPANISH_LANGUAGE_ID,
                "order": order,
            })
            created_question = request_json("POST", "/api/Form/question/create", token, question_payload)
            question_ids.append(created_question["data"])
            print(f"  - Q{order:02d}: {created_question['data']}")

        results.append({
            "formId": form_id,
            "title": form["title"],
            "formCategoryId": form["category"],
            "formType": form["formType"],
            "languageId": SPANISH_LANGUAGE_ID,
            "questionCount": len(question_ids),
            "questionIds": question_ids,
        })

    output_path = os.path.join(os.getcwd(), "created_behavior_forms.json")
    with open(output_path, "w", encoding="utf-8") as output:
        json.dump(results, output, ensure_ascii=False, indent=2)
    print(f"Report written: {output_path}")


if __name__ == "__main__":
    main()

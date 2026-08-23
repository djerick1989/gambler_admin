// Fondos disponibles para las historias de texto.
//
// El backend guarda el fondo en Status.Background como uno o dos colores hex
// separados por coma ("#6366F1" o "#6366F1,#A855F7"), de forma que cualquier
// cliente pueda construir el degradado con sus propias primitivas.
// Un valor nulo o inválido usa DEFAULT_STORY_BACKGROUND, que es el mismo
// degradado que tenían las historias antes de que el campo existiera.

export const DEFAULT_STORY_BACKGROUND = '#6366F1,#A855F7';

export const STORY_BACKGROUNDS = [
    DEFAULT_STORY_BACKGROUND,
    '#D49000,#8A5C00',
    '#EC4899,#8B5CF6',
    '#EF4444,#F97316',
    '#F59E0B,#DB2777',
    '#10B981,#06B6D4',
    '#0EA5E9,#2563EB',
    '#14B8A6,#0F766E',
    '#1E293B,#0F172A'
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const parseColors = (background) => {
    if (typeof background !== 'string') return [];
    return background
        .split(',')
        .map((color) => color.trim())
        .filter((color) => HEX_COLOR.test(color));
};

/**
 * Convierte el valor guardado en una propiedad `background` de CSS.
 * Acepta null/undefined/valores inválidos y cae al fondo por defecto.
 */
export const storyBackgroundToCss = (background) => {
    const colors = parseColors(background);
    const [from, to] = colors.length > 0 ? colors : parseColors(DEFAULT_STORY_BACKGROUND);
    return to ? `linear-gradient(135deg, ${from} 0%, ${to} 100%)` : from;
};

/** true si el valor guardado corresponde al fondo indicado (tolerante a mayúsculas). */
export const isSameStoryBackground = (a, b) =>
    (a || DEFAULT_STORY_BACKGROUND).toUpperCase() === (b || DEFAULT_STORY_BACKGROUND).toUpperCase();

export const DOPAMINE_TYPE = {
    DOPAMINE: 0,
    ADRENALINE: 1,
    REWARD_SYSTEM: 2,
    CONTROL: 3
};

export const DOPAMINE_ASSETS = {
    dopamine: '/dopamine/que-es-dopamina.jpg',
    adrenaline: '/dopamine/que-es-adrenalina.jpg',
    reward: '/dopamine/sistema-recompensas.jpg',
    control: '/dopamine/controla-dopamina.jpg',
    cover: '/dopamine/dopamina.jpg',
    moleculeIcon: '/dopamine/icon-molecule.png',
    adrenalineIcon: '/dopamine/icon-bolt.png',
    rewardIcon: '/dopamine/icon-reward-system.svg',
    controlIcon: '/dopamine/icon-dopamine-control.svg'
};

export const unwrapApiData = (response) => {
    const data = response?.data ?? response;
    if (data?.data !== undefined) return data.data;
    return data;
};

export const toArray = (value) => {
    const data = unwrapApiData(value);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.dopamines)) return data.dopamines;
    if (Array.isArray(data?.addictions)) return data.addictions;
    if (Array.isArray(data?.games)) return data.games;
    if (Array.isArray(data?.$values)) return data.$values;
    return data ? [data] : [];
};

export const getTranslationForLanguage = (entity, languageId) => {
    const translations = toArray(entity?.translations);
    const currentLanguageCode = languageId === '6892a523-0dc1-4e3b-9ddd-c9a558c7920b' ? 'ES' : 'EN';
    return (
        translations.find(translation => translation?.languageId === languageId) ||
        translations.find(translation => String(translation?.languageCode || '').toUpperCase() === currentLanguageCode) ||
        translations[0] ||
        {}
    );
};

export const normalizeTranslatedEntity = (entity, languageId) => {
    const translation = getTranslationForLanguage(entity, languageId);

    return {
        ...entity,
        title: translation.title || entity?.title || '',
        name: translation.name || entity?.name || '',
        description: translation.description || entity?.description || '',
        videoUrl: translation.videoUrl || translation.videoURL || entity?.videoUrl || entity?.videoURL || ''
    };
};

export const normalizeTranslatedList = (value, languageId, preferredIdKeys = []) => {
    const scoredItems = toArray(value)
        .map(entity => {
            const translations = toArray(entity?.translations);
            const currentLanguageCode = languageId === '6892a523-0dc1-4e3b-9ddd-c9a558c7920b' ? 'ES' : 'EN';
            const exactTranslation = translations.find(translation => (
                translation?.languageId === languageId ||
                String(translation?.languageCode || '').toUpperCase() === currentLanguageCode
            ));
            const rootMatchesLanguage = entity?.languageId === languageId;
            const score = exactTranslation ? 3 : rootMatchesLanguage ? 2 : !entity?.languageId ? 1 : 0;
            const updatedAt = entity?.updatedAt ? new Date(entity.updatedAt).getTime() : 0;

            return {
                entity: normalizeTranslatedEntity(entity, languageId),
                score,
                updatedAt
            };
        })
        .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);

    const seenIds = new Set();
    return scoredItems
        .map(item => item.entity)
        .filter(entity => {
            const id = getEntityId(entity, preferredIdKeys);
            if (!id) return true;
            if (seenIds.has(id)) return false;
            seenIds.add(id);
            return true;
        });
};

export const getEntityId = (entity, preferredKeys = []) => {
    const keys = [
        ...preferredKeys,
        'id',
        'dopamineId',
        'addictionId',
        'gameId',
        'dopamineFlowId',
        'flowId',
        'commitmentId',
        'dopamineCommitmentId'
    ];

    for (const key of keys) {
        if (entity?.[key]) return entity[key];
    }

    return null;
};

export const normalizeText = (value = '') => (
    String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
);

export const getDopamineVisual = (item) => {
    const type = Number(item?.type);
    const title = normalizeText(item?.title);

    if (type === DOPAMINE_TYPE.ADRENALINE || title.includes('adrenal')) return DOPAMINE_ASSETS.adrenaline;
    if (type === DOPAMINE_TYPE.REWARD_SYSTEM || title.includes('recompensa') || title.includes('reward')) return DOPAMINE_ASSETS.reward;
    if (type === DOPAMINE_TYPE.CONTROL || title.includes('control')) return DOPAMINE_ASSETS.control;
    return DOPAMINE_ASSETS.dopamine;
};

export const getDopamineIcon = (type) => {
    if (Number(type) === DOPAMINE_TYPE.ADRENALINE) return DOPAMINE_ASSETS.adrenalineIcon;
    if (Number(type) === DOPAMINE_TYPE.REWARD_SYSTEM) return DOPAMINE_ASSETS.rewardIcon;
    if (Number(type) === DOPAMINE_TYPE.CONTROL) return DOPAMINE_ASSETS.controlIcon;
    return DOPAMINE_ASSETS.moleculeIcon;
};

export const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace('www.', '');
        const videoId = host === 'youtu.be'
            ? parsed.pathname.replace('/', '')
            : parsed.searchParams.get('v');

        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    } catch {
        return url;
    }

    return url;
};

export const stripHtml = (html = '') => {
    const div = document.createElement('div');
    div.innerHTML = String(html)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, ' ');
    return div.textContent || div.innerText || '';
};

export const normalizeHtmlContent = (html = '') => (
    String(html)
        .replace(/&nbsp;/gi, ' ')
        .replace(/\u00a0/g, ' ')
);

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dopamineService } from '../../services/api';
import { getLanguageId } from '../../utils/languages';
import { DOPAMINE_ASSETS, DOPAMINE_TYPE, getDopamineIcon, getEntityId, normalizeText, toArray } from './dopamineUtils';
import './Dopamine.css';

const fallbackItems = [
    { type: DOPAMINE_TYPE.DOPAMINE, title: 'QUE ES LA DOPAMINA', description: '', image: DOPAMINE_ASSETS.dopamine },
    { type: DOPAMINE_TYPE.ADRENALINE, title: 'QUE ES LA ADRENALINA', description: '', image: DOPAMINE_ASSETS.adrenaline },
    { type: DOPAMINE_TYPE.REWARD_SYSTEM, title: 'SISTEMA DE RECOMPENSAS', description: '', image: DOPAMINE_ASSETS.reward }
];

const resolveType = (item) => {
    const title = normalizeText(item?.title);
    if (Number.isInteger(Number(item?.type))) return Number(item.type);
    if (title.includes('adrenal')) return DOPAMINE_TYPE.ADRENALINE;
    if (title.includes('recompensa') || title.includes('reward')) return DOPAMINE_TYPE.REWARD_SYSTEM;
    if (title.includes('control')) return DOPAMINE_TYPE.CONTROL;
    return DOPAMINE_TYPE.DOPAMINE;
};

const getCardTitleParts = (t, type) => ({
    firstLine: t(`dopamine.card_title_parts.${type}.first`),
    highlight: t(`dopamine.card_title_parts.${type}.highlight`)
});

const DopamineList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const languageId = getLanguageId(i18n.language);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const response = await dopamineService.getAll();
                const list = toArray(response)
                    .filter(item => !item.languageId || item.languageId === languageId)
                    .map(item => ({ ...item, type: resolveType(item) }));
                setItems(list.length ? list : fallbackItems);
            } catch (err) {
                console.error('Error loading dopamine content:', err);
                setItems(fallbackItems);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [languageId]);

    const orderedItems = useMemo(() => {
        const contentItems = items.filter(item => resolveType(item) !== DOPAMINE_TYPE.CONTROL);
        const byType = new Map(contentItems.map(item => [resolveType(item), item]));

        return [
            { ...(byType.get(DOPAMINE_TYPE.DOPAMINE) || fallbackItems[0]), type: DOPAMINE_TYPE.DOPAMINE },
            { ...(byType.get(DOPAMINE_TYPE.ADRENALINE) || fallbackItems[1]), type: DOPAMINE_TYPE.ADRENALINE },
            { ...(byType.get(DOPAMINE_TYPE.REWARD_SYSTEM) || fallbackItems[2]), type: DOPAMINE_TYPE.REWARD_SYSTEM },
            {
                type: DOPAMINE_TYPE.CONTROL,
                image: DOPAMINE_ASSETS.control
            }
        ];
    }, [items]);

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '70vh', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={46} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="dopamine-page">
            <div className="dopamine-main-title">
                <h1>{t('dopamine.title')}</h1>
            </div>

            <div className="dopamine-grid">
                {orderedItems.map((item) => {
                    const type = resolveType(item);
                    const id = getEntityId(item, ['dopamineId']);
                    const { firstLine, highlight } = getCardTitleParts(t, type);
                    const isControl = type === DOPAMINE_TYPE.CONTROL;

                    return (
                        <button
                            key={`${type}-${id || item.title}`}
                            className="dopamine-card"
                            onClick={() => isControl ? navigate('/customer/dopamine/control') : navigate(`/customer/dopamine/content/${type}`)}
                        >
                            <div className="dopamine-card-icon">
                                <img src={getDopamineIcon(type)} alt="" />
                            </div>
                            <div>
                                <h2 className="dopamine-card-title">
                                    {firstLine}
                                    {highlight && <span>{highlight}</span>}
                                </h2>
                                <p className="dopamine-card-copy">
                                    {t(`dopamine.card_descriptions.${type}`)}
                                </p>
                            </div>
                            <ArrowRight size={24} color="var(--primary)" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DopamineList;

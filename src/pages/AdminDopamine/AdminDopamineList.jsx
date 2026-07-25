import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    CheckCircle, Edit2, Gauge, Gamepad2, Layers, Loader2, Plus,
    RefreshCw, Save, Search, Trash2, Trophy, X, Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    addictionService,
    dopamineFlowService,
    dopamineService,
    gameService
} from '../../services/api';
import { getLanguageId } from '../../utils/languages';
import { DOPAMINE_TYPE, normalizeTranslatedList, stripHtml, toArray, unwrapApiData } from '../CustomerDopamine/dopamineUtils';
import './AdminDopamine.css';
import { confirmDialog } from '../../utils/dialog';


const typeIcons = {
    [DOPAMINE_TYPE.DOPAMINE]: Zap,
    [DOPAMINE_TYPE.ADRENALINE]: Gauge,
    [DOPAMINE_TYPE.REWARD_SYSTEM]: Trophy
};

const emptyAddiction = { id: null, code: '', name: '', description: '' };
const emptyGame = { id: null, addictionId: '', name: '' };

const getId = (item, keys) => keys.find(key => item?.[key]) ? item[keys.find(key => item?.[key])] : null;

const normalizeTranslationEntity = (item, languageId) => {
    const translations = toArray(item?.translations);
    const translation = translations.find(entry => entry?.languageId === languageId) || translations[0] || {};

    return {
        ...item,
        title: translation.title || item?.title || '',
        name: translation.name || item?.name || '',
        description: translation.description || item?.description || '',
        videoUrl: translation.videoUrl || item?.videoUrl || ''
    };
};

const normalizeDopamineByLanguage = (response, languageId) => {
    const data = unwrapApiData(response);
    const item = toArray(data)
        .map(entry => {
            const translations = toArray(entry?.translations);
            const exactTranslation = translations.find(translation => translation?.languageId === languageId);
            const rootMatchesLanguage = entry?.languageId === languageId;
            const score = exactTranslation ? 3 : rootMatchesLanguage ? 2 : !entry?.languageId ? 1 : 0;
            const updatedAt = entry?.updatedAt ? new Date(entry.updatedAt).getTime() : 0;

            return { entry, exactTranslation, rootMatchesLanguage, score, updatedAt };
        })
        .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)[0];
    if (!item) return null;

    const translations = toArray(item.entry.translations);
    const translation = item.exactTranslation || (!item.rootMatchesLanguage ? translations[0] : {}) || {};

    return {
        ...item.entry,
        title: translation.title || item.entry.title || '',
        description: translation.description || item.entry.description || '',
        videoUrl: translation.videoUrl || item.entry.videoUrl || ''
    };
};

const Modal = ({ title, children, onClose }) => (
    <div className="admin-dopamine-modal-backdrop">
        <section className="admin-dopamine-modal">
            <div className="admin-dopamine-modal-header">
                <h2>{title}</h2>
                <button type="button" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>
            <div className="admin-dopamine-modal-body">
                {children}
            </div>
        </section>
    </div>
);

const AdminDopamineList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const languageId = getLanguageId(i18n.language);

    const [activeTab, setActiveTab] = useState('content');
    const [contentItems, setContentItems] = useState({});
    const [addictions, setAddictions] = useState([]);
    const [games, setGames] = useState([]);
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [addictionForm, setAddictionForm] = useState(null);
    const [gameForm, setGameForm] = useState(null);
    const [flowGamblerId, setFlowGamblerId] = useState('');
    const [flowForm, setFlowForm] = useState({ gamblerId: '', addictionId: '', flowId: '', motivation: '', selectedGameIds: [] });

    const dopamineTypes = useMemo(() => ([
        DOPAMINE_TYPE.DOPAMINE,
        DOPAMINE_TYPE.ADRENALINE,
        DOPAMINE_TYPE.REWARD_SYSTEM
    ]), []);

    const loadContent = async () => {
        const entries = await Promise.all(
            dopamineTypes.map(async (type) => {
                try {
                    const response = await dopamineService.getByType(type);
                    return [type, normalizeDopamineByLanguage(response, languageId)];
                } catch (err) {
                    console.error('Error loading dopamine type:', type, err);
                    return [type, null];
                }
            })
        );
        setContentItems(Object.fromEntries(entries));
    };

    const loadAddictions = async () => {
        const response = await addictionService.getAll();
        setAddictions(toArray(response).map(item => normalizeTranslationEntity(item, languageId)));
    };

    const loadGames = async () => {
        const response = await gameService.getAll();
        setGames(normalizeTranslatedList(response, languageId, ['gameId']));
    };

    const refreshCatalogs = async () => {
        setLoading(true);
        try {
            await Promise.all([loadContent(), loadAddictions(), loadGames()]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCatalogs();
    }, [languageId]);

    const handleDeleteContent = async (type) => {
        const item = contentItems[type];
        if (!item?.id || !await confirmDialog(t('dopamine_admin.delete_confirm'))) return;

        await dopamineService.delete(item.id, languageId);
        await loadContent();
    };

    const saveAddiction = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const payload = { ...addictionForm, languageId };
            if (addictionForm.id) {
                await addictionService.update(addictionForm.id, payload);
            } else {
                await addictionService.create(payload);
            }
            setAddictionForm(null);
            await loadAddictions();
        } catch (err) {
            console.error('Error saving addiction:', err);
            alert(t('dopamine_admin.catalog_save_error'));
        } finally {
            setSaving(false);
        }
    };

    const deleteAddiction = async (item) => {
        const id = getId(item, ['id', 'addictionId']);
        if (!id || !await confirmDialog(t('dopamine_admin.delete_addiction_confirm'))) return;

        await addictionService.delete(id, languageId);
        await Promise.all([loadAddictions(), loadGames()]);
    };

    const saveGame = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const payload = { addictionId: gameForm.addictionId, languageId, name: gameForm.name };
            if (gameForm.id) {
                await gameService.update(gameForm.id, { ...payload, id: gameForm.id, gameId: gameForm.id });
            } else {
                await gameService.create(payload);
            }
            setGameForm(null);
            await loadGames();
        } catch (err) {
            console.error('Error saving game:', err);
            alert(t('dopamine_admin.catalog_save_error'));
        } finally {
            setSaving(false);
        }
    };

    const deleteGame = async (item) => {
        const id = getId(item, ['gameId', 'id']);
        if (!id || !await confirmDialog(t('dopamine_admin.delete_game_confirm'))) return;

        await gameService.delete(id);
        await loadGames();
    };

    const searchFlows = async () => {
        if (!flowGamblerId.trim()) return;
        setLoading(true);
        try {
            const response = await dopamineFlowService.getByGamblerId(flowGamblerId.trim());
            setFlows(toArray(response));
        } catch (err) {
            console.error('Error loading dopamine flows:', err);
            setFlows([]);
            alert(t('dopamine_admin.flow_search_error'));
        } finally {
            setLoading(false);
        }
    };

    const createFlow = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await dopamineFlowService.create({
                gamblerId: flowForm.gamblerId,
                addictionId: flowForm.addictionId
            });
            setFlowGamblerId(flowForm.gamblerId);
            setFlowForm(prev => ({ ...prev, flowId: '', motivation: '', selectedGameIds: [] }));
            const response = await dopamineFlowService.getByGamblerId(flowForm.gamblerId);
            setFlows(toArray(response));
        } catch (err) {
            console.error('Error creating dopamine flow:', err);
            alert(t('dopamine_admin.flow_save_error'));
        } finally {
            setSaving(false);
        }
    };

    const updateFlow = async (event) => {
        event.preventDefault();
        if (!flowForm.flowId) return;
        setSaving(true);
        try {
            await dopamineFlowService.updateMotivationAndGames(flowForm.flowId, {
                motivation: flowForm.motivation,
                selectedGameIds: flowForm.selectedGameIds
            });
            if (flowGamblerId) await searchFlows();
        } catch (err) {
            console.error('Error updating dopamine flow:', err);
            alert(t('dopamine_admin.flow_save_error'));
        } finally {
            setSaving(false);
        }
    };

    const deleteFlow = async (flow) => {
        const id = getId(flow, ['id', 'dopamineFlowId', 'flowId']);
        if (!id || !await confirmDialog(t('dopamine_admin.delete_flow_confirm'))) return;

        await dopamineFlowService.delete(id);
        setFlows(prev => prev.filter(item => getId(item, ['id', 'dopamineFlowId', 'flowId']) !== id));
    };

    const completeFlow = async (flow) => {
        const id = getId(flow, ['id', 'dopamineFlowId', 'flowId']);
        if (!id) return;

        await dopamineFlowService.complete(id);
        if (flowGamblerId) await searchFlows();
    };

    const renderContent = () => (
        <div className="admin-dopamine-grid">
            {dopamineTypes.map((type) => {
                const item = contentItems[type];
                const Icon = typeIcons[type] || Zap;
                const hasContent = Boolean(item?.id);

                return (
                    <section key={type} className="admin-dopamine-card">
                        <div className="admin-dopamine-icon">
                            <Icon size={34} />
                        </div>
                        <div className="admin-dopamine-card-content">
                            <span>{t(`dopamine_admin.types.${type}`)}</span>
                            <h2>{item?.title || t('dopamine_admin.not_configured')}</h2>
                            <p>{item?.videoUrl || t('dopamine_admin.no_video')}</p>
                        </div>
                        <div className="admin-dopamine-actions">
                            <button className="btn btn-primary" onClick={() => navigate(`/dopamine/type/${type}`)}>
                                {hasContent ? <Edit2 size={18} /> : <Plus size={18} />}
                                {hasContent ? t('dopamine_admin.edit') : t('dopamine_admin.create')}
                            </button>
                            <button className="btn admin-dopamine-danger" disabled={!hasContent} onClick={() => handleDeleteContent(type)}>
                                <Trash2 size={18} />
                                {t('dopamine_admin.delete')}
                            </button>
                        </div>
                    </section>
                );
            })}
        </div>
    );

    const renderAddictions = () => (
        <>
            <div className="admin-dopamine-toolbar">
                <button className="btn btn-primary" onClick={() => setAddictionForm(emptyAddiction)}>
                    <Plus size={18} />
                    {t('dopamine_admin.add_addiction')}
                </button>
            </div>
            <div className="admin-dopamine-table">
                {addictions.map(item => {
                    const id = getId(item, ['id', 'addictionId']);
                    return (
                        <div className="admin-dopamine-row" key={id || item.code}>
                            <div>
                                <strong>{item.name || t('dopamine_admin.not_configured')}</strong>
                                <span>{item.code}</span>
                                <p>{stripHtml(item.description || '').slice(0, 180)}</p>
                            </div>
                            <div className="admin-dopamine-row-actions">
                                <button className="btn" onClick={() => setAddictionForm({ id, code: item.code || '', name: item.name || '', description: item.description || '' })}>
                                    <Edit2 size={16} />
                                </button>
                                <button className="btn admin-dopamine-danger" onClick={() => deleteAddiction(item)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );

    const renderGames = () => {
        const addictionMap = new Map(
            addictions.map(item => [getId(item, ['id', 'addictionId']), item])
        );
        const groups = games.reduce((acc, item) => {
            const addictionId = item.addictionId || 'unassigned';
            if (!acc.has(addictionId)) {
                const addiction = addictionMap.get(addictionId);
                acc.set(addictionId, {
                    addictionId,
                    name: addiction?.name || item.addictionName || item.addiction || item.addictionId || t('dopamine_admin.not_configured'),
                    code: addiction?.code || '',
                    items: []
                });
            }
            acc.get(addictionId).items.push(item);
            return acc;
        }, new Map());

        return (
            <>
                <div className="admin-dopamine-toolbar">
                    <button className="btn btn-primary" onClick={() => setGameForm(emptyGame)}>
                        <Plus size={18} />
                        {t('dopamine_admin.add_game')}
                    </button>
                </div>
                <div className="admin-dopamine-game-groups">
                    {[...groups.values()].map(group => (
                        <section className="admin-dopamine-game-group" key={group.addictionId}>
                            <header>
                                <div>
                                    <h2>{group.name}</h2>
                                    {group.code && <span>{group.code}</span>}
                                </div>
                                <strong>{group.items.length}</strong>
                            </header>
                            <div className="admin-dopamine-table">
                                {group.items.map(item => {
                                    const id = getId(item, ['gameId', 'id']);
                                    return (
                                        <div className="admin-dopamine-row admin-dopamine-game-row" key={id || item.name}>
                                            <div>
                                                <strong>{item.name}</strong>
                                            </div>
                                            <div className="admin-dopamine-row-actions">
                                                <button className="btn" onClick={() => setGameForm({ id, addictionId: item.addictionId || '', name: item.name || '' })}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn admin-dopamine-danger" onClick={() => deleteGame(item)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </>
        );
    };

    const renderFlows = () => (
        <div className="admin-dopamine-flow-grid">
            <section className="glass-card admin-dopamine-flow-panel">
                <h2>{t('dopamine_admin.flow_lookup')}</h2>
                <div className="admin-dopamine-inline-form">
                    <input value={flowGamblerId} onChange={event => setFlowGamblerId(event.target.value)} placeholder={t('dopamine_admin.gambler_id')} />
                    <button className="btn btn-primary" type="button" onClick={searchFlows}>
                        <Search size={16} />
                        {t('dopamine_admin.search')}
                    </button>
                </div>

                <form onSubmit={createFlow} className="admin-dopamine-stack-form">
                    <h3>{t('dopamine_admin.create_flow')}</h3>
                    <input value={flowForm.gamblerId} onChange={event => setFlowForm(prev => ({ ...prev, gamblerId: event.target.value }))} placeholder={t('dopamine_admin.gambler_id')} />
                    <select value={flowForm.addictionId} onChange={event => setFlowForm(prev => ({ ...prev, addictionId: event.target.value }))}>
                        <option value="">{t('dopamine_admin.select_addiction')}</option>
                        {addictions.map(item => (
                            <option key={getId(item, ['id', 'addictionId'])} value={getId(item, ['id', 'addictionId'])}>{item.name}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" disabled={saving || !flowForm.gamblerId || !flowForm.addictionId}>
                        <Plus size={16} />
                        {t('dopamine_admin.create_flow')}
                    </button>
                </form>

                <form onSubmit={updateFlow} className="admin-dopamine-stack-form">
                    <h3>{t('dopamine_admin.update_flow')}</h3>
                    <select value={flowForm.flowId} onChange={event => setFlowForm(prev => ({ ...prev, flowId: event.target.value }))}>
                        <option value="">{t('dopamine_admin.select_flow')}</option>
                        {flows.map(flow => {
                            const id = getId(flow, ['id', 'dopamineFlowId', 'flowId']);
                            return <option key={id} value={id}>{id}</option>;
                        })}
                    </select>
                    <textarea value={flowForm.motivation} onChange={event => setFlowForm(prev => ({ ...prev, motivation: event.target.value }))} placeholder={t('dopamine_admin.motivation')} />
                    <div className="admin-dopamine-check-grid">
                        {games.map(game => {
                            const gameId = getId(game, ['gameId', 'id']);
                            return (
                                <label key={gameId}>
                                    <input
                                        type="checkbox"
                                        checked={flowForm.selectedGameIds.includes(gameId)}
                                        onChange={event => setFlowForm(prev => ({
                                            ...prev,
                                            selectedGameIds: event.target.checked
                                                ? [...prev.selectedGameIds, gameId]
                                                : prev.selectedGameIds.filter(id => id !== gameId)
                                        }))}
                                    />
                                    {game.name}
                                </label>
                            );
                        })}
                    </div>
                    <button className="btn btn-primary" disabled={saving || !flowForm.flowId}>
                        <Save size={16} />
                        {t('dopamine_admin.update_flow')}
                    </button>
                </form>
            </section>

            <section className="admin-dopamine-table">
                {flows.map(flow => {
                    const id = getId(flow, ['id', 'dopamineFlowId', 'flowId']);
                    return (
                        <div className="admin-dopamine-row" key={id}>
                            <div>
                                <strong>{id}</strong>
                                <span>{flow.status || flow.state || (flow.completed ? t('dopamine_admin.completed') : t('dopamine_admin.active'))}</span>
                                <p>{flow.motivation || t('dopamine_admin.no_motivation')}</p>
                            </div>
                            <div className="admin-dopamine-row-actions">
                                <button className="btn" onClick={() => completeFlow(flow)}>
                                    <CheckCircle size={16} />
                                </button>
                                <button className="btn admin-dopamine-danger" onClick={() => deleteFlow(flow)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </section>
        </div>
    );

    if (loading && activeTab !== 'flows') {
        return (
            <div className="admin-dopamine-loading">
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="admin-dopamine-page">
            <div className="admin-dopamine-header">
                <div>
                    <h1>{t('dopamine_admin.title')}</h1>
                    <p>{t('dopamine_admin.subtitle')}</p>
                </div>
                <button className="btn" onClick={refreshCatalogs}>
                    <RefreshCw size={18} />
                    {t('dopamine_admin.refresh')}
                </button>
            </div>

            <nav className="admin-dopamine-tabs">
                {['content', 'addictions', 'games', 'flows'].map(tab => (
                    <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                        {tab === 'content' && <Layers size={18} />}
                        {tab === 'addictions' && <Zap size={18} />}
                        {tab === 'games' && <Gamepad2 size={18} />}
                        {tab === 'flows' && <Gauge size={18} />}
                        {t(`dopamine_admin.tabs.${tab}`)}
                    </button>
                ))}
            </nav>

            {activeTab === 'content' && renderContent()}
            {activeTab === 'addictions' && renderAddictions()}
            {activeTab === 'games' && renderGames()}
            {activeTab === 'flows' && renderFlows()}

            {addictionForm && (
                <Modal title={addictionForm.id ? t('dopamine_admin.edit_addiction') : t('dopamine_admin.add_addiction')} onClose={() => setAddictionForm(null)}>
                    <form className="admin-dopamine-stack-form" onSubmit={saveAddiction}>
                        <input value={addictionForm.code} onChange={event => setAddictionForm(prev => ({ ...prev, code: event.target.value }))} placeholder={t('dopamine_admin.code')} disabled={Boolean(addictionForm.id)} />
                        <input value={addictionForm.name} onChange={event => setAddictionForm(prev => ({ ...prev, name: event.target.value }))} placeholder={t('dopamine_admin.name')} />
                        <div className="admin-dopamine-quill compact">
                            <ReactQuill value={addictionForm.description} onChange={value => setAddictionForm(prev => ({ ...prev, description: value }))} />
                        </div>
                        <div className="admin-dopamine-modal-actions">
                            <button type="button" className="btn" onClick={() => setAddictionForm(null)}>
                                {t('dopamine_admin.cancel')}
                            </button>
                            <button className="btn btn-primary" disabled={saving}>
                                <Save size={16} />
                                {t('dopamine_admin.save')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {gameForm && (
                <Modal title={gameForm.id ? t('dopamine_admin.edit_game') : t('dopamine_admin.add_game')} onClose={() => setGameForm(null)}>
                    <form className="admin-dopamine-stack-form" onSubmit={saveGame}>
                        <select value={gameForm.addictionId} onChange={event => setGameForm(prev => ({ ...prev, addictionId: event.target.value }))}>
                            <option value="">{t('dopamine_admin.select_addiction')}</option>
                            {addictions.map(item => (
                                <option key={getId(item, ['id', 'addictionId'])} value={getId(item, ['id', 'addictionId'])}>{item.name}</option>
                            ))}
                        </select>
                        <input value={gameForm.name} onChange={event => setGameForm(prev => ({ ...prev, name: event.target.value }))} placeholder={t('dopamine_admin.name')} />
                        <div className="admin-dopamine-modal-actions">
                            <button type="button" className="btn" onClick={() => setGameForm(null)}>
                                {t('dopamine_admin.cancel')}
                            </button>
                            <button className="btn btn-primary" disabled={saving || !gameForm.addictionId || !gameForm.name}>
                                <Save size={16} />
                                {t('dopamine_admin.save')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default AdminDopamineList;

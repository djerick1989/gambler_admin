import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Eye, FileSignature, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    addictionService,
    dopamineCommitmentService,
    dopamineFlowService,
    gameService,
    mediaService
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';
import SubscriptionGate from '../../components/SubscriptionGate';
import { FREE_LIMITS, getApiErrorMessage, isSubscriptionRequiredError } from '../../utils/subscription';
import { getEntityId, normalizeHtmlContent, normalizeText, normalizeTranslatedEntity, normalizeTranslatedList, toArray, unwrapApiData } from './dopamineUtils';
import './Dopamine.css';
import { confirmDialog } from '../../utils/dialog';


const ProgressPanel = ({ step, maxStepReached, onStepClick }) => {
    const { t } = useTranslation();
    const steps = [
        t('dopamine.flow_steps.addiction'),
        t('dopamine.flow_steps.learn'),
        t('dopamine.flow_steps.reflect'),
        t('dopamine.flow_steps.commitment')
    ];

    return (
        <aside className="dopamine-progress">
            {steps.map((label, index) => {
                const canNavigate = index <= maxStepReached;
                return (
                <button
                    key={label}
                    type="button"
                    className={`dopamine-progress-step ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}
                    disabled={!canNavigate}
                    onClick={() => onStepClick(index)}
                >
                    <span className="dopamine-progress-dot">{index < step ? <Check size={16} /> : index + 1}</span>
                    <span>{label}</span>
                </button>
                );
            })}
        </aside>
    );
};

const getFlowAddictionId = (item) => item?.addictionId || item?.addiction?.addictionId || item?.addiction?.id;

const getFlowGameIds = (item) => (
    toArray(item?.selectedGames)
        .map(game => getEntityId(game, ['gameId']))
        .filter(Boolean)
);

const isFlowCompleted = (item) => Boolean(item?.isCompleted || item?.completed || item?.commitment);

const getCommitmentSignature = (commitment = {}) => (
    commitment?.signatureUrl ||
    commitment?.signatureURL ||
    commitment?.signature ||
    commitment?.imageUrl ||
    commitment?.url ||
    ''
);

const getMediaUrl = (response) => {
    const data = unwrapApiData(response);
    return data?.url || data?.fileUrl || data?.mediaUrl || data?.location || (typeof data === 'string' ? data : '');
};

const dataUrlToFile = async (dataUrl, fileName) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/png';
    return new File([blob], fileName, { type: mimeType });
};

const FlowHistoryPanel = ({ flows, languageId, onView, onDelete, deletingFlowId }) => {
    const { t, i18n } = useTranslation();

    const formatDate = (value) => {
        if (!value) return t('common.none');
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return t('common.none');
        return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <section className="dopamine-history-panel">
            <div className="dopamine-history-heading">
                <FileSignature size={19} />
                <h3>{t('dopamine.signed_flows_title')}</h3>
            </div>

            {flows.length === 0 ? (
                <p className="dopamine-history-empty">{t('dopamine.no_signed_flows')}</p>
            ) : (
                <div className="dopamine-history-list">
                    {flows.map(flowItem => {
                        const flowItemId = getEntityId(flowItem, ['dopamineFlowId']);
                        const addiction = normalizeTranslatedEntity(flowItem?.addiction, languageId);
                        const games = toArray(flowItem?.selectedGames).map(game => normalizeTranslatedEntity(game, languageId));
                        const commitment = flowItem?.commitment;
                        const commitmentDate = commitment?.commitmentDate || commitment?.createdAt;
                        const isCompleted = isFlowCompleted(flowItem);

                        return (
                            <article className="dopamine-history-item" key={flowItemId || commitmentDate || flowItem?.createdAt}>
                                <div className="dopamine-history-item-head">
                                    <strong>{addiction?.name || t('dopamine.addiction_label')}</strong>
                                    <span className={`dopamine-history-status ${isCompleted ? 'signed' : 'pending'}`}>
                                        {isCompleted ? t('dopamine.signed_status') : t('dopamine.pending_status')}
                                    </span>
                                </div>

                                <div className="dopamine-history-date">
                                    <CalendarDays size={15} />
                                    <span>{formatDate(commitmentDate || flowItem?.updatedAt || flowItem?.createdAt)}</span>
                                </div>

                                {games.length > 0 && (
                                    <div className="dopamine-history-games">
                                        {games.slice(0, 4).map(game => (
                                            <span key={getEntityId(game, ['gameId']) || game.name}>{game.name}</span>
                                        ))}
                                        {games.length > 4 && <span>{t('dopamine.more_games', { count: games.length - 4 })}</span>}
                                    </div>
                                )}

                                {flowItem?.motivation && (
                                    <p className="dopamine-history-note">{flowItem.motivation}</p>
                                )}

                                {commitment?.constructiveActivities && (
                                    <p className="dopamine-history-note">
                                        <b>{t('dopamine.constructive_activities_short')}:</b> {commitment.constructiveActivities}
                                    </p>
                                )}

                                <div className="dopamine-history-actions">
                                    <button type="button" className="dopamine-history-action" onClick={() => onView(flowItem)}>
                                        <Eye size={15} />
                                        {t('dopamine.view_flow')}
                                    </button>
                                    {!isCompleted && (
                                        <button
                                            type="button"
                                            className="dopamine-history-action danger"
                                            disabled={deletingFlowId === flowItemId}
                                            onClick={() => onDelete(flowItem)}
                                        >
                                            {deletingFlowId === flowItemId ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                            {t('common.delete')}
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

const FeaturedContracts = ({ flows, languageId, onView, onCreateNew }) => {
    const { t, i18n } = useTranslation();

    const formatDate = (value) => {
        if (!value) return t('common.none');
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return t('common.none');
        return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <main className="dopamine-contracts-hero">
            <div className="dopamine-contracts-hero-head">
                <div>
                    <span className="dopamine-contracts-kicker">{t('dopamine.signed_status')}</span>
                    <h2>{t('dopamine.contracts_first_title')}</h2>
                    <p>{t('dopamine.contracts_first_subtitle')}</p>
                </div>
                <button type="button" className="dopamine-secondary-action" onClick={onCreateNew}>
                    <Plus size={18} />
                    {t('dopamine.create_another_flow')}
                </button>
            </div>

            <div className="dopamine-featured-contracts">
                {flows.map(flowItem => {
                    const flowItemId = getEntityId(flowItem, ['dopamineFlowId']);
                    const addiction = normalizeTranslatedEntity(flowItem?.addiction, languageId);
                    const games = toArray(flowItem?.selectedGames).map(game => normalizeTranslatedEntity(game, languageId));
                    const commitment = flowItem?.commitment || {};
                    const commitmentDate = commitment?.commitmentDate || commitment?.createdAt || flowItem?.updatedAt || flowItem?.createdAt;

                    return (
                        <article className="dopamine-featured-contract" key={flowItemId || commitmentDate}>
                            <div className="dopamine-featured-contract-top">
                                <div>
                                    <span>{formatDate(commitmentDate)}</span>
                                    <h3>{addiction?.name || t('dopamine.addiction_label')}</h3>
                                </div>
                                <span className="dopamine-history-status signed">{t('dopamine.signed_status')}</span>
                            </div>

                            {games.length > 0 && (
                                <div className="dopamine-history-games">
                                    {games.slice(0, 5).map(game => (
                                        <span key={getEntityId(game, ['gameId']) || game.name}>{game.name}</span>
                                    ))}
                                    {games.length > 5 && <span>{t('dopamine.more_games', { count: games.length - 5 })}</span>}
                                </div>
                            )}

                            {flowItem?.motivation && <p className="dopamine-featured-note">{flowItem.motivation}</p>}
                            {commitment?.personalReasons && (
                                <p className="dopamine-featured-note">
                                    <b>{t('dopamine.personal_reasons_short')}:</b> {commitment.personalReasons}
                                </p>
                            )}
                            {commitment?.constructiveActivities && (
                                <p className="dopamine-featured-note">
                                    <b>{t('dopamine.constructive_activities_short')}:</b> {commitment.constructiveActivities}
                                </p>
                            )}

                            {getCommitmentSignature(commitment) && (
                                <div className="dopamine-featured-signature">
                                    <img src={getCommitmentSignature(commitment)} alt={t('dopamine.signature')} />
                                </div>
                            )}

                            <button type="button" className="dopamine-primary-action compact" onClick={() => onView(flowItem)}>
                                <Eye size={18} />
                                {t('dopamine.view_flow')}
                            </button>
                        </article>
                    );
                })}
            </div>
        </main>
    );
};

const SignatureModal = ({ onCancel, onAccept }) => {
    const { t } = useTranslation();
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#111827';
    }, []);

    const getPoint = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches?.[0];
        return {
            x: (touch?.clientX ?? event.clientX) - rect.left,
            y: (touch?.clientY ?? event.clientY) - rect.top
        };
    };

    const startDrawing = (event) => {
        event.preventDefault();
        drawingRef.current = true;
        const point = getPoint(event);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    };

    const draw = (event) => {
        if (!drawingRef.current) return;
        event.preventDefault();
        const point = getPoint(event);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        drawingRef.current = false;
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="dopamine-modal-backdrop">
            <div className="dopamine-signature-modal">
                <h2>{t('dopamine.commitment_agree')}</h2>
                <canvas
                    ref={canvasRef}
                    className="dopamine-signature-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <div style={{ textAlign: 'center', marginTop: '-2rem', pointerEvents: 'none', fontWeight: 700 }}>
                    {t('dopamine.sign_here')}
                </div>
                <div className="dopamine-modal-actions">
                    <button onClick={() => onAccept(canvasRef.current.toDataURL('image/png'))}>{t('common.approve')}</button>
                    <button onClick={clear}>{t('common.delete')}</button>
                    <button onClick={onCancel}>{t('common.cancel')}</button>
                </div>
            </div>
        </div>
    );
};

const DopamineControl = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, isSubscribed } = useAuth();
    const { addToast } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(0);
    const [addictions, setAddictions] = useState([]);
    const [selectedAddiction, setSelectedAddiction] = useState(null);
    const [flow, setFlow] = useState(null);
    const [games, setGames] = useState([]);
    const [query, setQuery] = useState('');
    const [gamePickerOpen, setGamePickerOpen] = useState(false);
    const [creatingGame, setCreatingGame] = useState(false);
    const [selectedGameIds, setSelectedGameIds] = useState([]);
    const [motivation, setMotivation] = useState('');
    const [personalReasons, setPersonalReasons] = useState('');
    const [constructiveActivities, setConstructiveActivities] = useState('');
    const [signature, setSignature] = useState('');
    const [signatureOpen, setSignatureOpen] = useState(false);
    const [flowHistory, setFlowHistory] = useState([]);
    const [readOnlyFlow, setReadOnlyFlow] = useState(false);
    const [deletingFlowId, setDeletingFlowId] = useState(null);
    const [showNewFlow, setShowNewFlow] = useState(false);
    const [subscriptionGate, setSubscriptionGate] = useState({ open: false, message: '' });
    const personalReasonsRef = useRef('');
    const constructiveActivitiesRef = useRef('');
    const signatureRef = useRef('');

    const languageId = getLanguageId(i18n.language);
    const gamblerId = user?.gambler?.gamblerId;

    useEffect(() => {
        personalReasonsRef.current = personalReasons;
    }, [personalReasons]);

    useEffect(() => {
        constructiveActivitiesRef.current = constructiveActivities;
    }, [constructiveActivities]);

    useEffect(() => {
        signatureRef.current = signature;
    }, [signature]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [addictionsResponse, activeFlowResponse, flowsResponse, commitmentsResponse] = await Promise.all([
                    addictionService.getAll(),
                    gamblerId ? dopamineFlowService.getActiveByGamblerId(gamblerId).catch(() => null) : Promise.resolve(null),
                    gamblerId ? dopamineFlowService.getByGamblerId(gamblerId).catch(() => null) : Promise.resolve(null),
                    gamblerId ? dopamineCommitmentService.getByGamblerId(gamblerId).catch(() => null) : Promise.resolve(null)
                ]);
                const addictionList = normalizeTranslatedList(addictionsResponse, languageId, ['addictionId'])
                    .filter(item => getEntityId(item, ['addictionId']) && item.name);
                setAddictions(addictionList);

                const commitmentsByFlow = new Map(
                    toArray(commitmentsResponse)
                        .map(commitment => [commitment?.dopamineFlowId || commitment?.flowId, commitment])
                        .filter(([id]) => Boolean(id))
                );
                const historicalFlows = toArray(flowsResponse)
                    .map(item => {
                        const itemId = getEntityId(item, ['dopamineFlowId']);
                        return {
                            ...item,
                            commitment: item?.commitment || commitmentsByFlow.get(itemId) || null
                        };
                    })
                    .sort((a, b) => Number(isFlowCompleted(b)) - Number(isFlowCompleted(a)) || new Date(b.commitment?.commitmentDate || b.updatedAt || b.createdAt || 0) - new Date(a.commitment?.commitmentDate || a.updatedAt || a.createdAt || 0));
                setFlowHistory(historicalFlows);

                const activeFlow = unwrapApiData(activeFlowResponse);
                if (activeFlow && getEntityId(activeFlow, ['dopamineFlowId'])) {
                    setFlow(activeFlow);
                }
            } catch (err) {
                console.error('Error loading dopamine control data:', err);
                addToast('error', t('common.error_loading'));
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [addToast, gamblerId, languageId, t]);

    useEffect(() => {
        const addictionId = getEntityId(selectedAddiction, ['addictionId']);
        if (!addictionId) return;

        gameService.getByAddiction(addictionId)
            .then(response => setGames(
                normalizeTranslatedList(response, languageId, ['gameId'])
                    .filter(item => getEntityId(item, ['gameId']) && item.name)
            ))
            .catch(err => console.error('Error loading games:', err));
    }, [languageId, selectedAddiction]);

    const selectedAddictionId = getEntityId(selectedAddiction, ['addictionId']);
    const flowId = getEntityId(flow, ['dopamineFlowId']);
    const flowAddictionId = getFlowAddictionId(flow);
    const signedFlows = useMemo(() => flowHistory.filter(item => isFlowCompleted(item)), [flowHistory]);
    const shouldShowContractsFirst = signedFlows.length > 0 && !showNewFlow && !flow;

    const selectedGames = useMemo(() => (
        selectedGameIds
            .map(id => (
                games.find(game => getEntityId(game, ['gameId']) === id) ||
                toArray(flow?.selectedGames).find(game => getEntityId(game, ['gameId']) === id)
            ))
            .filter(Boolean)
            .map(game => normalizeTranslatedEntity(game, languageId))
    ), [flow, games, languageId, selectedGameIds]);

    const filteredGames = useMemo(() => {
        const term = normalizeText(query.trim());
        const availableGames = games.filter(game => !selectedGameIds.includes(getEntityId(game, ['gameId'])));
        if (!term) return availableGames;
        return availableGames.filter(game => normalizeText(game.name || '').includes(term));
    }, [games, query, selectedGameIds]);

    const canCreateGame = useMemo(() => {
        const term = normalizeText(query.trim());
        if (!term || !selectedAddictionId) return false;
        return !games.some(game => normalizeText(String(game.name || '').trim()) === term);
    }, [games, query, selectedAddictionId]);

    const resetFlowInputs = () => {
        setSelectedAddiction(null);
        setSelectedGameIds([]);
        setMotivation('');
        setPersonalReasons('');
        setConstructiveActivities('');
        setSignature('');
        setFlow(null);
        setReadOnlyFlow(false);
        setShowNewFlow(false);
        setMaxStepReached(0);
    };

    const startNewFlow = () => {
        if (!isSubscribed && signedFlows.length >= FREE_LIMITS.commitments) {
            setSubscriptionGate({
                open: true,
                message: t('subscriptions.commitments_limit', { count: FREE_LIMITS.commitments })
            });
            return;
        }
        resetFlowInputs();
        setShowNewFlow(true);
        setStep(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getAddictionForFlow = (flowItem) => {
        const addictionId = getFlowAddictionId(flowItem);
        const normalizedAddiction = normalizeTranslatedEntity(flowItem?.addiction, languageId);
        return addictions.find(item => getEntityId(item, ['addictionId']) === addictionId) || normalizedAddiction;
    };

    const loadFlowIntoWizard = (flowItem, readOnly = false) => {
        const flowCommitment = flowItem?.commitment || {};
        const flowIsCompleted = isFlowCompleted(flowItem);
        setSelectedAddiction(getAddictionForFlow(flowItem));
        setFlow(flowItem);
        setSelectedGameIds(getFlowGameIds(flowItem));
        setMotivation(flowItem?.motivation || '');
        const nextPersonalReasons = flowCommitment?.personalReasons || flowCommitment?.PersonalReasons || '';
        const nextConstructiveActivities = flowCommitment?.constructiveActivities || flowCommitment?.ConstructiveActivities || '';
        const nextSignature = getCommitmentSignature(flowCommitment);
        setPersonalReasons(nextPersonalReasons);
        setConstructiveActivities(nextConstructiveActivities);
        setSignature(nextSignature);
        personalReasonsRef.current = nextPersonalReasons;
        constructiveActivitiesRef.current = nextConstructiveActivities;
        signatureRef.current = nextSignature;
        setReadOnlyFlow(readOnly || flowIsCompleted);
        setShowNewFlow(true);
        setMaxStepReached(3);
        setStep(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const returnToAddictionStep = () => {
        resetFlowInputs();
        setStep(0);
    };

    const goToStep = (targetStep) => {
        if (targetStep > maxStepReached) return;
        if (targetStep === 0) {
            if (readOnlyFlow) {
                setStep(0);
                return;
            }
            returnToAddictionStep();
            return;
        }
        setStep(targetStep);
    };

    const advanceToStep = (targetStep) => {
        setMaxStepReached(prev => Math.max(prev, targetStep));
        setStep(targetStep);
    };

    const ensureFlow = async (addiction = selectedAddiction, forceCreate = false) => {
        if (flowId && !forceCreate) return flow;
        const addictionId = getEntityId(addiction, ['addictionId']);
        if (!gamblerId || !addictionId) throw new Error('Missing gambler or addiction');

        const existingFlow = flowHistory.find(item => getFlowAddictionId(item) === addictionId);
        if (existingFlow) {
            setFlow(existingFlow);
            return existingFlow;
        }

        const response = await dopamineFlowService.create({
            gamblerId,
            addictionId
        });
        const createdFlow = unwrapApiData(response);
        const hydratedFlow = { ...createdFlow, addiction };
        setFlow(hydratedFlow);
        setFlowHistory(prev => [hydratedFlow, ...prev]);
        return hydratedFlow;
    };

    const handleAddictionSelect = async (addiction) => {
        if (saving) return;
        const nextAddictionId = getEntityId(addiction, ['addictionId']);
        const existingFlow = flowHistory.find(item => getFlowAddictionId(item) === nextAddictionId);
        if (existingFlow) {
            loadFlowIntoWizard(existingFlow, isFlowCompleted(existingFlow));
            return;
        }

        const currentAddictionId = selectedAddictionId || flowAddictionId;
        const addictionChanged = nextAddictionId !== currentAddictionId;
        if (addictionChanged) {
            setSelectedGameIds([]);
            setMotivation('');
            setPersonalReasons('');
            setConstructiveActivities('');
            setSignature('');
            setFlow(null);
            setReadOnlyFlow(false);
            setMaxStepReached(0);
        }
        setSelectedAddiction(addiction);
        setSaving(true);
        try {
            await ensureFlow(addiction, addictionChanged);
            advanceToStep(1);
        } catch (err) {
            console.error('Error creating dopamine flow:', err);
            if (isSubscriptionRequiredError(err)) {
                setSubscriptionGate({ open: true, message: getApiErrorMessage(err, t('subscriptions.commitments_limit', { count: FREE_LIMITS.commitments })) });
            } else {
                addToast('error', t('dopamine.flow_error'));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (step === 0) {
            navigate('/customer/dopamine');
            return;
        }
        if (step === 1) {
            returnToAddictionStep();
            return;
        }
        setStep(step - 1);
    };

    const handleReflectionNext = async () => {
        if (readOnlyFlow) {
            advanceToStep(3);
            return;
        }
        const currentFlow = await ensureFlow();
        const currentFlowId = getEntityId(currentFlow, ['dopamineFlowId']);
        setSaving(true);
        try {
            await dopamineFlowService.updateMotivationAndGames(currentFlowId, {
                selectedGameIds,
                motivation
            });
            const selectedFlowGames = selectedGameIds
                .map(id => games.find(game => getEntityId(game, ['gameId']) === id))
                .filter(Boolean);
            const updatedFlow = { ...currentFlow, selectedGameIds, selectedGames: selectedFlowGames, motivation };
            setFlow(updatedFlow);
            setFlowHistory(prev => prev.map(item => getEntityId(item, ['dopamineFlowId']) === currentFlowId ? updatedFlow : item));
            advanceToStep(3);
        } catch (err) {
            console.error('Error updating dopamine flow:', err);
            addToast('error', t('dopamine.flow_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCommitment = async () => {
        if (readOnlyFlow) return;
        const currentFlow = await ensureFlow();
        const currentFlowId = getEntityId(currentFlow, ['dopamineFlowId']);

        setSaving(true);
        try {
            const currentPersonalReasons = personalReasonsRef.current.trim();
            const currentConstructiveActivities = constructiveActivitiesRef.current.trim();
            let signatureUrl = signatureRef.current;
            if (signatureUrl?.startsWith('data:')) {
                const file = await dataUrlToFile(signatureUrl, `dopamine-signature-${currentFlowId}.png`);
                const uploadResponse = await mediaService.upload(file);
                signatureUrl = getMediaUrl(uploadResponse);
                if (!signatureUrl) throw new Error('Missing uploaded signature URL');
                setSignature(signatureUrl);
                signatureRef.current = signatureUrl;
            }

            await dopamineCommitmentService.create({
                dopamineFlowId: currentFlowId,
                DopamineFlowId: currentFlowId,
                signature: signatureUrl,
                Signature: signatureUrl,
                signatureUrl,
                SignatureUrl: signatureUrl,
                personalReasons: currentPersonalReasons,
                PersonalReasons: currentPersonalReasons,
                constructiveActivities: currentConstructiveActivities,
                ConstructiveActivities: currentConstructiveActivities
            });
            await dopamineFlowService.complete(currentFlowId).catch(() => null);
            addToast('success', t('dopamine.commitment_success'));
            navigate('/customer/dopamine');
        } catch (err) {
            console.error('Error creating dopamine commitment:', err);
            if (isSubscriptionRequiredError(err)) {
                setSubscriptionGate({ open: true, message: getApiErrorMessage(err, t('subscriptions.commitments_limit', { count: FREE_LIMITS.commitments })) });
            } else {
                addToast('error', t('dopamine.commitment_error'));
            }
        } finally {
            setSaving(false);
        }
    };

    const selectGame = (game) => {
        const gameId = getEntityId(game, ['gameId']);
        if (!gameId) return;
        setSelectedGameIds(prev => prev.includes(gameId) ? prev : [...prev, gameId]);
        setQuery('');
        setGamePickerOpen(false);
    };

    const removeGame = (gameId) => {
        setSelectedGameIds(prev => prev.filter(id => id !== gameId));
    };

    const createGameFromQuery = async () => {
        const name = query.trim();
        if (!name || !selectedAddictionId || creatingGame) return;

        setCreatingGame(true);
        try {
            const response = await gameService.create({ addictionId: selectedAddictionId, languageId, name });
            const created = normalizeTranslatedList(response, languageId, ['gameId'])[0];
            const normalizedGame = created && getEntityId(created, ['gameId'])
                ? created
                : { gameId: unwrapApiData(response), addictionId: selectedAddictionId, name };
            const createdId = getEntityId(normalizedGame, ['gameId']);

            setGames(prev => {
                if (prev.some(game => getEntityId(game, ['gameId']) === createdId)) return prev;
                return [...prev, normalizedGame];
            });
            if (createdId) {
                setSelectedGameIds(prev => prev.includes(createdId) ? prev : [...prev, createdId]);
            }
            setQuery('');
            setGamePickerOpen(false);
        } catch (err) {
            console.error('Error creating game:', err);
            addToast('error', t('dopamine.game_create_error'));
        } finally {
            setCreatingGame(false);
        }
    };

    const handleDeleteFlow = async (flowItem) => {
        const itemId = getEntityId(flowItem, ['dopamineFlowId']);
        if (!itemId || isFlowCompleted(flowItem)) return;
        if (!await confirmDialog(t('dopamine.delete_flow_confirm'))) return;

        setDeletingFlowId(itemId);
        try {
            await dopamineFlowService.delete(itemId);
            setFlowHistory(prev => prev.filter(item => getEntityId(item, ['dopamineFlowId']) !== itemId));
            if (flowId === itemId) {
                resetFlowInputs();
                setStep(0);
            }
            addToast('success', t('dopamine.flow_deleted_success'));
        } catch (err) {
            console.error('Error deleting dopamine flow:', err);
            addToast('error', t('dopamine.flow_delete_error'));
        } finally {
            setDeletingFlowId(null);
        }
    };

    const formattedDate = new Date().toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '70vh', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={46} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="dopamine-page">
            <div className="dopamine-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="dopamine-back" onClick={handleBack}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1>{t('dopamine.control_title')}</h1>
                </div>
            </div>

            <div className="dopamine-flow">
                {shouldShowContractsFirst ? (
                    <FeaturedContracts
                        flows={signedFlows}
                        languageId={languageId}
                        onView={(flowItem) => loadFlowIntoWizard(flowItem, true)}
                        onCreateNew={startNewFlow}
                    />
                ) : (
                <main className="dopamine-flow-card">
                    {readOnlyFlow && (
                        <div className="dopamine-readonly-banner">
                            <span>{t('dopamine.readonly_mode')}</span>
                            <button type="button" onClick={returnToAddictionStep}>{t('dopamine.exit_readonly')}</button>
                        </div>
                    )}

                    {step === 0 && (
                        <>
                            <h2>{t('dopamine.which_games')}</h2>
                            <div className="dopamine-check-list">
                                {addictions.map(addiction => {
                                    const id = getEntityId(addiction, ['addictionId']);
                                    return (
                                        <label className="dopamine-check" key={id}>
                                            <input
                                                type="checkbox"
                                                checked={selectedAddictionId === id}
                                                disabled={saving || readOnlyFlow}
                                                onChange={() => handleAddictionSelect(addiction)}
                                            />
                                            <span>{addiction.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            {saving && <p className="dopamine-step-hint">{t('common.loading')}</p>}
                        </>
                    )}

                    {step === 1 && selectedAddiction && (
                        <>
                            <p style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>
                                {t('dopamine.addiction_label')}: <strong>{selectedAddiction.name}</strong>
                            </p>
                            <div className="dopamine-article" dangerouslySetInnerHTML={{ __html: normalizeHtmlContent(selectedAddiction.description) }} />
                            <div style={{ marginTop: '1.5rem' }}>
                                <button className="dopamine-primary-action" onClick={() => advanceToStep(2)}>
                                    {t('common.next', 'Siguiente')}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <p style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>
                                {t('dopamine.addiction_label')}: <strong>{selectedAddiction?.name}</strong>
                            </p>
                            <div className="dopamine-form-grid">
                                <div className="dopamine-field">
                                    <label>{t('dopamine.lost_money_games')}</label>
                                    {selectedGames.length > 0 && (
                                        <div className="dopamine-selected-games">
                                            {selectedGames.map(game => {
                                                const gameId = getEntityId(game, ['gameId']);
                                                return (
                                                    <span className="dopamine-selected-game" key={gameId}>
                                                        {game.name}
                                                        <button
                                                            type="button"
                                                            aria-label={t('dopamine.remove_game', { name: game.name })}
                                                            disabled={readOnlyFlow}
                                                            onClick={() => removeGame(gameId)}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="dopamine-game-picker">
                                        <input
                                            value={query}
                                            disabled={readOnlyFlow}
                                            onFocus={() => setGamePickerOpen(true)}
                                            onBlur={() => window.setTimeout(() => setGamePickerOpen(false), 120)}
                                            onChange={(event) => {
                                                setQuery(event.target.value);
                                                setGamePickerOpen(true);
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' && canCreateGame) {
                                                    event.preventDefault();
                                                    createGameFromQuery();
                                                }
                                            }}
                                            placeholder={t('common.search')}
                                            style={{ paddingRight: '3rem' }}
                                        />
                                        <Search size={22} className="dopamine-game-search-icon" />
                                        {gamePickerOpen && (
                                            <div className="dopamine-game-results">
                                                {filteredGames.slice(0, 10).map(game => {
                                                    const gameId = getEntityId(game, ['gameId']);
                                                    return (
                                                        <button
                                                            key={gameId}
                                                            type="button"
                                                            className="dopamine-game-result"
                                                            onMouseDown={(event) => event.preventDefault()}
                                                            onClick={() => selectGame(game)}
                                                        >
                                                            {game.name}
                                                        </button>
                                                    );
                                                })}
                                                {canCreateGame && (
                                                    <button
                                                        type="button"
                                                        className="dopamine-game-result dopamine-game-create"
                                                        disabled={creatingGame}
                                                        onMouseDown={(event) => event.preventDefault()}
                                                        onClick={createGameFromQuery}
                                                    >
                                                        {creatingGame ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Plus size={16} />
                                                        )}
                                                        {t('dopamine.add_game_option', { name: query.trim() })}
                                                    </button>
                                                )}
                                                {!filteredGames.length && !canCreateGame && (
                                                    <div className="dopamine-game-empty">
                                                        {t('dopamine.no_games_available')}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="dopamine-field">
                                    <label>{t('dopamine.what_motivates')}</label>
                                    <textarea value={motivation} readOnly={readOnlyFlow} onChange={(event) => setMotivation(event.target.value)} />
                                </div>
                                <div className="dopamine-commitment-text">
                                    <p>{t('dopamine.commitment_invite')}</p>
                                    <p>{t('dopamine.process_intro')}</p>
                                    <ol>
                                        <li>{t('dopamine.process_notifications')}</li>
                                        <li>{t('dopamine.process_report')}</li>
                                    </ol>
                                    <p>{t('dopamine.subscription_note')}</p>
                                </div>
                                <button className="dopamine-primary-action" disabled={!readOnlyFlow && (saving || selectedGameIds.length === 0 || !motivation.trim())} onClick={handleReflectionNext}>
                                    {saving ? t('common.loading') : readOnlyFlow ? t('common.next', 'Siguiente') : t('dopamine.make_commitment')}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="dopamine-form-grid">
                            <div className="dopamine-commitment-text">
                                <p dangerouslySetInnerHTML={{ __html: t('dopamine.commitment_text_intro', { name: user?.name || user?.fullName || user?.firstName || user?.nickName || t('dopamine.user_name_placeholder') }) }} />
                                <p>{t('dopamine.commitment_date_intro')}</p>
                                <p style={{ textAlign: 'center' }}><span className="dopamine-commitment-date">{formattedDate}</span></p>
                            </div>

                            <div className="dopamine-field">
                                <label>{t('dopamine.personal_reasons')}</label>
                                <textarea
                                    value={personalReasons}
                                    readOnly={readOnlyFlow}
                                    onChange={(event) => {
                                        personalReasonsRef.current = event.target.value;
                                        setPersonalReasons(event.target.value);
                                    }}
                                />
                            </div>

                            <div className="dopamine-commitment-text">
                                <p>{t('dopamine.actions_intro')}</p>
                                <ol>
                                    <li>{t('dopamine.action_avoid')}</li>
                                    <li>{t('dopamine.action_support')}</li>
                                </ol>
                            </div>

                            <div className="dopamine-field">
                                <label>{t('dopamine.constructive_activities')}</label>
                                <textarea
                                    value={constructiveActivities}
                                    readOnly={readOnlyFlow}
                                    onChange={(event) => {
                                        constructiveActivitiesRef.current = event.target.value;
                                        setConstructiveActivities(event.target.value);
                                    }}
                                />
                            </div>

                            <div className="dopamine-commitment-text">
                                <p>{t('dopamine.help_when_tempted')}</p>
                                <p>{t('dopamine.signature_statement')}</p>
                            </div>

                            <button className="dopamine-signature-preview" type="button" disabled={readOnlyFlow} onClick={() => setSignatureOpen(true)}>
                                {signature ? <img src={signature} alt={t('dopamine.signature')} /> : t('dopamine.signature')}
                            </button>

                            {!readOnlyFlow && (
                                <button
                                    className="dopamine-primary-action"
                                    disabled={saving || !personalReasons.trim() || !constructiveActivities.trim() || !signature}
                                    onClick={handleCreateCommitment}
                                >
                                    {saving ? t('common.loading') : t('dopamine.sign')}
                                </button>
                            )}
                        </div>
                    )}
                </main>
                )}

                <div className="dopamine-flow-sidebar">
                    <ProgressPanel step={step} maxStepReached={maxStepReached} onStepClick={goToStep} />
                    <FlowHistoryPanel
                        flows={flowHistory}
                        languageId={languageId}
                        onView={(flowItem) => loadFlowIntoWizard(flowItem, true)}
                        onDelete={handleDeleteFlow}
                        deletingFlowId={deletingFlowId}
                    />
                </div>
            </div>

            {signatureOpen && (
                <SignatureModal
                    onCancel={() => setSignatureOpen(false)}
                    onAccept={(dataUrl) => {
                        signatureRef.current = dataUrl;
                        setSignature(dataUrl);
                        setSignatureOpen(false);
                    }}
                />
            )}
            <SubscriptionGate
                isOpen={subscriptionGate.open}
                onClose={() => setSubscriptionGate({ open: false, message: '' })}
                message={subscriptionGate.message}
            />
        </div>
    );
};

export default DopamineControl;

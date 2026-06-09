import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HelpSupport.css';

const CustomerFAQ = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sections = t('help_support.faq.sections', { returnObjects: true });
    const safeSections = Array.isArray(sections) ? sections : [];

    return (
        <div className="faq-page">
            <header className="faq-header">
                <button type="button" onClick={() => navigate('/customer/help-support')} aria-label={t('common.back')}>
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <span>{t('help_support.customer_module')}</span>
                    <h1>{t('help_support.faq.title')}</h1>
                </div>
            </header>

            <div className="faq-layout">
                <aside className="faq-index">
                    <div className="faq-index-card">
                        <HelpCircle size={28} />
                        <strong>{t('help_support.faq.index_title')}</strong>
                        <nav>
                            {safeSections.map(section => (
                                <a key={section.id} href={`#${section.id}`}>{section.icon} {section.title}</a>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main className="faq-content">
                    {safeSections.map(section => (
                        <section className="faq-section" id={section.id} key={section.id}>
                            <h2>{section.icon} {section.title}</h2>
                            <div className="faq-question-list">
                                {section.questions.map(item => (
                                    <article className="faq-question" key={item.number}>
                                        <h3>{item.number}. {item.question}</h3>
                                        {Array.isArray(item.answer) ? (
                                            <ul>
                                                {item.answer.map(answer => <li key={answer}>{answer}</li>)}
                                            </ul>
                                        ) : (
                                            <p>{item.answer}</p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default CustomerFAQ;

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { statusService } from '../services/api';
import StoryCard from './StoryCard';

const StoryCarousel = ({ onAddStory, onSelectStory, statuses = [], loading = false }) => {
    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [statuses, loading]);

    const scroll = (direction) => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 300;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    if (loading) {
        return (
            <div style={{
                height: '200px',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '10px',
                overflow: 'hidden'
            }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="glass-card" style={{
                        width: '115px',
                        height: '200px',
                        flexShrink: 0,
                        animation: 'pulse 1.5s infinite ease-in-out'
                    }} />
                ))}
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', marginBottom: '1.5rem', width: '100%' }}>
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{
                    display: 'flex',
                    gap: '10px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    padding: '2px 0'
                }}
            >
                <style>{`
                    div::-webkit-scrollbar { display: none; }
                    @keyframes pulse {
                        0% { opacity: 0.5; }
                        50% { opacity: 0.8; }
                        100% { opacity: 0.5; }
                    }
                `}</style>

                <StoryCard isAdd onClick={onAddStory} />

                {statuses.map((status) => (
                    <StoryCard
                        key={status.statusId}
                        status={status}
                        onClick={() => onSelectStory(status, statuses)}
                    />
                ))}
            </div>

            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    style={{
                        position: 'absolute',
                        left: '-15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    style={{
                        position: 'absolute',
                        right: '-15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
};

export default StoryCarousel;

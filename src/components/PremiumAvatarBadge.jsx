import React from 'react';
import { Crown } from 'lucide-react';

const PremiumAvatarBadge = ({ size = 22, top = -10, left = -8 }) => (
    <span
        style={{
            position: 'absolute',
            top,
            left,
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #facc15, var(--primary))',
            border: '2px solid #fff',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 4px 10px rgba(212, 144, 0, 0.35)',
            transform: 'rotate(-18deg)',
            zIndex: 5,
            pointerEvents: 'none'
        }}
    >
        <Crown size={Math.max(11, Math.round(size * 0.6))} color="white" strokeWidth={2.6} />
    </span>
);

export default PremiumAvatarBadge;

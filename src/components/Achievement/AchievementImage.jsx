import React, { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';

const PRIVATE_S3_BUCKET_PATTERNS = [
    's3.us-east-2.amazonaws.com/ludopata-prod-media-130356666336/',
    'ludopata-prod-media-130356666336.s3.us-east-2.amazonaws.com/',
];

const isBlockedDirectS3Url = (src) => {
    if (typeof src !== 'string' || !PRIVATE_S3_BUCKET_PATTERNS.some((pattern) => src.includes(pattern))) {
        return false;
    }

    try {
        return !new URL(src).searchParams.has('X-Amz-Signature');
    } catch {
        return true;
    }
};

const fallbackBackground = (isCompleted) => (
    isCompleted
        ? 'linear-gradient(135deg, rgba(217, 148, 0, 0.2), rgba(255, 255, 255, 0.92))'
        : 'linear-gradient(135deg, rgba(100, 116, 139, 0.12), rgba(255, 255, 255, 0.86))'
);

const AchievementImage = ({ src, alt = '', isCompleted = false, style, iconSize = 28, className }) => {
    const shouldSkipRemoteImage = useMemo(() => isBlockedDirectS3Url(src), [src]);
    const [hasError, setHasError] = useState(!src || shouldSkipRemoteImage);

    useEffect(() => {
        setHasError(!src || isBlockedDirectS3Url(src));
    }, [src]);

    if (hasError) {
        return (
            <div
                className={className}
                role="img"
                aria-label={alt || 'Achievement'}
                style={{
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: fallbackBackground(isCompleted),
                    color: isCompleted ? 'var(--primary)' : 'var(--text-muted)',
                    ...style,
                }}
            >
                <Award size={iconSize} strokeWidth={1.9} />
            </div>
        );
    }

    return (
        <img
            className={className}
            src={src}
            alt={alt}
            loading="lazy"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                ...style,
            }}
            onError={() => setHasError(true)}
        />
    );
};

export default AchievementImage;

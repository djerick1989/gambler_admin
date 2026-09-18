import React from 'react';
import { User } from 'lucide-react';
import PremiumAvatarBadge from './PremiumAvatarBadge';

/**
 * El avatar de una persona, con su corona si es premium.
 *
 * Existe porque el mismo círculo estaba escrito a mano en media docena de pantallas, y cada copia
 * había derivado por su lado: una sin icono de respaldo, otra con el gris de las publicaciones,
 * otra con el ámbar del encabezado, y las de estrategias sin corona. Aquí se decide una vez.
 *
 * @param {string}  avatar    URL de la imagen, ya firmada por el backend.
 * @param {boolean} isPremium Si lleva corona.
 * @param {number}  size      Diámetro en píxeles.
 */
const UserAvatar = ({ avatar, isPremium = false, size = 32, style = {}, alt = '' }) => {
    // La corona y el icono se escalan con el círculo para que la proporción se mantenga igual en
    // los 24 px de una estrategia y en los 40 px del encabezado.
    const badgeSize = Math.max(14, Math.round(size * 0.53));
    const badgeOffset = -Math.round(badgeSize * 0.4);
    const iconSize = Math.max(12, Math.round(size * 0.45));

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                flexShrink: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: avatar ? `url(${avatar}) center/cover` : 'rgba(217, 152, 0, 0.16)',
                border: avatar ? 'none' : '2px solid var(--primary)',
                ...style
            }}
            role={alt ? 'img' : undefined}
            aria-label={alt || undefined}
        >
            {isPremium && <PremiumAvatarBadge size={badgeSize} top={badgeOffset} left={badgeOffset} />}
            {!avatar && <User size={iconSize} color="var(--primary)" />}
        </div>
    );
};

export default UserAvatar;

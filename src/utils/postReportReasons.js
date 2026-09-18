import { Ban, Dices, Frown, HeartCrack, MailWarning, MoreHorizontal, Swords } from 'lucide-react';

// Debe coincidir con PostReportReason del backend.
//
// GAMBLING_PROMOTION está en la lista a propósito: en una aplicación de recuperación de ludopatía,
// promocionar apuestas o casinos es de lo más dañino que puede publicar alguien, y no entra en
// ninguna de las categorías habituales de otras redes.
export const REPORT_REASONS = [
    { code: 'SEXUAL_CONTENT', icon: Ban },
    { code: 'VIOLENCE', icon: Swords },
    { code: 'HARASSMENT', icon: Frown },
    { code: 'GAMBLING_PROMOTION', icon: Dices },
    { code: 'SELF_HARM', icon: HeartCrack },
    { code: 'SPAM', icon: MailWarning },
    { code: 'OTHER', icon: MoreHorizontal }
];

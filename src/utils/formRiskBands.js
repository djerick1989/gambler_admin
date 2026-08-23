// Bandas de riesgo de los formularios.
//
// El backend calcula la banda y la devuelve como código (LOW, MODERATE, HIGH, SEVERE, CRITICAL);
// esta tabla existe solo para los análisis viejos, que guardaron el riesgo como un número suelto
// sin banda. Los cortes deben coincidir con FormRiskScoring en el backend.

export const FormRiskBands = {
    forPercent: (percent) => {
        if (percent < 25) return 'low';
        if (percent < 50) return 'moderate';
        if (percent < 75) return 'high';
        return 'severe';
    }
};

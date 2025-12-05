import { useEffect, useState } from 'react';

/**
 * Hook para determinar si el componente ha sido hidratado en el cliente
 * Esto previene desajustes de hidratación entre renderizado del servidor y cliente
 */
export const useHidratacion = () => {
    const [estaHidratado, setEstaHidratado] = useState(false);

    useEffect(() => {
        setEstaHidratado(true);
    }, []);

    return estaHidratado;
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getIdiomas } from '@/app/api-endpoints/idioma';

// Crear contexto de idiomas
const IdiomaContext = createContext(null);

// Provider del contexto de idiomas
export const IdiomaProvider = ({ children }) => {
    const [idiomaActual, setIdiomaActual] = useState({
        iso: 'es', // Código ISO del idioma (es, en, fr, etc.)
        id: null,  // ID del idioma en la base de datos
        nombre: 'Español'
    });
    const [idiomasDisponibles, setIdiomasDisponibles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Cargar idiomas disponibles desde la API
    const cargarIdiomas = async () => {
        try {
            setIsLoading(true);
            console.log('🚀 Iniciando carga de idiomas...');
            const idiomas = await getIdiomas();
            
            // Filtrar solo idiomas activos y mapear para tener la estructura necesaria
            const idiomasActivos = idiomas
                .filter(idioma => idioma.activoSn === 'S')
                .map(idioma => ({
                    id: idioma.id,
                    iso: idioma.iso,
                    nombre: idioma.nombre,
                    // Mapeo para el dropdown de PrimeReact
                    name: idioma.nombre,
                    code: idioma.iso
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));

            console.log('📋 Idiomas activos cargados:', idiomasActivos.map(i => `${i.nombre}(${i.iso}:${i.id})`));
            setIdiomasDisponibles(idiomasActivos);

            // Verificar si hay un idioma guardado en localStorage
            const idiomaGuardado = localStorage.getItem('idioma');
            console.log('💾 Idioma guardado en localStorage:', idiomaGuardado);
            
            if (idiomaGuardado && idiomasActivos.length > 0) {
                const idiomaEncontrado = idiomasActivos.find(idioma => idioma.iso === idiomaGuardado);
                if (idiomaEncontrado) {
                    console.log('✅ Idioma encontrado:', idiomaEncontrado);
                    setIdiomaActual({
                        iso: idiomaEncontrado.iso,
                        id: idiomaEncontrado.id,
                        nombre: idiomaEncontrado.nombre
                    });
                    // Asegurar que localStorage tiene el idioma correcto
                    localStorage.setItem('idioma', idiomaEncontrado.iso);
                    localStorage.setItem('idiomaId', idiomaEncontrado.id.toString());
                } else {
                    // Si el idioma guardado no está disponible, usar el primero disponible
                    console.log('⚠️ Idioma guardado no disponible, usando el primero');
                    const primerIdioma = idiomasActivos[0];
                    cambiarIdioma(primerIdioma.iso);
                }
            } else if (idiomasActivos.length > 0) {
                // Si no hay idioma guardado, usar el primero disponible o español por defecto
                console.log('🔄 Sin idioma guardado, estableciendo español por defecto');
                const idiomaEspanol = idiomasActivos.find(idioma => idioma.iso === 'es');
                const idiomaDefecto = idiomaEspanol || idiomasActivos[0];
                cambiarIdioma(idiomaDefecto.iso);
            }
        } catch (error) {
            console.error('❌ Error cargando idiomas:', error);
            // En caso de error, mantener configuración por defecto
        } finally {
            setIsLoading(false);
        }
    };

    // Función para cambiar idioma
    const cambiarIdioma = (nuevoIsoIdioma) => {
        console.log('🔄 Cambiando idioma a:', nuevoIsoIdioma);
        const idioma = idiomasDisponibles.find(i => i.iso === nuevoIsoIdioma);
        if (idioma) {
            console.log('✅ Idioma encontrado para cambiar:', idioma);
            setIdiomaActual({
                iso: idioma.iso,
                id: idioma.id,
                nombre: idioma.nombre
            });
            
            // Guardar en localStorage PRIMERO
            localStorage.setItem('idioma', idioma.iso);
            localStorage.setItem('idiomaId', idioma.id.toString());
            console.log('💾 Guardado en localStorage - idioma:', idioma.iso, 'id:', idioma.id);

            // Disparar evento personalizado para notificar el cambio DESPUÉS
            setTimeout(() => {
                const event = new CustomEvent('idioma-changed', {
                    detail: {
                        iso: idioma.iso,
                        id: idioma.id,
                        nombre: idioma.nombre
                    }
                });
                console.log('📢 Disparando evento idioma-changed:', event.detail);
                window.dispatchEvent(event);
            }, 0);
        } else {
            console.error('❌ Idioma no encontrado:', nuevoIsoIdioma, 'Disponibles:', idiomasDisponibles.map(i => i.iso));
        }
    };

    // Obtener idioma por defecto compatible con el sistema existente
    const getIdiomaDefecto = () => {
        // Primero intentar obtener de localStorage (más confiable)
        if (typeof window !== 'undefined' && localStorage) {
            const idiomaGuardado = localStorage.getItem('idioma');
            if (idiomaGuardado) {
                return idiomaGuardado;
            }
        }
        // Si no hay nada en localStorage, usar el del contexto
        return idiomaActual.iso;
    };

    // Obtener ID del idioma actual para headers HTTP
    const getIdiomaId = () => {
        const idGuardado = localStorage.getItem('idiomaId');
        return idGuardado || idiomaActual.id;
    };

    // Cargar idiomas al montar el componente
    useEffect(() => {
        cargarIdiomas();
    }, []);

    // Escuchar cambios desde otros componentes
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'idioma' && e.newValue) {
                const idioma = idiomasDisponibles.find(i => i.iso === e.newValue);
                if (idioma) {
                    setIdiomaActual({
                        iso: idioma.iso,
                        id: idioma.id,
                        nombre: idioma.nombre
                    });
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [idiomasDisponibles]);

    const contextValue = {
        idiomaActual,
        idiomasDisponibles,
        isLoading,
        cambiarIdioma,
        getIdiomaDefecto,
        getIdiomaId,
        cargarIdiomas
    };

    return (
        <IdiomaContext.Provider value={contextValue}>
            {children}
        </IdiomaContext.Provider>
    );
};

// Hook para usar el contexto de idiomas
export const useIdiomas = () => {
    const context = useContext(IdiomaContext);
    if (!context) {
        throw new Error('useIdiomas debe ser usado dentro de un IdiomaProvider');
    }
    return context;
};

// Función auxiliar para obtener ID del idioma desde localStorage (compatible con interceptors)
export const getIdiomaIdFromStorage = () => {
    if (typeof window !== 'undefined' && localStorage) {
        return localStorage.getItem('idiomaId');
    }
    return null;
};

// Función auxiliar para obtener idioma por defecto (compatible con sistema existente)
export const getIdiomaDefectoFromStorage = () => {
    if (typeof window !== 'undefined' && localStorage) {
        let idioma = localStorage.getItem('idioma');
        if (!idioma) {
            idioma = 'es'; // Idioma por defecto
            localStorage.setItem('idioma', idioma);
        }
        console.log('📍 getIdiomaDefectoFromStorage() retorna:', idioma);
        return idioma;
    }
    console.log('📍 getIdiomaDefectoFromStorage() retorna por defecto: es');
    return 'es';
};

export default IdiomaContext;
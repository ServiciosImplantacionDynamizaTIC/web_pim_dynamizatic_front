import React, { useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { buscaTraduccionLiteral } from "@/app/api-endpoints/traduccion";
import { getIdiomaDefectoFromStorage } from '../contexts/IdiomaContext';

const IntlProviderWrapper = ({ children }) => {
    const [messages, setMessages] = useState(null);
    const [currentLocale, setCurrentLocale] = useState(getIdiomaDefectoFromStorage());
    const [loading, setLoading] = useState(true);

    const locale = currentLocale;

    // Función para cargar traducciones
    const fetchTranslations = async (iso) => {
        try {
            setLoading(true);
            console.log('📖 Cargando traducciones para idioma:', iso);
            const traducciones = await buscaTraduccionLiteral(iso);
            
            // Verificar que traducciones no sea null/undefined
            const traduccionesSeguras = traducciones || {};
            const numClaves = Object.keys(traduccionesSeguras).length;
            
            console.log('✅ Traducciones cargadas:', numClaves, 'claves');
            console.log('🔍 Tipo de respuesta:', typeof traducciones);
            console.log('🔍 Traducciones raw:', traducciones);
            
            if (numClaves > 0) {
                console.log('🔍 Ejemplo de traducción "Clave":', traduccionesSeguras['Clave']);
                console.log('🔍 Ejemplo de traducción "Plantillas de email":', traduccionesSeguras['Plantillas de email']);
                console.log('📋 Primeras 10 claves:', Object.keys(traduccionesSeguras).slice(0, 10));
                console.log('💾 Estableciendo messages en IntlProvider...');
                setMessages(traduccionesSeguras);
            } else {
                console.warn('⚠️ No se obtuvieron traducciones para', iso);
                console.log('🔧 Estableciendo messages vacío...');
                setMessages({});
            }
        } catch (error) {
            console.error('❌ Error cargando traducciones:', error);
            // En caso de error, usar un objeto vacío para evitar que se rompa IntlProvider
            setMessages({});
        } finally {
            setLoading(false);
        }
    };

    // Cargar traducciones iniciales y cuando cambie el locale
    useEffect(() => {
        fetchTranslations(locale);
    }, [locale]);

    // Escuchar cambios de idioma para recargar traducciones
    useEffect(() => {
        const handleIdiomaChange = async (event) => {
            const { iso } = event.detail;
            console.log('🔄 Cambio de idioma detectado:', iso);
            setCurrentLocale(iso);
        };

        // También escuchar cambios en localStorage (para compatibilidad)
        const handleStorageChange = (e) => {
            if (e.key === 'idioma' && e.newValue) {
                console.log('💾 Cambio en localStorage detectado:', e.newValue);
                setCurrentLocale(e.newValue);
            }
        };

        window.addEventListener('idioma-changed', handleIdiomaChange);
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('idioma-changed', handleIdiomaChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Función para manejar mensajes faltantes sin mostrar advertencias
    const onError = (error) => {
        // Silencia las advertencias de traducciones faltantes
        // Solo logea a la consola si realmente es necesario para debugging
        if (process.env.NODE_ENV === 'development') {
            console.warn('Traducción faltante:', error);
        }
    };

    // No renderizar IntlProvider hasta que las traducciones estén cargadas
    // Evitar error de hidratación usando solo en cliente
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    if (!isClient || loading || messages === null) {
        return (
            <div suppressHydrationWarning>
                Cargando traducciones...
            </div>
        );
    }

    const messageCount = Object.keys(messages || {}).length;
    console.log('🎭 IntlProvider renderizando con:', { 
        locale, 
        messageCount,
        hasMessages: messageCount > 0,
        sampleKeys: Object.keys(messages || {}).slice(0, 5)
    });

    return (
        <IntlProvider 
            key={locale} // Forzar re-render cuando cambie el locale
            locale={locale} 
            messages={messages || {}}
            onError={onError}
            defaultRichTextElements={{}}
            defaultLocale="es"
        >
            {children}
        </IntlProvider>
    );
};

export default IntlProviderWrapper;
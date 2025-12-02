import React from 'react';
import { Button } from 'primereact/button';
import { useIdiomas } from '@/app/contexts/IdiomaContext';
import { useIntl } from 'react-intl';

// Componente de demostración para mostrar información del contexto de idiomas
const IdiomaDebugInfo = () => {
    const { idiomaActual, idiomasDisponibles, isLoading } = useIdiomas();
    const intl = useIntl();

    const testApiCall = async () => {
        try {
            // Llamada directa al endpoint de traducciones
            console.log('🌐 Haciendo llamada directa al endpoint de traducciones...');
            console.log('📍 URL base:', window.location.origin);
            
            // Importar la configuración de la API
            const { settings } = await import('@/app/api-programa');
            const { TraduccionLiteralControllerApi } = await import('@/app/api-programa');
            
            const api = new TraduccionLiteralControllerApi(settings);
            console.log('🔧 API configurada con basePath:', settings.basePath);
            
            // Llamar directamente al método de la API
            const response = await api.traduccionLiteralControllerBuscarTraduccionLiteral(idiomaActual.iso);
            console.log('📨 Respuesta directa de la API:', response);
            console.log('📊 Datos recibidos:', response.data);
            
        } catch (error) {
            console.error('❌ Error en llamada directa:', error);
        }
    };

    const testTranslations = async () => {
        try {
            console.log('🧪 Testing translations manually...');
            const { buscaTraduccionLiteral } = await import('@/app/api-endpoints/traduccion');
            
            // Probar con el idioma actual
            console.log('🔍 Probando con idioma actual:', idiomaActual.iso);
            console.log('🔍 Tipo de parámetro iso:', typeof idiomaActual.iso);
            
            const traducciones = await buscaTraduccionLiteral(idiomaActual.iso);
            
            console.log('📨 Respuesta cruda:', traducciones);
            console.log('📊 Tipo de respuesta:', typeof traducciones);
            console.log('🔍 Es null?:', traducciones === null);
            console.log('🔍 Es undefined?:', traducciones === undefined);
            
            if (traducciones && typeof traducciones === 'object') {
                console.log('📚 Traducciones obtenidas:', Object.keys(traducciones).length, 'claves');
                console.log('🎯 Ejemplo - "Plantillas de email":', traducciones['Plantillas de email']);
                console.log('🎯 Ejemplo - "Clave":', traducciones['Clave']);
                console.log('📋 Primeras 10 claves:', Object.keys(traducciones).slice(0, 10));
            } else {
                console.log('❌ No se obtuvieron traducciones válidas');
            }
            
            // También probar con español directamente
            console.log('🔍 Probando también con español (es)...');
            const traduccionesEs = await buscaTraduccionLiteral('es');
            console.log('📨 Respuesta ES cruda:', traduccionesEs);
            
            if (traduccionesEs && typeof traduccionesEs === 'object') {
                console.log('📚 Traducciones ES:', Object.keys(traduccionesEs).length, 'claves');
                console.log('🎯 ES - "Plantillas de email":', traduccionesEs['Plantillas de email']);
            } else {
                console.log('❌ No se obtuvieron traducciones ES válidas');
            }

            // Forzar recarga de traducciones
            console.log('🔄 Forzando recarga del IntlProvider...');
            window.dispatchEvent(new CustomEvent('idioma-changed', {
                detail: { iso: idiomaActual.iso, id: idiomaActual.id, nombre: idiomaActual.nombre }
            }));
        } catch (error) {
            console.error('❌ Error testing translations:', error);
            console.error('❌ Stack trace:', error.stack);
        }
    };

    const inspectIntlProvider = () => {
        try {
            console.log('🔍 Inspeccionando IntlProvider...');
            console.log('📍 Locale actual de intl:', intl.locale);
            console.log('📍 Messages disponibles en intl:', intl.messages ? Object.keys(intl.messages).length : 'No messages');
            console.log('📍 Sample messages:', intl.messages ? Object.entries(intl.messages).slice(0, 10) : 'None');
            
            // Probar algunas traducciones específicas
            try {
                console.log('🧪 Probando formatMessage con "Clave":', intl.formatMessage({ id: 'Clave' }));
                console.log('🧪 Probando formatMessage con "Plantillas de email":', intl.formatMessage({ id: 'Plantillas de email' }));
            } catch (error) {
                console.error('❌ Error en formatMessage:', error);
            }
        } catch (error) {
            console.error('❌ Error inspeccionando IntlProvider:', error);
        }
    };

    const debugLocalStorage = () => {
        console.log('💾 Estado de localStorage:');
        console.log('- idioma:', localStorage.getItem('idioma'));
        console.log('- idiomaId:', localStorage.getItem('idiomaId'));
        console.log('- userData:', localStorage.getItem('userData'));
        console.log('- accessToken:', localStorage.getItem('accessToken'));
        
        // Verificar cookies también
        console.log('🍪 Cookies:');
        console.log('- authToken:', document.cookie.includes('authToken') ? 'Present' : 'Missing');
    };

    const testDirectEndpoint = async () => {
        try {
            console.log('🌐 Probando endpoint directo...');
            
            // Obtener configuración
            const { devuelveBasePath } = await import('@/app/utility/Utils');
            const basePath = devuelveBasePath();
            const token = localStorage.getItem('accessToken');
            
            console.log('🔗 Base path:', basePath);
            console.log('🎫 Token presente:', !!token);
            console.log('🆔 Idioma ID:', localStorage.getItem('idiomaId'));
            
            // Hacer llamada directa al endpoint
            const url = `${basePath}/traduccion-literales/buscar-traduccion-literal/${idiomaActual.iso}`;
            console.log('📍 URL completa:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-idioma-id': localStorage.getItem('idiomaId') || '1'
                }
            });
            
            console.log('📊 Response status:', response.status);
            console.log('📊 Response headers:', [...response.headers.entries()]);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Respuesta exitosa:', data);
            } else {
                const errorText = await response.text();
                console.log('❌ Error en respuesta:', errorText);
            }
            
        } catch (error) {
            console.error('❌ Error en test directo:', error);
        }
    };

    if (isLoading) {
        return <div>Cargando idiomas...</div>;
    }

    return (
        <div style={{ 
            position: 'fixed', 
            bottom: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px'
        }}>
            <h4>Debug - Contexto de Idiomas</h4>
            <p><strong>Idioma Actual:</strong> {idiomaActual.nombre} ({idiomaActual.iso})</p>
            <p><strong>ID:</strong> {idiomaActual.id}</p>
            <p><strong>localStorage idioma:</strong> {localStorage.getItem('idioma')}</p>
            <p><strong>localStorage idiomaId:</strong> {localStorage.getItem('idiomaId')}</p>
            <p><strong>Total idiomas:</strong> {idiomasDisponibles.length}</p>
            <p><strong>Traducción "Clave":</strong> {intl.formatMessage({ id: 'Clave' })}</p>
            <p><strong>Traducción "Plantillas de email":</strong> {intl.formatMessage({ id: 'Plantillas de email' })}</p>
            <p><strong>¿IntlProvider funciona?:</strong> {intl ? '✅ Sí' : '❌ No'}</p>
            <div style={{ display: 'flex', gap: '3px', marginTop: '5px', flexWrap: 'wrap' }}>
                <Button 
                    label="API" 
                    onClick={testApiCall}
                    size="small"
                />
                <Button 
                    label="Traducciones" 
                    onClick={testTranslations}
                    size="small"
                />
                <Button 
                    label="Endpoint" 
                    onClick={testDirectEndpoint}
                    size="small"
                />
                <Button 
                    label="Intl" 
                    onClick={inspectIntlProvider}
                    size="small"
                />
                <Button 
                    label="Storage" 
                    onClick={debugLocalStorage}
                    size="small"
                />
                <Button 
                    label="Reload" 
                    onClick={() => window.location.reload()}
                    size="small"
                />
            </div>
        </div>
    );
};

export default IdiomaDebugInfo;
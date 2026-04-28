// ============================================================================
// MANAGER DE TEMA DINÁMICO - Se usa para aplicar temas basados en login/logout
// ============================================================================

"use client";
import { useEffect, useState } from 'react';
import { applyThemeConfig } from "@/app/utility/ThemeService";
import { getEmpresa } from "@/app/api-endpoints/empresa";
import { getLayoutConfigFromEmpresa } from "@/app/utility/LayoutConfigService";

interface ThemeConfig {
    colorScheme: string;
    theme: string;
    scale: number;
    ripple: boolean;
    inputStyle: string;
    menuMode: string;
    menuTheme: string;
}

/**
 * Componente que maneja dinámicamente el tema basado en eventos de login/logout
 * No depende de hooks complejos y maneja mejor los estados de autenticación
 */
const DynamicThemeManager = () => {
    const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null);
    //
    //Cargamos los tema de empresa
    //
    const loadEmpresaTheme = async (empresaId: string) => {
        try {
            //
            // Cargamos la información de la empresa y si existe esta aplicamos sus estilos
            //      
            const empresa = await getEmpresa(Number(empresaId));
            if (empresa) {
                //
                // Obtenemos la configuración de tema de la empresa 
                //
                const themeConfig = getLayoutConfigFromEmpresa(empresa);
                setCurrentTheme(themeConfig);
                //
                //Aplicamos el tema inmediatamente
                //
                applyThemeConfig({
                    colorScheme: themeConfig.colorScheme,
                    theme: themeConfig.theme
                }, () => {
                    console.log('Tema de empresa aplicado:', {
                        theme: themeConfig.theme,
                        colorScheme: themeConfig.colorScheme
                    });
                });
                //
                //Si había escala la aplicamos
                //
                if (themeConfig.scale) {
                    document.documentElement.style.fontSize = `${themeConfig.scale}px`;
                }
                //
            }
        } catch (error) {
            //
            //Si ha habido algún error lo mostramos por consola y cargando el tema defecto
            //
            console.error('Error al cargar tema de empresa:', error);
            loadDefaultTheme();
        }
    };
    //
    // Función para cargar tema por defecto
    //
    const loadDefaultTheme = () => {
        //
        //Especificamos la configuración por defecto
        //  
        const defaultConfig: ThemeConfig = {
            colorScheme: 'light',
            theme: 'mitema',
            scale: 14,
            ripple: false,
            inputStyle: 'outlined',
            menuMode: 'static',
            menuTheme: 'colorScheme'
        };
        //
        // Aplicamos la configuración por defecto
        //
        setCurrentTheme(defaultConfig);
        
        applyThemeConfig({
            colorScheme: defaultConfig.colorScheme,
            theme: defaultConfig.theme
        }, () => {
            console.log('Tema por defecto aplicado');
        });
        //
        // Aplicamos escala por defecto
        //
        document.documentElement.style.fontSize = '14px';
    };
    //
    // Verificamos el estado inicial al montar el componente.
    // Solo una llamada: el evento user-logged-in cubre el login y este check cubre el refresh/navegación directa.
    // Los timeouts de polling que había antes causaban 4-5 llamadas simultáneas a la API y race conditions.
    //
    useEffect(() => {
        const empresaId = localStorage.getItem('empresa') ||
            sessionStorage.getItem('empresa') ||
            (() => {
                try { return JSON.parse(localStorage.getItem('userData') || '{}').empresaId; }
                catch { return null; }
            })();

        if (empresaId) {
            loadEmpresaTheme(empresaId.toString());
        } else {
            loadDefaultTheme();
        }
    }, []);

    //
    // Registrar listeners de eventos de autenticación y cambios de storage.
    // Dependencia [] para que los listeners se registren una sola vez — antes dependía de [isLoggedIn],
    // lo que causaba re-registro en cada cambio de estado (cada carga de tema).
    //
    useEffect(() => {
        //
        // Login: cargamos el tema de la empresa que viene en el evento
        //
        const handleLogin = (event: CustomEvent) => {
            const empresaId = event.detail?.empresaId;
            if (empresaId) {
                loadEmpresaTheme(empresaId.toString());
            }
        };
        //
        // Logout: restauramos el tema por defecto
        //
        const handleLogout = () => {
            loadDefaultTheme();
        };
        //
        // Forzar recarga de tema (usado desde otros componentes si es necesario)
        //
        const handleForceThemeCheck = (event: CustomEvent) => {
            const empresaId = event.detail?.empresaId;
            if (empresaId) {
                loadEmpresaTheme(empresaId.toString());
            } else {
                loadDefaultTheme();
            }
        };
        //
        // Cambios en localStorage desde otras pestañas (multi-tab: login/logout en otra ventana)
        //
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'empresa' || e.key === 'userData') {
                if (e.newValue) {
                    let empresaId = null;
                    if (e.key === 'empresa') {
                        empresaId = e.newValue;
                    } else {
                        try {
                            empresaId = JSON.parse(e.newValue).empresaId;
                        } catch (err) {
                            console.error('Error parsing userData from storage:', err);
                        }
                    }
                    if (empresaId) {
                        loadEmpresaTheme(empresaId.toString());
                    }
                } else {
                    loadDefaultTheme();
                }
            }
        };

        window.addEventListener('user-logged-in', handleLogin as EventListener);
        window.addEventListener('user-logged-out', handleLogout);
        window.addEventListener('force-theme-check', handleForceThemeCheck as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('user-logged-in', handleLogin as EventListener);
            window.removeEventListener('user-logged-out', handleLogout);
            window.removeEventListener('force-theme-check', handleForceThemeCheck as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Este componente no renderiza nada visible
    return null;
};

export default DynamicThemeManager;
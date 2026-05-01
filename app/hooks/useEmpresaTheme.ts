// ==========================================================================================================================================
// HOOK QUE GESTIONA DINÁMICAMENTE LOS TEMAS DE EMPRESA - Permite que cada empresa tenga su propia configuración visual personalizada
// ==========================================================================================================================================

import { useState, useEffect, useCallback } from 'react';
import { getEmpresa, patchEmpresa } from "@/app/api-endpoints/empresa";
import { getLayoutConfigFromEmpresa, prepareEmpresaWithLayoutConfig } from "@/app/utility/LayoutConfigService";
import { applyThemeConfig } from "@/app/utility/ThemeService";

interface ThemeConfig {
    colorScheme: string;
    theme: string;
    scale: number;
    ripple: boolean;
    inputStyle: string;
    menuMode: string;
    menuTheme: string;
}

interface UseEmpresaThemeReturn {
    themeConfig: ThemeConfig;
    loading: boolean;
    loadEmpresaThemeConfig: () => Promise<ThemeConfig | null>;
    updateEmpresaThemeConfig: (newConfig: Partial<ThemeConfig>) => Promise<ThemeConfig | null>;
    changeTheme: (newTheme: string) => Promise<ThemeConfig | null>;
    changeColorScheme: (newColorScheme: string) => Promise<ThemeConfig | null>;
    updateMultipleConfigs: (configs: Partial<ThemeConfig>) => Promise<ThemeConfig | null>;
    empresaData: any;
}

/**
 * Hook personalizado para gestionar la configuración de tema de la empresa
 * @returns {UseEmpresaThemeReturn} Objeto con configuración actual y funciones para actualizar
 */
export const useEmpresaTheme = (): UseEmpresaThemeReturn => {
    //
    //Establecemos los valores por defecto en caso de que no se hayan introducido previamente en la empresa
    //
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
        colorScheme: 'light',
        theme: 'mitema',
        scale: 14,
        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'static',
        menuTheme: 'colorScheme'
    });
    
    const [loading, setLoading] = useState(false);
    const [empresaData, setEmpresaData] = useState<any>(null);
    //
    // Cargamos el diseño que debe tener la empresa desde su ID
    //
    const loadEmpresaThemeConfig = useCallback(async (): Promise<ThemeConfig | null> => {
        try {
            setLoading(true);
            //
            // Primero intentamos leer de localStorage (guardado por AuthContext en login).
            // Esto evita llamar a la API antes de que el JWT esté listo y aplica el tema instantáneamente,
            // incluyendo menuTheme que determina el color de fondo de la sidebar.
            //
            const raw = localStorage.getItem('empresaThemeConfig');
            if (raw) {
                const cfg = JSON.parse(raw);
                const config: ThemeConfig = {
                    colorScheme: cfg.esquemaColor || cfg.colorScheme || 'light',
                    theme:       cfg.tema        || cfg.theme       || 'mitema',
                    scale:       cfg.escala      || cfg.scale       || 14,
                    ripple:      Boolean(cfg.temaRipple ?? cfg.ripple ?? false),
                    inputStyle:  cfg.estiloInput || cfg.inputStyle  || 'outlined',
                    menuMode:    cfg.modoMenu    || cfg.menuMode    || 'static',
                    menuTheme:   cfg.temaMenu    || cfg.menuTheme   || 'colorScheme',
                };
                setThemeConfig(config);
                return config;
            }
            //
            // Fallback: si no hay config en localStorage, llamamos a la API
            //
            let empresaId = localStorage.getItem('empresa');
            //
            // Si no existe en localStorage, intentamos obtenerlo desde userData
            //
            if (!empresaId) {
                const userData = localStorage.getItem('userData');
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        empresaId = user.empresaId?.toString();
                    } catch (err) {
                        console.error('Error parsing userData:', err);
                    }
                }
            }
            //
            // Si no hay empresa, usamos configuración por defecto
            //
            if (!empresaId) {
                const defaultConfig: ThemeConfig = {
                    colorScheme: 'light',
                    theme: 'mitema',
                    scale: 14,
                    ripple: false,
                    inputStyle: 'outlined',
                    menuMode: 'static',
                    menuTheme: 'colorScheme'
                };
                setThemeConfig(defaultConfig);
                return defaultConfig;
            }
            //
            // Si hay empresa cargamos su configuración desde el backend
            //
            const empresa = await getEmpresa(Number(empresaId));

            if (empresa) {
                setEmpresaData(empresa);
                const layoutConfig = getLayoutConfigFromEmpresa(empresa);
                setThemeConfig(layoutConfig);
                return layoutConfig;
            }

            return null;
        } catch (error) {
            console.error('Error al cargar la configuración del tema:', error);
            const defaultConfig: ThemeConfig = {
                colorScheme: 'light',
                theme: 'mitema',
                scale: 14,
                ripple: false,
                inputStyle: 'outlined',
                menuMode: 'static',
                menuTheme: 'colorScheme'
            };
            setThemeConfig(defaultConfig);
            return defaultConfig;
        } finally {
            setLoading(false);
        }
    }, []);
    //
    // Función para actualizar la configuración de tema en la empresa
    //
    const updateEmpresaThemeConfig = useCallback(async (newConfig: Partial<ThemeConfig>): Promise<ThemeConfig | null> => {
        try {
            setLoading(true);
            //
            // Obtener el ID de la empresa desde localStorage
            //
            const empresaId = localStorage.getItem('empresa');
            if (!empresaId || !empresaData) {
                throw new Error('No se encontraron datos de empresa');
            }
            //
            // Preparar los datos actualizados de la empresa
            //
            const updatedEmpresaData = prepareEmpresaWithLayoutConfig(empresaData, {
                ...themeConfig,
                ...newConfig
            });
            //
            // Actualizamos en la base de datos
            //
            const updatedEmpresa = await patchEmpresa(Number(empresaId), updatedEmpresaData);
            //
            // Si la actualización ha ido bien, aplicamos la nueva configuración
            //
            if (updatedEmpresa) {
                //
                // Actualizamos estado local
                //
                setEmpresaData(updatedEmpresa);
                
                const newThemeConfig = {
                    ...themeConfig,
                    ...newConfig
                };
                
                setThemeConfig(newThemeConfig);
                return newThemeConfig;
            }
            
            return null;
        } catch (error) {
            console.error('Error al actualizar la configuración del tema:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [themeConfig, empresaData]);

    //
    // Función para cambiar solo el tema visual de forma inmediata
    //
    const changeTheme = useCallback(async (newTheme: string): Promise<ThemeConfig | null> => {
        //
        //Si hemos cambiado el tema al vuelo, actualizamos los cambios por pantalla
        //
        const updatedConfig = await updateEmpresaThemeConfig({ theme: newTheme });
        
        if (updatedConfig) {
            // Aplicar tema inmediatamente
            applyThemeConfig({
                colorScheme: updatedConfig.colorScheme,
                theme: updatedConfig.theme
            }, () => {
                console.log('Tema aplicado:', newTheme);
            });
        }
        
        return updatedConfig;
    }, [updateEmpresaThemeConfig]);

    //
    // Función para cambiar solo el esquema de color de forma inmediata
    //
    const changeColorScheme = useCallback(async (newColorScheme: string): Promise<ThemeConfig | null> => {
        //
        //Si hemos cambiado el esquema de color al vuelo, actualizamos los cambios por pantalla
        //
        const updatedConfig = await updateEmpresaThemeConfig({ colorScheme: newColorScheme });
        
        if (updatedConfig) {
            // Aplicar tema inmediatamente
            applyThemeConfig({
                colorScheme: updatedConfig.colorScheme,
                theme: updatedConfig.theme
            }, () => {
                console.log('Esquema de color aplicado:', newColorScheme);
            });
        }
        
        return updatedConfig;
    }, [updateEmpresaThemeConfig]);

    //
    // Función para cambiar múltiples configuraciones de forma inmediata
    //
    const updateMultipleConfigs = useCallback(async (configs: Partial<ThemeConfig>): Promise<ThemeConfig | null> => {
        //
        //Si hemos cambiado múltiples configuraciones al vuelo, actualizamos los cambios por pantalla
        //
        const updatedConfig = await updateEmpresaThemeConfig(configs);
        
        if (updatedConfig && (configs.colorScheme || configs.theme)) {
            // Aplicar tema si se cambió colorScheme o theme
            applyThemeConfig({
                colorScheme: updatedConfig.colorScheme,
                theme: updatedConfig.theme
            }, () => {
                console.log('Configuración múltiple aplicada:', configs);
            });
        }
        
        return updatedConfig;
    }, [updateEmpresaThemeConfig]);

    //
    // Cargamos la configuración inicial
    //
    useEffect(() => {
        //
        //Comprobamos que estamos en el navegador
        //
        if (typeof window !== 'undefined') {
            //
            // Cargamos la configuración inicial
            //
            loadEmpresaThemeConfig();
            //
            // También verificamos después de un delay por si hay cambios async
            //
            const timeoutId = setTimeout(() => {
                loadEmpresaThemeConfig();
            }, 1000);
            
            return () => clearTimeout(timeoutId);
        }
    }, [loadEmpresaThemeConfig]);

    //
    // Escuchamos cambios en localStorage y eventos de autenticación
    //
    useEffect(() => {
        //
        //Controlamos los cambios en localStorage para 'empresa' y 'userData' y recargamos la configuración
        //
        const handleStorageChange = (e: StorageEvent) => {
            if ((e.key === 'empresa' || e.key === 'userData') && e.newValue) {
                loadEmpresaThemeConfig();
            }
        };
        //
        // En login, AuthContext ya guardó empresaThemeConfig antes de disparar el evento.
        // Leemos directamente de localStorage para no depender de JWT/API.
        //
        const handleLoginEvent = () => {
            const raw = localStorage.getItem('empresaThemeConfig');
            if (raw) {
                try {
                    const cfg = JSON.parse(raw);
                    const config: ThemeConfig = {
                        colorScheme: cfg.esquemaColor || cfg.colorScheme || 'light',
                        theme:       cfg.tema        || cfg.theme       || 'mitema',
                        scale:       cfg.escala      || cfg.scale       || 14,
                        ripple:      Boolean(cfg.temaRipple ?? cfg.ripple ?? false),
                        inputStyle:  cfg.estiloInput || cfg.inputStyle  || 'outlined',
                        menuMode:    cfg.modoMenu    || cfg.menuMode    || 'static',
                        menuTheme:   cfg.temaMenu    || cfg.menuTheme   || 'colorScheme',
                    };
                    setThemeConfig(config);
                } catch (e) {
                    setTimeout(() => loadEmpresaThemeConfig(), 100);
                }
            } else {
                setTimeout(() => loadEmpresaThemeConfig(), 100);
            }
        };
        //
        //Controlamos evento de logout para restaurar configuración por defecto
        //
        const handleLogoutEvent = () => {
            //
            // Restauramos la configuración por defecto
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
            setThemeConfig(defaultConfig);
        };
        //
        //Controlamos las funciones a las que hemos llamado y eliminamos cada listener al desmontar
        //
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('user-logged-in', handleLoginEvent);
            window.addEventListener('user-logged-out', handleLogoutEvent);
            
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('user-logged-in', handleLoginEvent);
                window.removeEventListener('user-logged-out', handleLogoutEvent);
            };
        }
    }, [loadEmpresaThemeConfig]);

    return {
        themeConfig,
        loading,
        loadEmpresaThemeConfig,
        updateEmpresaThemeConfig,
        changeTheme,
        changeColorScheme,
        updateMultipleConfigs,
        empresaData
    };
};
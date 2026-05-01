"use client";
import type {
    Breadcrumb,
    ChildContainerProps,
    LayoutConfig,
    LayoutContextProps,
    LayoutState,
    MenuMode,
    MenuColorScheme,
    ColorScheme,
} from "@/types";
import Head from "next/head";
import React, { useState, useEffect } from "react";
import { useEmpresaTheme } from "@/app/hooks/useEmpresaTheme";

export const LayoutContext = React.createContext({} as LayoutContextProps);

export const LayoutProvider = (props: ChildContainerProps) => {
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    //
    //Obtenemos la configuración del tema de la empresa actual o los valores por defecto
    //
    const { themeConfig } = useEmpresaTheme(); 
    //
    //Definimos el layoutConfig y establecemos los valores por defecto.
    //Usamos un inicializador lazy para leer localStorage sincrónicamente y evitar que
    //el primer render use los valores por defecto (ej. layout-colorscheme-menu en vez de layout-primarycolor-menu).
    //
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(() => {
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem('empresaThemeConfig');
                if (raw) {
                    const cfg = JSON.parse(raw);
                    return {
                        ripple: Boolean(cfg.temaRipple ?? false),
                        inputStyle: (cfg.estiloInput || 'outlined') as "outlined" | "filled",
                        menuMode: (cfg.modoMenu || 'static') as MenuMode,
                        menuTheme: (cfg.temaMenu || 'colorScheme') as MenuColorScheme,
                        colorScheme: (cfg.esquemaColor || 'light') as ColorScheme,
                        theme: cfg.tema || 'mitema',
                        scale: cfg.escala || 14,
                    };
                }
            } catch (e) {}
        }
        return {
            ripple: false,
            inputStyle: "outlined",
            menuMode: "static",
            menuTheme: "colorScheme",
            colorScheme: "light",
            theme: "mitema",
            scale: 14,
        };
    });
    //
    //Una vez obtenida la configuración de la empresa, sincronizamos el layoutConfig con ella
    //
    useEffect(() => {
        if (themeConfig) {
            setLayoutConfig(prev => ({
                ...prev,
                ripple: themeConfig.ripple,
                inputStyle: themeConfig.inputStyle,
                menuMode: themeConfig.menuMode as MenuMode,
                menuTheme: themeConfig.menuTheme as MenuColorScheme,
                colorScheme: themeConfig.colorScheme as ColorScheme,
                theme: themeConfig.theme,
                scale: themeConfig.scale
            }));
        }
    }, [themeConfig]);

    //
    // Escuchamos login/logout directamente para actualizar layoutConfig sin esperar a useEmpresaTheme.
    // Esto evita el flash de estilos incorrectos en el primer render tras el login (el useEffect sobre
    // themeConfig siempre se ejecuta después del render, causando un ciclo extra).
    //
    useEffect(() => {
        const buildConfig = (raw: string): LayoutConfig | null => {
            try {
                const cfg = JSON.parse(raw);
                return {
                    ripple: Boolean(cfg.temaRipple ?? false),
                    inputStyle: (cfg.estiloInput || 'outlined') as "outlined" | "filled",
                    menuMode: (cfg.modoMenu || 'static') as MenuMode,
                    menuTheme: (cfg.temaMenu || 'colorScheme') as MenuColorScheme,
                    colorScheme: (cfg.esquemaColor || 'light') as ColorScheme,
                    theme: cfg.tema || 'mitema',
                    scale: cfg.escala || 14,
                };
            } catch { return null; }
        };

        const handleLogin = () => {
            const raw = localStorage.getItem('empresaThemeConfig');
            if (raw) {
                const config = buildConfig(raw);
                if (config) setLayoutConfig(config);
            }
        };

        const handleLogout = () => {
            setLayoutConfig({
                ripple: false,
                inputStyle: "outlined",
                menuMode: "static",
                menuTheme: "colorScheme",
                colorScheme: "light",
                theme: "mitema",
                scale: 14,
            });
        };

        window.addEventListener('user-logged-in', handleLogin);
        window.addEventListener('user-logged-out', handleLogout);
        return () => {
            window.removeEventListener('user-logged-in', handleLogin);
            window.removeEventListener('user-logged-out', handleLogout);
        };
    }, []);

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        overlaySubmenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
        resetMenu: false,
        sidebarActive: false,
        anchored: false,
    });

    const onMenuToggle = () => {
        if (isOverlay()) {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                overlayMenuActive: !prevLayoutState.overlayMenuActive,
            }));
        }

        if (isDesktop()) {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                staticMenuDesktopInactive:
                    !prevLayoutState.staticMenuDesktopInactive,
            }));
        } else {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive,
            }));
        }
    };

    const showConfigSidebar = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            configSidebarVisible: true,
        }));
    };

    const showProfileSidebar = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            profileSidebarVisible: !prevLayoutState.profileSidebarVisible,
        }));
    };

    const isOverlay = () => {
        return layoutConfig.menuMode === "overlay";
    };

    const isSlim = () => {
        return layoutConfig.menuMode === "slim";
    };

    const isSlimPlus = () => {
        return layoutConfig.menuMode === "slim-plus";
    };

    const isHorizontal = () => {
        return layoutConfig.menuMode === "horizontal";
    };

    const isDesktop = () => {
        return window.innerWidth > 991;
    };

    const value = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        showConfigSidebar,
        showProfileSidebar,
        isSlim,
        isSlimPlus,
        isHorizontal,
        isDesktop,
        breadcrumbs,
        setBreadcrumbs,
    };

    return (
        <LayoutContext.Provider value={value}>
            <>
                <Head>
                    <meta charSet="UTF-8" />                    
                </Head>
                {props.children}
            </>
        </LayoutContext.Provider>
    );
};

"use client";

import React, { useEffect } from 'react';
import { LayoutProvider } from "../layout/context/layoutcontext";
import { AuthProvider } from "./auth/AuthContext";
import { AbilityProvider } from '@/app/utility/Can'; // Importa AbilityProvider

import { PrimeReactProvider, locale, addLocale } from "primereact/api";
import { MenuProvider } from "../layout/context/menucontext";
import LayoutContainer from "@/layout/layoutContainer";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.css";
import "../styles/demo/Demos.scss";
import "../styles/layout/layout.scss";
import IntlProviderWrapper from '@/app/utility/Traducciones.js'; //-> Archivo con la configuración de las traducciones
import { IdiomaProvider } from './contexts/IdiomaContext';
import IdiomaDebugInfo from './components/IdiomaDebugInfo';

import locales from "@/app/utility/locales.json"; //-> Archivo Json con la configuración de PrimeReact de palabras traducidas al español
import AutoLogout from './global';
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import DynamicThemeManager from '@/app/components/DynamicThemeManager';

interface RootLayoutProps {
    children: React.ReactNode;
}

//-> Añadimos el AbilityProvider en el Layout Principal, este archivo es el principal de la aplicación, por lo que se envuelve con AbilityProvider
export default function RootLayout({ children }: RootLayoutProps) {
    useEffect(() => {
        addLocale("es", locales["es"]); // -> Añadimos lenguaje español
        locale("es"); //-> Configuramos por defecto el lenguaje añadido
        //
        // Verificación adicional para aplicar tema después de la carga inicial
        //
        const checkAndApplyTheme = () => {
            const empresaId = localStorage.getItem('empresa');
            if (empresaId) {
                //
                // Dispara el evento personalizado para que el DynamicThemeManager reaccione
                //
                const event = new CustomEvent('force-theme-check', { detail: { empresaId } });
                window.dispatchEvent(event);
            }
        };
        //
        // Verifica y aplica el tema si fuera necesario además esperamos brevemente para que aplique los cambios
        //
        checkAndApplyTheme();
        const timeoutId = setTimeout(checkAndApplyTheme, 100);
        
        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                {/* 
                Creamos una función en javascript puro para que coja el tema correcto cuando recargamos la página una vez logueados, sino pierde el tema. 
                */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        (function() {
                            try {
                                //
                                // Detectamos la empresa actual del localStorage y nos guardamos el tema por defecto
                                //
                                const empresaId = localStorage.getItem('empresa');
                                let themeHref = '/theme/theme-light/mitema/theme.css'; 
                                //
                                //Si existe la empresa cargamos su tema
                                //
                                if (empresaId) {
                                    //                                    
                                    // Intentamos obtener configuración de tema almacenada para cambiarlo
                                    //
                                    const empresaThemeConfig = localStorage.getItem('empresaThemeConfig');
                                    
                                    if (empresaThemeConfig) {
                                        try {
                                            //
                                            //Intentamos cargar la información, en caso contrario cargamos los valores por defecto
                                            //
                                            const themeConfig = JSON.parse(empresaThemeConfig);
                                            const colorScheme = themeConfig.esquemaColor || 'light';
                                            const theme = themeConfig.tema || 'mitema';
                                            
                                            themeHref = '/theme/theme-' + colorScheme + '/' + theme + '/theme.css';
                                        } catch (configErr) {
                                            //
                                            //Si ha ocurrido algun error obteniendo la información ponemos el tema por defecto
                                            //
                                            themeHref = '/theme/theme-light/mitema/theme.css';
                                        }
                                    } else {
                                        //
                                        //Si la empresa no tenía información del tema almacenado usamos el por defecto
                                        //
                                        themeHref = '/theme/theme-light/mitema/theme.css';
                                    }
                                } else {
                                    //
                                    //Si la empresa no tenía información del tema almacenado usamos el por defecto
                                    //
                                    themeHref = '/theme/theme-light/mitema/theme.css';
                                }
                                //
                                // Escribimos el link del tema en el head
                                //
                                document.write('<link id="theme-link" href="' + themeHref + '" rel="stylesheet">');
                                
                            } catch (err) {
                                //
                                //Si ha habido algún error aplicamos el tema por defecto
                                //
                                document.write('<link id="theme-link" href="/theme/theme-light/mitema/theme.css" rel="stylesheet">');
                            }
                        })();
                        `
                    }}
                />
                {/* Helper de emergencia para desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                    <script src="/theme-emergency.js"></script>
                )}
            </head>
            <body>
                <IdiomaProvider>
                    <IntlProviderWrapper>
                        <PrimeReactProvider>
                            {/*
                            Controlamos el tema de la empresa de forma global
                            */}
                            <ThemeProvider>
                                {/* Componente que actualiza el tema dinámicamente basado en login/logout */}
                                <DynamicThemeManager />
                                {/* Envolvemos el Layout Principal con <AuthProvider> para comprobar que el usuario se encuentre atenticado */}
                                <AuthProvider>
                                    <AutoLogout /> {/* Llama al componente AutoLogout al cargar la aplicación */}
                                    <AbilityProvider> {/* Envolvemos con AbilityProvider */}
                                        <MenuProvider>
                                            <LayoutProvider>
                                                <LayoutContainer>
                                                    {children}
                                                    <IdiomaDebugInfo />
                                                </LayoutContainer>
                                            </LayoutProvider>
                                        </MenuProvider>
                                    </AbilityProvider>
                                </AuthProvider>
                            </ThemeProvider>
                        </PrimeReactProvider>
                    </IntlProviderWrapper>
                </IdiomaProvider>
            </body>
        </html>
    );
}

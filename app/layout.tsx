"use client";

import React, { useEffect, Suspense } from 'react';
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
                El link del tema forma parte del JSX para que React lo conozca y no lo elimine durante la hidratación.
                DynamicThemeManager actualiza el href dinámicamente según la empresa del usuario.
                */}
                <link id="theme-link" href="/theme/theme-light/mitema/theme.css" rel="stylesheet" />
            </head>
            <body>
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
                                            <Suspense>
                                                <LayoutContainer>
                                                    {children}
                                                </LayoutContainer>
                                            </Suspense>
                                        </LayoutProvider>
                                    </MenuProvider>
                                </AbilityProvider>
                            </AuthProvider>
                        </ThemeProvider>
                    </PrimeReactProvider>
                </IntlProviderWrapper>
            </body>
        </html>
    );
}

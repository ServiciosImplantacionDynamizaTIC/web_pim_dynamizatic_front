'use client';
import type { MenuModel } from "@/types";
import AppSubMenu from "./AppSubMenu";
import { obtenerTodosLosPermisos } from "@/app/components/shared/componentes";
import { useIntl } from 'react-intl';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthContext';
const AppMenu = () => {
    const intl = useIntl();
    const router = useRouter();
    const { getMenuLateral } = useAuth();
    const [menuModel, setMenuModel] = useState<any[]>([]);
    const [menuLoaded, setMenuLoaded] = useState(false);

    useEffect(() => {
        const cargarMenu = () => {
            const savedMenu = localStorage.getItem("menuLateral");
            if (savedMenu) {
                setMenuModel(JSON.parse(savedMenu));
            }
            setMenuLoaded(true);
        };

        cargarMenu();

        //
        // Fallback: si el menú se guarda en localStorage después de que este componente montara
        // (race condition durante el login), el evento menu-lateral-loaded vuelve a leerlo.
        //
        window.addEventListener('menu-lateral-loaded', cargarMenu);
        return () => window.removeEventListener('menu-lateral-loaded', cargarMenu);
    }, []);

    const model: MenuModel[] = Object.values(menuModel) as MenuModel[];
    if (!menuLoaded) return null;
    return <AppSubMenu model={model} />;
};

export default AppMenu;

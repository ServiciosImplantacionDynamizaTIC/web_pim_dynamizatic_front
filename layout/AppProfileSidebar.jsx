import { Badge } from "primereact/badge";
import { Sidebar } from "primereact/sidebar";
import { useContext, useEffect, useState } from "react";
import { LayoutContext } from "./context/layoutcontext";
import { useAuth } from "@/app/auth/AuthContext";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { tieneUsuarioPermiso } from "@/app/components/shared/componentes";
import Link from "next/link";


const AppProfileSidebar = () => {
    const { layoutState, setLayoutState } = useContext(LayoutContext);
    const { logout } = useAuth();
    const intl = useIntl();
    const [permisoVerPerfil, setPermisoVerPerfil] = useState(false);
    const onProfileSidebarHide = () => {
        setLayoutState((prevState) => ({
            ...prevState,
            profileSidebarVisible: false,
        }));
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                //Obtenemos permisos del usuario
                setPermisoVerPerfil(await tieneUsuarioPermiso('Usuarios', 'VerPerfil'))

            } catch (error) {
                console.error("Error obteniendo los permisos del rol:", error);
            }

        };
        fetchData();
    }, []);

    let sidebarContent = null;
    if (process.env.NEXT_PUBLIC_ENTORNO !== "LOCAL") {
        sidebarContent = (
            <Sidebar
                visible={layoutState.profileSidebarVisible}
                onHide={onProfileSidebarHide}
                position="right"
                className="layout-profile-sidebar w-full sm:w-25rem"
            >
                <div className="flex flex-column mx-auto md:mx-0">
                    <ul className="list-none m-0 p-0">
                    <li onClick={logout}>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <i className="pi pi-power-off text-xl text-primary"></i>
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        {intl.formatMessage({ id: 'Cerrar sesion' })}
                                    </span>
                                </div>
                            </a>
                        </li>
                        {permisoVerPerfil && (
                            <li >
                                <Link className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150"
                                    href={`/usuarios/?usuario=${getUsuarioSesion()?.id}`}
                                    onClick={onProfileSidebarHide}>
                                    <span>
                                        <i className="pi pi-user text-xl text-primary"></i>
                                    </span>
                                    <div className="ml-3">
                                        <span className="mb-2 font-semibold">
                                            {intl.formatMessage({ id: 'Perfil' })}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </Sidebar>
        );
    } else {
        sidebarContent = (
            <Sidebar
                visible={layoutState.profileSidebarVisible}
                onHide={onProfileSidebarHide}
                position="right"
                className="layout-profile-sidebar w-full sm:w-25rem"
            >
                <div className="flex flex-column mx-auto md:mx-0">
                    <span className="mb-2 font-semibold">{intl.formatMessage({ id: 'Bienvenido' })}</span>
                    <span className="text-color-secondary font-medium mb-5">
                        {getUsuarioSesion()?.nombre}
                    </span>
                    <ul className="list-none m-0 p-0">
                        <li onClick={logout}>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <i className="pi pi-power-off text-xl text-primary"></i>
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        {intl.formatMessage({ id: 'Cerrar sesion' })}
                                    </span>
                                </div>
                            </a>
                        </li>
                        {permisoVerPerfil && (
                            <li >
                                <Link className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150"
                                    href={`/usuarios/?usuario=${getUsuarioSesion()?.id}`}
                                    onClick={onProfileSidebarHide}>
                                    <span>
                                        <i className="pi pi-user text-xl text-primary"></i>
                                    </span>
                                    <div className="ml-3">
                                        <span className="mb-2 font-semibold">
                                            {intl.formatMessage({ id: 'Perfil' })}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        )}

                        {/* <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <i className="pi pi-money-bill text-xl text-primary"></i>
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        Billing
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        Amet mimin mıollit
                                    </p>
                                </div>
                            </a>
                        </li>
                        <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <i className="pi pi-cog text-xl text-primary"></i>
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        Settings
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        Exercitation veniam
                                    </p>
                                </div>
                            </a>
                        </li> */}
                    </ul>
                </div>
                {/* <div className="flex flex-column mt-5 mx-auto md:mx-0">
                    <span className="mb-2 font-semibold">Notifications</span>
                    <span className="text-color-secondary font-medium mb-5">
                        You have 3 notifications
                    </span>
                    <ul className="list-none m-0 p-0">
                        <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <i className="pi pi-comment text-xl text-primary"></i>
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        Your post has new comments
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        5 min ago
                                    </p>
                                </div>
                            </a>
                        </li>
                        <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <i className="pi pi-trash text-xl text-primary"></i>
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        Your post has been deleted
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        15min ago
                                    </p>
                                </div>
                            </a>
                        </li>
                        <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <i className="pi pi-folder text-xl text-primary"></i>
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        Post has been updated
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        3h ago
                                    </p>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div> */}
                {/* <div className="flex flex-column mt-5 mx-auto md:mx-0">
                    <span className="mb-2 font-semibold">Messages</span>
                    <span className="text-color-secondary font-medium mb-5">
                        You have new messages
                    </span>
                    <ul className="list-none m-0 p-0">
                        <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <img
                                        src="/demo/images/avatar/circle/avatar-m-8.png"
                                        alt="Avatar"
                                        className="w-2rem h-2rem"
                                    />
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        James Robinson
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        10 min ago
                                    </p>
                                </div>
                                <Badge value="3" className="ml-auto"></Badge>
                            </a>
                        </li>
                        <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <img
                                        src="/demo/images/avatar/circle/avatar-f-8.png"
                                        alt="Avatar"
                                        className="w-2rem h-2rem"
                                    />
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        Mary Watson
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        15min ago
                                    </p>
                                </div>
                                <Badge value="1" className="ml-auto"></Badge>
                            </a>
                        </li>
                        <li>
                            <a className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150">
                                <span>
                                    <img
                                        src="/demo/images/avatar/circle/avatar-f-4.png"
                                        alt="Avatar"
                                        className="w-2rem h-2rem"
                                    />
                                </span>
                                <div className="ml-3">
                                    <span className="mb-2 font-semibold">
                                        Aisha Webb
                                    </span>
                                    <p className="text-color-secondary m-0">
                                        3h ago
                                    </p>
                                </div>
                                <Badge value="2" className="ml-auto"></Badge>
                            </a>
                        </li>
                    </ul>
                </div> */}
            </Sidebar>
        );
    }


    return sidebarContent;
};

export default AppProfileSidebar;
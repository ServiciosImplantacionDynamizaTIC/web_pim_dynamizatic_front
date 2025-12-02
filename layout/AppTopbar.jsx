import React, { useContext, useRef, useImperativeHandle, useState, useEffect } from 'react';
import { LayoutContext } from './context/layoutcontext';
import { getIdiomas } from '@/app/api-endpoints/idioma';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { getUsuarioAvatar } from "@/app/api-endpoints/usuario";
import { getVistaEmpresaRol } from "@/app/api-endpoints/rol";
import { devuelveBasePath, getUsuarioSesion, verificarUrlExiste } from "@/app/utility/Utils";
import { useIdiomas } from '@/app/contexts/IdiomaContext';

const AppTopbar = React.forwardRef((props, ref) => {
    const { onMenuToggle, showProfileSidebar, showConfigSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const [avatar, setAvatar] = useState(null);
    
    // Usar el contexto de idiomas
    const { idiomaActual, idiomasDisponibles, cambiarIdioma, isLoading } = useIdiomas();

    const onConfigButtonClick = () => {
        showConfigSidebar();
    };

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
    }));

    const [logoEmpresaUrl, setLogoEmpresaUrl] = useState(null);
    const [empresaNombre, setEmpresaNombre] = useState('');
    useEffect(() => {
        const fetchData = async () => {
            await obtenerAvatarUsuario();
            //Si el rol del usuario tiene permisos para ver la empresa
            if (await obtenerRolUsuario()) {
                obtenerNombreEmpresa();
                //obtenerLogoEmpresa()
            }
        }
        fetchData();
    }, []);

    const obtenerAvatarUsuario = async () => {
        let avatar = await getUsuarioAvatar(getUsuarioSesion()?.id);
        if (avatar.length > 0){
            const urlOriginal = avatar[0].url;
            const urlRedimensionada = urlOriginal.replace(/(\/[^\/]+\/)([^\/]+\.\w+)$/, '$1200x200_$2'); // Imagen Miniatura
            
            // Construir las URLs completas
            const urlCompletaRedimensionada = `${devuelveBasePath()}${urlRedimensionada}`;
            const urlCompletaOriginal = `${devuelveBasePath()}${urlOriginal}`;
            
            // Verificar si existe la imagen redimensionada
            const existeRedimensionada = await verificarUrlExiste(urlCompletaRedimensionada);
            
            if (existeRedimensionada) {
                console.log('Usando imagen redimensionada:', urlCompletaRedimensionada);
                setAvatar(urlCompletaRedimensionada);
            } else {
                console.log('Imagen redimensionada no encontrada, usando original:', urlCompletaOriginal);
                setAvatar(urlCompletaOriginal);
            }
        }
        else{
            setAvatar(`${devuelveBasePath()}/multimedia/Sistema/200x200_imagen-no-disponible.jpeg`);
        }
    }



    const obtenerRolUsuario = async () => {
        const usuario = getUsuarioSesion();
        const queryParamsRol = {
            where: {
                and: {
                    id: usuario.rolId
                }
            },
        };
        const rol = await getVistaEmpresaRol(JSON.stringify(queryParamsRol));
        //setMuestraEmpresa(rol[0].muestraEmpresa === 'S')
        return rol[0].muestraEmpresa === 'S'
    }

    const obtenerNombreEmpresa = async () => {
        const queryParamsTiposArchivo = {
            where: {
                and: {
                    id: Number(localStorage.getItem('empresa'))
                }
            },
        };
        const empresa = await getVistaEmpresaMoneda(JSON.stringify(queryParamsTiposArchivo));
        setEmpresaNombre(empresa[0].nombre)
    }


    const handleCambiarIdioma = (idiomaSeleccionado) => {
        // Cambiar el idioma usando el contexto
        cambiarIdioma(idiomaSeleccionado.code);
        
        // Recargar la página para aplicar las traducciones (comportamiento original)
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }

    return (
        <div className="layout-topbar">
            <div className="topbar-start">
                <button
                    ref={menubuttonRef}
                    type="button"
                    className="topbar-menubutton p-link p-trigger"
                    onClick={onMenuToggle}
                >
                    <i className="pi pi-bars"></i>
                </button>

                {/* <AppBreadcrumb className="topbar-breadcrumb"></AppBreadcrumb> */}
            </div>

            <div className="topbar-end">
                <ul className="topbar-menu">
                    {false && (
                        //Uso esta para "comentar" esta etiqueta html
                        <li className="topbar-search">
                            <span className="p-input-icon-left">
                                <i className="pi pi-search"></i>
                                <InputText
                                    type="text"
                                    placeholder="Search"
                                    className="w-12rem sm:w-full"
                                />
                            </span>
                        </li>
                    )}
                    {false && (
                        <li className="ml-3">
                            <Button
                                type="button"
                                icon="pi pi-cog"
                                text
                                rounded
                                severity="secondary"
                                className="flex-shrink-0"
                                onClick={onConfigButtonClick}
                            ></Button>
                        </li>
                    )}
                    <li className="ml-3">

                        
                        <h5 className="m-0 mr-2">{empresaNombre}</h5>
                    </li>
                    <li className="ml-3">
                        <Dropdown
                            value={idiomasDisponibles.find(idioma => idioma.iso === idiomaActual.iso)}
                            onChange={(e) => handleCambiarIdioma(e.value)}
                            options={idiomasDisponibles}
                            optionLabel="name"
                            placeholder="Seleccionar idioma"
                            disabled={isLoading}
                        />
                    </li>
                    <li className="topbar-profile">
                        <button
                            type="button"
                            className="p-link"
                            onClick={showProfileSidebar}
                        >
                            <img
                                src={avatar}
                                alt="Profile"
                            />
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
});

export default AppTopbar;
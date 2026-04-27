"use client";
import { deleteUsuario, getUsuarios, getUsuariosCount } from "@/app/api-endpoints/usuario";
import Crud from "../../components/shared/crud";
import EditarUsuario from "./editar";
import { useIntl } from 'react-intl'
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getUsuarioSesion } from "@/app/utility/Utils";

const Usuario = () => {
    const intl = useIntl();
    const searchParams = useSearchParams();
    const router = useRouter();
    const usuarioSesionId = getUsuarioSesion()?.id;
    const [idUsuario, setIdUsuario] = useState(parseInt(searchParams.get("usuario") || localStorage.getItem("usuarioId")));
    const [crudKey, setCrudKey] = useState(0);
    const esPrimerRender = useRef(true);

    useEffect(() => {
        // En el primer render no hacemos nada: el estado inicial ya leyó el parámetro de la URL
        if (esPrimerRender.current) {
            esPrimerRender.current = false;
            return;
        }
        // En navegaciones posteriores (ej: clic en "Perfil" desde el sidebar estando ya en /usuarios)
        const param = searchParams.get("usuario");
        if (param) {
            const nuevoId = parseInt(param);
            if (!isNaN(nuevoId) && nuevoId > 0) {
                setIdUsuario(nuevoId);
                setCrudKey(prev => prev + 1);
            }
            router.replace('/usuarios', { scroll: false });
        }
    }, [searchParams]);

    const columnas = [
        { campo: 'avatar', header: intl.formatMessage({ id: 'Avatar' }), tipo: 'imagen' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'nombreRol', header: intl.formatMessage({ id: 'Rol' }), tipo: 'string' },
        { campo: 'nombreIdioma', header: intl.formatMessage({ id: 'Idioma' }), tipo: 'string' },
        { campo: 'mail', header: intl.formatMessage({ id: 'Email' }), tipo: 'string' },
        { campo: 'telefono', header: intl.formatMessage({ id: 'Telefono' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]

    return (
        <div>
            {(!isNaN(idUsuario) && idUsuario > 0) && (
                <Crud
                    key={crudKey}
                    headerCrud={intl.formatMessage({ id: 'Usuarios' })}
                    getRegistros={getUsuarios}
                    getRegistrosCount={getUsuariosCount}
                    botones={['nuevo', 'editar', 'eliminar', 'descargarCSV', 'importar']}
                    filtradoBase={{
                        empresaId: Number(localStorage.getItem('empresa'))
                    }}
                    controlador={"Usuarios"}
                    registroEditar={idUsuario}
                    editarComponente={<EditarUsuario />}
                    seccion={"Usuario"}
                    columnas={columnas}
                    deleteRegistro={deleteUsuario}
                    validarEliminar={{ campo: 'id', valores: [usuarioSesionId] }}
                    importarTabla="usuario"
                />
            )}
            {(isNaN(idUsuario) && searchParams.get("usuario") == null && localStorage.getItem("usuarioId") == null) &&
                <Crud
                    headerCrud={intl.formatMessage({ id: 'Usuarios' })}
                    getRegistros={getUsuarios}
                    getRegistrosCount={getUsuariosCount}
                    botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV', 'importar']}
                    filtradoBase={{
                        empresaId: Number(localStorage.getItem('empresa'))
                    }}
                    controlador={"Usuarios"}
                    editarComponente={<EditarUsuario />}
                    seccion={"Usuario"}
                    columnas={columnas}
                    deleteRegistro={deleteUsuario}
                    validarEliminar={{ campo: 'id', valores: [usuarioSesionId] }}
                    importarTabla="usuario"
                />
            }
        </div>
    );
};
export default Usuario;

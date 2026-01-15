"use client";
import { deleteUsuario, getUsuarios, getUsuariosCount } from "@/app/api-endpoints/usuario";
import Crud from "../../components/shared/crud";
import EditarUsuario from "./editar";
import { useIntl } from 'react-intl'
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useState, useEffect, useRef } from "react";

const Usuario = () => {
    const intl = useIntl();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [idUsuario, setIdUsuario] = useState(parseInt(searchParams.get("usuario") || localStorage.getItem("usuarioId")));

    const columnas = [        
        {campo: 'avatar', header:  intl.formatMessage({ id: 'Avatar' }), tipo: 'imagen'},
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
                    headerCrud={intl.formatMessage({ id: 'Usuarios' })}
                    getRegistros={getUsuarios}
                    getRegistrosCount={getUsuariosCount}
                    botones={['nuevo', 'editar', 'eliminar', 'descargarCSV']}
                    filtradoBase={{
                        empresaId: Number(localStorage.getItem('empresa'))
                    }}
                    controlador={"Usuarios"}
                    registroEditar={idUsuario}
                    editarComponente={<EditarUsuario />}
                    seccion={"Usuarios"}
                    columnas={columnas}
                    deleteRegistro={deleteUsuario}
                />
            )}
            {(isNaN(idUsuario) && searchParams.get("usuario") == null && localStorage.getItem("usuarioId") == null) &&
                <Crud
                    headerCrud={intl.formatMessage({ id: 'Usuarios' })}
                    getRegistros={getUsuarios}
                    getRegistrosCount={getUsuariosCount}
                    botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                    filtradoBase={{
                        empresaId: Number(localStorage.getItem('empresa'))
                    }}
                    controlador={"Usuarios"}
                    editarComponente={<EditarUsuario />}
                    seccion={"Usuario"}
                    columnas={columnas}
                    deleteRegistro={deleteUsuario}
                />
            }
        </div>
    );
};
export default Usuario;
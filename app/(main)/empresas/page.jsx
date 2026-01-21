"use client";
import { deleteEmpresa, getEmpresas, getEmpresasCount } from "@/app/api-endpoints/empresa";
import Crud from "../../components/shared/crud";
import EditarEmpresa from "./editar";
import { useIntl } from 'react-intl'

const Empresa = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'codigo', header: intl.formatMessage({ id: 'Código' }), tipo: 'string' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },      
        { campo: 'logo', header: intl.formatMessage({ id: 'Logo' }), tipo: 'imagen' },
        { campo: 'imagen', header: intl.formatMessage({ id: 'Imagen' }), tipo: 'imagen' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Empresas' })}
                getRegistros={getEmpresas}
                getRegistrosCount={getEmpresasCount}
                botones={['nuevo', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Empresas"}
                empresaId={null}
                editarComponente={<EditarEmpresa />}
                seccion={"Empresas"}
                columnas={columnas}
                deleteRegistro={deleteEmpresa}
            />
        </div>
    );
};
export default Empresa;
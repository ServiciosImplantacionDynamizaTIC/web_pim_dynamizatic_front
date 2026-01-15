"use client";
import { getVistaArchivoEmpresa, getVistaArchivoEmpresaCount, deleteArchivo } from "@/app/api-endpoints/archivo";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "@/app/utility/Utils";
const Archivo = () => {
    const intl = useIntl()
    const columnas = [
        { campo: 'tabla', header: intl.formatMessage({ id: 'Tabla' }), tipo: 'string' },
        { campo: 'tablaId', header: 'ID', tipo: 'string' },
        { campo: 'urlee', header: intl.formatMessage({ id: 'Archivo' }), tipo: 'imagen' },
        { campo: 'url', header: 'Url', tipo: 'string' },
    ]

    // Esta función transforma los registros para su exportación en formato CSV,
    // Permite asignar nombres personalizados a las columnas existentes y agregar nuevas columnas calculadas según las necesidades.
    const procesarDatosParaCSV = (registros) => {
        return registros.map(registro => {
            return {
                'Url': registro.url,
            };
        });
    };

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Archivos' })}
                getRegistros={getVistaArchivoEmpresa}
                getRegistrosCount={getVistaArchivoEmpresaCount}
                botones={['descargarCSV']}
                controlador={"Archivos"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                columnas={columnas}
                deleteRegistro={deleteArchivo}
                procesarDatosParaCSV={procesarDatosParaCSV}
            />
        </div>
    );
};
export default Archivo;
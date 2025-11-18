"use client";
import { getTraduccionLiterales, getTraduccionLiteralesCount, deleteTraduccionLiteral } from "@/app/api-endpoints/traduccion";
import { getIdiomas } from "@/app/api-endpoints/idioma";
import EditarTraduccion from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl'
import { useEffect, useState } from 'react';

const TraduccionLiteral = () => {
    const intl = useIntl();
    const [columnas, setColumnas] = useState([]);

    useEffect(() => {
        const cargarColumnas = async () => {
            try {
                // Columna fija (Clave)
                const columnaBase = [{ campo: 'clave', header: intl.formatMessage({ id: 'Clave' }), tipo: 'string' }];
                
                // Obtener los idiomas de la base de datos
                const idiomas = await getIdiomas();
                const idiomasOrdenados = idiomas.sort((a, b) => a.nombre.localeCompare(b.nombre));
                
                // Añadir una columna por cada idioma
                const columnasIdiomas = idiomasOrdenados.map(idioma => ({
                    campo: idioma.nombre.toLowerCase(),
                    header: idioma.nombre,
                    tipo: 'string'
                }));

                // Combinar las columnas base con las de idiomas
                setColumnas([...columnaBase, ...columnasIdiomas]);
            } catch (error) {
                console.error('Error al cargar los idiomas:', error);
            }
        };

        cargarColumnas();
    }, []);

    // No renderizar el Crud hasta que las columnas estén cargadas
    if (columnas.length === 0) {
        return <div>Cargando...</div>;
    }

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Traducciones' })}
                getRegistros={getTraduccionLiterales}
                getRegistrosCount={getTraduccionLiteralesCount}
                botones={['nuevo','ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Traducciones"}
                editarComponente={<EditarTraduccion />}
                columnas={columnas}
                deleteRegistro={deleteTraduccionLiteral}
            />
        </div>
    );
};

export default TraduccionLiteral;
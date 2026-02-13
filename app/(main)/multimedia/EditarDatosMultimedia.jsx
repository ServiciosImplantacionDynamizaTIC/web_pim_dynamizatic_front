import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';
import { getCategorias } from "@/app/api-endpoints/categoria";
import { getUsuarioSesion } from "@/app/utility/Utils";

const EditarDatosMultimedia = ({ multimedia, setMultimedia, estadoGuardando, isEdit, listaTipoArchivos }) => {
    const intl = useIntl();
    const [categorias, setCategorias] = useState([]);
    
    const tiposMultimedia = [
        { label: 'Imagen', value: 'imagen' },
        { label: 'Video', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Documento', value: 'documento' }
    ];

    useEffect(() => {
        const cargarCategorias = async () => {
            try {
                const filtroCategorias = JSON.stringify({
                    where: {
                        empresaId: getUsuarioSesion()?.empresaId,
                        activoSn: 'S'
                    }
                });
                const categoriasData = await getCategorias(filtroCategorias);
                const categoriasOptions = categoriasData.map(cat => ({
                    label: cat.nombre,
                    value: cat.id
                }));
                setCategorias(categoriasOptions);
            } catch (error) {
                console.error('Error cargando categorías:', error);
            }
        };
        cargarCategorias();
    }, []);
    
    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={multimedia}
                        setRegistro={setMultimedia}
                        archivoTipo={tipoArchivo.tipo}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
        else {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <ArchivoInput
                        registro={multimedia}
                        setRegistro={setMultimedia}
                        archivoTipo={tipoArchivo.tipo}
                        archivoHeader={tipoArchivo.nombre}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
    }

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let _multimedia = { ...multimedia };
        const esTrue = valor === true ? 'S' : 'N';
        _multimedia[`${nombreInputSwitch}`] = esTrue;
        setMultimedia(_multimedia);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del multimedia' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={multimedia.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre del archivo multimedia' })}
                            onChange={(e) => setMultimedia({ ...multimedia, nombre: e.target.value })}
                            className={`${(estadoGuardando && multimedia.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={200}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="tipo"><b>{intl.formatMessage({ id: 'Tipo' })}</b></label>
                        <Dropdown
                            id="tipo"
                            value={multimedia.tipo}
                            options={tiposMultimedia}
                            onChange={(e) => setMultimedia({ ...multimedia, tipo: e.value })}
                            placeholder={intl.formatMessage({ id: 'Seleccionar tipo' })}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={multimedia.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>
                    
                    {
                        ...inputsDinamicos //Muestra las inputs generados
                    }
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                        <InputTextarea 
                            id="descripcion"
                            value={multimedia.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción del archivo multimedia' })}
                            onChange={(e) => setMultimedia({ ...multimedia, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosMultimedia;
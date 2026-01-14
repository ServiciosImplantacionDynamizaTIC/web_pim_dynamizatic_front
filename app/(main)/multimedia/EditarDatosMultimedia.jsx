import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';

const EditarDatosMultimedia = ({ multimedia, setMultimedia, estadoGuardando, isEdit, listaTipoArchivos }) => {
    const intl = useIntl();
    
    const tiposMultimedia = [
        { label: 'Imagen', value: 'imagen' },
        { label: 'Video', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Documento', value: 'documento' }
    ];
    
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
                        <label htmlFor="tipo">{intl.formatMessage({ id: 'Tipo' })}</label>
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
                        <label htmlFor="formato">{intl.formatMessage({ id: 'Formato' })}</label>
                        <InputText 
                            id="formato"
                            value={multimedia.formato || ''}
                            placeholder={intl.formatMessage({ id: 'Ej: JPG, MP4, PDF' })}
                            onChange={(e) => setMultimedia({ ...multimedia, formato: e.target.value })}
                            maxLength={50}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="tamañoBytes">{intl.formatMessage({ id: 'Tamaño (bytes)' })}</label>
                        <InputNumber 
                            id="tamañoBytes"
                            value={multimedia.tamañoBytes}
                            placeholder={intl.formatMessage({ id: 'Tamaño en bytes' })}
                            onValueChange={(e) => setMultimedia({ ...multimedia, tamañoBytes: e.value })}
                            disabled={estadoGuardando}
                            min={0}
                            inputStyle={{ textAlign: 'right' }}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="archivoOriginal"><b>{intl.formatMessage({ id: 'Archivo Original' })}*</b></label>
                        <InputText 
                            id="archivoOriginal"
                            value={multimedia.archivoOriginal}
                            placeholder={intl.formatMessage({ id: 'Ruta del archivo original' })}
                            onChange={(e) => setMultimedia({ ...multimedia, archivoOriginal: e.target.value })}
                            className={`${(estadoGuardando && multimedia.archivoOriginal === "") ? "p-invalid" : ""}`}
                            maxLength={250}
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

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="archivoThumbnail">{intl.formatMessage({ id: 'Archivo Thumbnail' })}</label>
                        <InputText 
                            id="archivoThumbnail"
                            value={multimedia.archivoThumbnail || ''}
                            placeholder={intl.formatMessage({ id: 'Ruta del thumbnail' })}
                            onChange={(e) => setMultimedia({ ...multimedia, archivoThumbnail: e.target.value })}
                            maxLength={250}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="archivoMedio">{intl.formatMessage({ id: 'Archivo Medio' })}</label>
                        <InputText 
                            id="archivoMedio"
                            value={multimedia.archivoMedio || ''}
                            placeholder={intl.formatMessage({ id: 'Ruta del archivo medio' })}
                            onChange={(e) => setMultimedia({ ...multimedia, archivoMedio: e.target.value })}
                            maxLength={250}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="archivoGrande">{intl.formatMessage({ id: 'Archivo Grande' })}</label>
                        <InputText 
                            id="archivoGrande"
                            value={multimedia.archivoGrande || ''}
                            placeholder={intl.formatMessage({ id: 'Ruta del archivo grande' })}
                            onChange={(e) => setMultimedia({ ...multimedia, archivoGrande: e.target.value })}
                            maxLength={250}
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
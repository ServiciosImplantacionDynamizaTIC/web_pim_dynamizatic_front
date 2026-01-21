import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { useIntl } from 'react-intl';

const EditarDatosCatalogo = ({ catalogo, setCatalogo, estadoGuardando, isEdit, listaTipoArchivos }) => {
    const intl = useIntl();
    
    const tiposCatalogo = [
        { label: 'Digital', value: 'digital' },
        { label: 'Impreso', value: 'impreso' },
        { label: 'Web', value: 'web' }
    ];

    const estadosCatalogo = [
        { label: 'Borrador', value: 'borrador' },
        { label: 'Activo', value: 'activo' },
        { label: 'Inactivo', value: 'inactivo' },
        { label: 'Archivado', value: 'archivado' }
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
                        registro={catalogo}
                        setRegistro={setCatalogo}
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
                        registro={catalogo}
                        setRegistro={setCatalogo}
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
        let _catalogo = { ...catalogo };
        const esTrue = valor === true ? 'S' : 'N';
        _catalogo[`${nombreInputSwitch}`] = esTrue;
        setCatalogo(_catalogo);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del catálogo' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={catalogo.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre del catálogo' })}
                            onChange={(e) => setCatalogo({ ...catalogo, nombre: e.target.value })}
                            className={`${(estadoGuardando && catalogo.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={200}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="tipo"><b>{intl.formatMessage({ id: 'Tipo' })}</b></label>
                        <Dropdown
                            id="tipo"
                            value={catalogo.tipo}
                            options={tiposCatalogo}
                            onChange={(e) => setCatalogo({ ...catalogo, tipo: e.value })}
                            placeholder={intl.formatMessage({ id: 'Seleccionar tipo' })}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="estado"><b>{intl.formatMessage({ id: 'Estado' })}</b></label>
                        <Dropdown
                            id="estado"
                            value={catalogo.estado}
                            options={estadosCatalogo}
                            onChange={(e) => setCatalogo({ ...catalogo, estado: e.value })}
                            placeholder={intl.formatMessage({ id: 'Seleccionar estado' })}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={catalogo.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="fechaPublicacion">{intl.formatMessage({ id: 'Fecha de Publicación' })}</label>
                        <Calendar
                            id="fechaPublicacion"
                            value={catalogo.fechaPublicacion ? new Date(catalogo.fechaPublicacion) : null}
                            onChange={(e) => setCatalogo({ ...catalogo, fechaPublicacion: e.value })}
                            placeholder={intl.formatMessage({ id: 'Seleccionar fecha' })}
                            disabled={estadoGuardando}
                            dateFormat="dd/mm/yy"
                            showIcon
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="fechaVencimiento">{intl.formatMessage({ id: 'Fecha de Vencimiento' })}</label>
                        <Calendar
                            id="fechaVencimiento"
                            value={catalogo.fechaVencimiento ? new Date(catalogo.fechaVencimiento) : null}
                            onChange={(e) => setCatalogo({ ...catalogo, fechaVencimiento: e.value })}
                            placeholder={intl.formatMessage({ id: 'Seleccionar fecha' })}
                            disabled={estadoGuardando}
                            dateFormat="dd/mm/yy"
                            showIcon
                        />
                    </div>
                    
                    {
                        ...inputsDinamicos //Muestra las inputs generados
                    }
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                        <InputTextarea 
                            id="descripcion"
                            value={catalogo.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción del catálogo' })}
                            onChange={(e) => setCatalogo({ ...catalogo, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosCatalogo;
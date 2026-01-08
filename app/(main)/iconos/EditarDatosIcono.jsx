import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputSwitch } from 'primereact/inputswitch';
import { useIntl } from 'react-intl';

const EditarDatosIcono = ({ icono, setIcono, estadoGuardando, isEdit, listaTipoArchivos }) => {
    const intl = useIntl();
    
    // Opciones fijas para el dropdown de tipo
    const tiposIcono = [
        { label: 'Tipo 1', value: 'Tipo 1' },
        { label: 'Tipo 2', value: 'Tipo 2' },
        { label: 'Tipo 3', value: 'Tipo 3' }
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
                        registro={icono}
                        setRegistro={setIcono}
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
                        registro={icono}
                        setRegistro={setIcono}
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
        let _icono = { ...icono };
        const esTrue = valor === true ? 'S' : 'N';
        _icono[`${nombreInputSwitch}`] = esTrue;
        setIcono(_icono);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del icono' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={icono.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre del icono' })}
                            onChange={(e) => setIcono({ ...icono, nombre: e.target.value })}
                            className={`${(estadoGuardando && icono.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <ArchivoInput
                            registro={icono}
                            setRegistro={setIcono}
                            archivoTipo="imagen"
                            archivoHeader={intl.formatMessage({ id: 'Archivo' })}
                            campoNombre="archivo"
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="tipo">{intl.formatMessage({ id: 'Tipo' })}</label>
                        <Dropdown 
                            id="tipo"
                            value={icono.tipo || ''}
                            options={tiposIcono}
                            onChange={(e) => setIcono({ ...icono, tipo: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona un tipo' })}
                            disabled={estadoGuardando}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={icono.activoSn === 'S'}
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
                            value={icono.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción del icono' })}
                            onChange={(e) => setIcono({ ...icono, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosIcono;
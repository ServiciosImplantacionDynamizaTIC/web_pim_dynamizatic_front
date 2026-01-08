import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputSwitch } from 'primereact/inputswitch';
import { useIntl } from 'react-intl';

const EditarDatosMarca = ({ marca, setMarca, estadoGuardando, isEdit, listaTipoArchivos }) => {
    const intl = useIntl();
    
    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={marca}
                        setRegistro={setMarca}
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
                        registro={marca}
                        setRegistro={setMarca}
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
        let _marca = { ...marca };
        const esTrue = valor === true ? 'S' : 'N';
        _marca[`${nombreInputSwitch}`] = esTrue;
        setMarca(_marca);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos de la marca' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={marca.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre de la marca' })}
                            onChange={(e) => setMarca({ ...marca, nombre: e.target.value })}
                            className={`${(estadoGuardando && marca.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <ArchivoInput
                            registro={marca}
                            setRegistro={setMarca}
                            archivoTipo="imagen"
                            archivoHeader={intl.formatMessage({ id: 'Logo' })}
                            campoNombre="logo"
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="sitioWeb">{intl.formatMessage({ id: 'Sitio Web' })}</label>
                        <InputText 
                            id="sitioWeb"
                            value={marca.sitioWeb || ''}
                            placeholder={intl.formatMessage({ id: 'URL del sitio web' })}
                            onChange={(e) => setMarca({ ...marca, sitioWeb: e.target.value })}
                            maxLength={200}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="paisOrigen">{intl.formatMessage({ id: 'País de Origen' })}</label>
                        <InputText 
                            id="paisOrigen"
                            value={marca.paisOrigen || ''}
                            placeholder={intl.formatMessage({ id: 'País de origen de la marca' })}
                            onChange={(e) => setMarca({ ...marca, paisOrigen: e.target.value })}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={marca.activoSn === 'S'}
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
                            value={marca.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción de la marca' })}
                            onChange={(e) => setMarca({ ...marca, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosMarca;
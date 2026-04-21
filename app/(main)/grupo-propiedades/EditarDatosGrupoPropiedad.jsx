import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputSwitch } from 'primereact/inputswitch';
import { useIntl } from 'react-intl';

const EditarDatosGrupoPropiedad = ({ grupoPropiedad, setGrupoPropiedad, estadoGuardando, isEdit, listaTipoArchivos, tipoDeGrupoPropiedad = 'grupo_atributos' }) => {
    const intl = useIntl();

    const esGrupoAtributos = tipoDeGrupoPropiedad === 'grupo_atributos';
    const labelFieldset = esGrupoAtributos ? intl.formatMessage({ id: 'Datos del grupo de atributos' }) : intl.formatMessage({ id: 'Datos del grupo de campos dinámicos' });
    const placeholderNombre = esGrupoAtributos ? intl.formatMessage({ id: 'Nombre del grupo de atributos' }) : intl.formatMessage({ id: 'Nombre del grupo de campos dinámicos' });
    const placeholderDescripcion = esGrupoAtributos ? intl.formatMessage({ id: 'Descripción del grupo de atributos' }) : intl.formatMessage({ id: 'Descripción del grupo de campos dinámicos' });
    
    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={grupoPropiedad}
                        setRegistro={setGrupoPropiedad}
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
                        registro={grupoPropiedad}
                        setRegistro={setGrupoPropiedad}
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
        let _grupoPropiedad = { ...grupoPropiedad };
        const esTrue = valor === true ? 'S' : 'N';
        _grupoPropiedad[`${nombreInputSwitch}`] = esTrue;
        setGrupoPropiedad(_grupoPropiedad);
    };

    return (
        <>
            <Fieldset legend={labelFieldset}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={grupoPropiedad.nombre}
                            placeholder={placeholderNombre}
                            onChange={(e) => setGrupoPropiedad({ ...grupoPropiedad, nombre: e.target.value })}
                            className={`${(estadoGuardando && grupoPropiedad.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={grupoPropiedad.activoSn === 'S'}
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
                            value={grupoPropiedad.descripcion || ''}
                            placeholder={placeholderDescripcion}
                            onChange={(e) => setGrupoPropiedad({ ...grupoPropiedad, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosGrupoPropiedad;
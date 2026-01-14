import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { useIntl } from 'react-intl';

const EditarDatosGrupoAtributo = ({ grupoAtributo, setGrupoAtributo, estadoGuardando, isEdit, listaTipoArchivos }) => {
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
                        registro={grupoAtributo}
                        setRegistro={setGrupoAtributo}
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
                        registro={grupoAtributo}
                        setRegistro={setGrupoAtributo}
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
        let _grupoAtributo = { ...grupoAtributo };
        const esTrue = valor === true ? 'S' : 'N';
        _grupoAtributo[`${nombreInputSwitch}`] = esTrue;
        setGrupoAtributo(_grupoAtributo);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del grupo de atributo' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={grupoAtributo.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre del grupo de atributo' })}
                            onChange={(e) => setGrupoAtributo({ ...grupoAtributo, nombre: e.target.value })}
                            className={`${(estadoGuardando && grupoAtributo.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="orden">{intl.formatMessage({ id: 'Orden' })}</label>
                        <InputNumber 
                            id="orden"
                            value={grupoAtributo.orden || 0}
                            placeholder={intl.formatMessage({ id: 'Orden de visualización' })}
                            onValueChange={(e) => setGrupoAtributo({ ...grupoAtributo, orden: e.value || 0 })}
                            disabled={estadoGuardando}
                            min={0}
                            inputStyle={{ textAlign: 'right' }}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={grupoAtributo.activoSn === 'S'}
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
                            value={grupoAtributo.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción del grupo de atributo' })}
                            onChange={(e) => setGrupoAtributo({ ...grupoAtributo, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosGrupoAtributo;
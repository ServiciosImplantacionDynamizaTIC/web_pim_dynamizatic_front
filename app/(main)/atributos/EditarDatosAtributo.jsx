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

const EditarDatosAtributo = ({ atributo, setAtributo, estadoGuardando, isEdit, listaTipoArchivos, listaGrupoAtributos = [] }) => {
    const intl = useIntl();
    
    const tiposDato = [
        { label: 'Texto', value: 'texto' },
        { label: 'Número', value: 'numero' },
        { label: 'Fecha', value: 'fecha' },
        { label: 'Booleano', value: 'booleano' },
        { label: 'Lista', value: 'lista' },
        { label: 'Multiseñección', value: 'multiselect' }
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
                        registro={atributo}
                        setRegistro={setAtributo}
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
                        registro={atributo}
                        setRegistro={setAtributo}
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
        let _atributo = { ...atributo };
        const esTrue = valor === true ? 'S' : 'N';
        _atributo[`${nombreInputSwitch}`] = esTrue;
        setAtributo(_atributo);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del atributo' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="grupoAtributoId"><b>{intl.formatMessage({ id: 'Grupo de Atributos' })}*</b></label>
                        <Dropdown 
                            id="grupoAtributoId"
                            value={atributo.grupoAtributoId}
                            options={listaGrupoAtributos.map(grupo => ({
                                label: grupo.nombre,
                                value: grupo.id
                            }))}
                            onChange={(e) => setAtributo({ ...atributo, grupoAtributoId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona un grupo de atributos' })}
                            disabled={estadoGuardando}
                            className={`${(estadoGuardando && !atributo.grupoAtributoId) ? "p-invalid" : ""}`}
                            filter
                            filterBy="label"
                            emptyMessage={intl.formatMessage({ id: 'No hay grupos disponibles' })}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={atributo.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre del atributo' })}
                            onChange={(e) => setAtributo({ ...atributo, nombre: e.target.value })}
                            className={`${(estadoGuardando && atributo.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="tipoDato"><b>{intl.formatMessage({ id: 'Tipo de Dato' })}</b></label>
                        <Dropdown
                            id="tipoDato"
                            value={atributo.tipoDato}
                            options={tiposDato}
                            onChange={(e) => setAtributo({ ...atributo, tipoDato: e.value })}
                            placeholder={intl.formatMessage({ id: 'Seleccionar tipo de dato' })}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="unidadMedida">{intl.formatMessage({ id: 'Unidad de Medida' })}</label>
                        <InputText 
                            id="unidadMedida"
                            value={atributo.unidadMedida || ''}
                            placeholder={intl.formatMessage({ id: 'Ej: cm, kg, litros' })}
                            onChange={(e) => setAtributo({ ...atributo, unidadMedida: e.target.value })}
                            maxLength={50}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="orden">{intl.formatMessage({ id: 'Orden' })}</label>
                        <InputNumber 
                            id="orden"
                            value={atributo.orden || 0}
                            placeholder={intl.formatMessage({ id: 'Orden de visualización' })}
                            onValueChange={(e) => setAtributo({ ...atributo, orden: e.value || 0 })}
                            disabled={estadoGuardando}
                            min={0}
                            inputStyle={{ textAlign: 'right' }}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="obligatorio" className="font-bold block">{intl.formatMessage({ id: 'Obligatorio' })}</label>
                        <InputSwitch
                            id="obligatorio"
                            checked={atributo.obligatorioSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "obligatorioSn")}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="multivalor" className="font-bold block">{intl.formatMessage({ id: 'Multivalor' })}</label>
                        <InputSwitch
                            id="multivalor"
                            checked={atributo.multivalorSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "multivalorSn")}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={atributo.activoSn === 'S'}
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
                            value={atributo.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción del atributo' })}
                            onChange={(e) => setAtributo({ ...atributo, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="valoresPermitidos">{intl.formatMessage({ id: 'Valores Permitidos' })}</label>
                        <InputTextarea 
                            id="valoresPermitidos"
                            value={atributo.valoresPermitidos || ''}
                            placeholder={intl.formatMessage({ id: 'Valores separados por comas (para listas)' })}
                            onChange={(e) => setAtributo({ ...atributo, valoresPermitidos: e.target.value })}
                            rows={2}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosAtributo;
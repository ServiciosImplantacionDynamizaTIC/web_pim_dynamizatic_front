import React, { useState } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';

const EditarDatosAtributo = ({ atributo, setAtributo, estadoGuardando, isEdit, listaGrupoAtributos = [] }) => {
    const intl = useIntl();
    const [nuevoValor, setNuevoValor] = useState('');
    
    const tiposDato = [
        { label: 'Texto', value: 'texto' },
        { label: 'Número', value: 'numero' },
        { label: 'Fecha', value: 'fecha' },
        { label: 'Booleano', value: 'booleano' },
        { label: 'Lista', value: 'lista' },
        { label: 'Multiselección', value: 'multiselect' }
    ];

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let _atributo = { ...atributo };
        const esTrue = valor === true ? 'S' : 'N';
        _atributo[`${nombreInputSwitch}`] = esTrue;
        setAtributo(_atributo);
    };

    const agregarValor = () => {
        if (nuevoValor.trim()) {
            const valoresActuales = atributo.valoresPermitidos || '';
            const nuevosValores = valoresActuales 
                ? valoresActuales + ';' + nuevoValor.trim()
                : nuevoValor.trim();
            
            setAtributo({ ...atributo, valoresPermitidos: nuevosValores });
            setNuevoValor('');
        }
    };

    const manejarKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarValor();
        }
    };

    const manejarCambioTipoDato = (e) => {
        const nuevoTipoDato = e.value;
        let atributoActualizado = { ...atributo, tipoDato: nuevoTipoDato };
        
        // Si no es lista o multiselect, limpiar valores permitidos
        if (nuevoTipoDato !== 'lista' && nuevoTipoDato !== 'multiselect') {
            atributoActualizado.valoresPermitidos = '';
        }
        
        // Si no es número, texto o booleano, limpiar unidad de medida
        if (nuevoTipoDato !== 'numero' && nuevoTipoDato !== 'texto' && nuevoTipoDato !== 'booleano') {
            atributoActualizado.unidadMedida = '';
        }
        
        setAtributo(atributoActualizado);
    };

    const mostrarCamposValores = atributo.tipoDato === 'lista' || atributo.tipoDato === 'multiselect';
    const mostrarUnidadMedida = atributo.tipoDato === 'numero' || atributo.tipoDato === 'texto' || atributo.tipoDato === 'booleano';

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del atributo' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
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

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
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

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
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
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={atributo.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
                
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="tipoDato"><b>{intl.formatMessage({ id: 'Tipo de Dato' })}</b></label>
                        <Dropdown
                            id="tipoDato"
                            value={atributo.tipoDato}
                            options={tiposDato}
                            onChange={manejarCambioTipoDato}
                            placeholder={intl.formatMessage({ id: 'Seleccionar tipo de dato' })}
                            disabled={estadoGuardando}
                        />
                    </div>
                    
                    {mostrarUnidadMedida && (
                        <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
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
                    )}

                    {mostrarCamposValores && (
                        <>
                            <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                                <label htmlFor="nuevoValor">{intl.formatMessage({ id: 'Agregar nuevo valor' })}</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        id="nuevoValor"
                                        value={nuevoValor}
                                        placeholder={intl.formatMessage({ id: 'Ingrese un valor' })}
                                        onChange={(e) => setNuevoValor(e.target.value)}
                                        onKeyPress={manejarKeyPress}
                                        disabled={estadoGuardando}
                                    />
                                    <Button
                                        icon="pi pi-plus"
                                        label={intl.formatMessage({ id: 'Agregar' })}
                                        onClick={agregarValor}
                                        disabled={estadoGuardando || !nuevoValor.trim()}
                                        className="p-button-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                                <label htmlFor="valoresPermitidos">{intl.formatMessage({ id: 'Valores Permitidos' })}</label>
                                <InputTextarea 
                                    id="valoresPermitidos"
                                    value={atributo.valoresPermitidos || ''}
                                    placeholder={intl.formatMessage({ id: 'Valores separados por punto y coma (;)' })}
                                    onChange={(e) => setAtributo({ ...atributo, valoresPermitidos: e.target.value })}
                                    rows={3}
                                    disabled={estadoGuardando}
                                    readOnly
                                />
                            </div>
                        </>
                    )}

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

                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosAtributo;
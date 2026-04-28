import React, { useState, useEffect, useContext, useRef } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputNumber } from 'primereact/inputnumber';
import { Password } from 'primereact/password';
import { InputSwitch } from 'primereact/inputswitch';
import { RadioButton } from 'primereact/radiobutton';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { PrimeReactContext } from 'primereact/api';
import { LayoutContext } from "@/layout/context/layoutcontext";
import { getLayoutConfigFromEmpresa } from "@/app/utility/LayoutConfigService";
import { getCurrentThemeConfig, applyThemeConfig } from "@/app/utility/ThemeService";
import { ProgressSpinner } from 'primereact/progressspinner';
import { useIntl } from 'react-intl';

const EditarDatosEmpresa = ({ empresa, setEmpresa, estadoGuardando, isEdit, listaTipoArchivos }) => {
    const intl = useIntl();
    
    // Contextos para la configuración del layout
    const { changeTheme } = useContext(PrimeReactContext);
    const { 
        setLayoutConfig: setLayoutContextConfig, 
        layoutConfig: layoutContextConfig,
        onMenuToggle 
    } = useContext(LayoutContext);
    
    // Estado local para la configuración del layout
    const [configuracionLayoutLocal, setConfiguracionLayoutLocal] = useState({
        ripple: false,
        inputStyle: "outlined",
        menuMode: "static",
        menuTheme: "colorScheme",
        colorScheme: "light",
        theme: "mitema",
        scale: 14
    });

    const [cargandoTema, setCargandoTema] = useState(false);

    //
    // Refs para restaurar el estado visual completo al desmontar.
    // empresaIdRef se actualiza en el cuerpo del render (patrón válido para refs) para que el cleanup
    // del useEffect siempre lea el id más reciente sin necesitar un segundo efecto de sincronización.
    //
    const temaOriginalRef = useRef(null);
    const layoutConfigOriginalRef = useRef(null);
    const escalaOriginalRef = useRef(null);
    const empresaIdRef = useRef(empresa?.id);
    empresaIdRef.current = empresa?.id;

    useEffect(() => {
        //
        // Al montar, capturamos el estado visual completo: archivo CSS del tema, configuración del
        // contexto de layout (modo menú, tema menú, esquema color, estilo input, ripple...) y la
        // escala del DOM. Todo ello se restaura al desmontar si no es la empresa de sesión.
        //
        if (typeof window !== 'undefined') {
            temaOriginalRef.current = getCurrentThemeConfig();
            escalaOriginalRef.current = document.documentElement.style.fontSize;
        }
        layoutConfigOriginalRef.current = layoutContextConfig;

        return () => {
            //
            // Al desmontar, restauramos el estado visual original solo si la empresa editada no es la
            // empresa de sesión (comparando con el id guardado en localStorage).
            // Esto evita que los cambios de vista previa persistan en la sesión tras cerrar el formulario.
            //
            const sesionEmpresaId = localStorage.getItem('empresa');
            const esEmpresaSesion = sesionEmpresaId && empresaIdRef.current &&
                String(empresaIdRef.current) === String(sesionEmpresaId);

            if (!esEmpresaSesion) {
                if (temaOriginalRef.current) {
                    applyThemeConfig(temaOriginalRef.current);
                }
                if (layoutConfigOriginalRef.current && setLayoutContextConfig) {
                    setLayoutContextConfig(layoutConfigOriginalRef.current);
                }
                if (escalaOriginalRef.current !== null && typeof window !== 'undefined') {
                    document.documentElement.style.fontSize = escalaOriginalRef.current;
                }
            }
        };
    }, []);
    
    // Configuración de temas y escalas
    const escalas = [12, 13, 14, 15, 16];
    const temasComponentes = [
        { name: "indigo", color: "#6366F1" },
        { name: "blue", color: "#3B82F6" },
        { name: "purple", color: "#8B5CF6" },
        { name: "teal", color: "#14B8A6" },
        { name: "cyan", color: "#06B6D4" },
        { name: "green", color: "#10B981" },
        { name: "orange", color: "#F59E0B" },
        { name: "pink", color: "#EC4899" },
        { name: "mitema", color: "#6366F1" }
    ];
    
    // Función para aplicar escala
    const aplicarEscala = (escala = null) => {
        const escalaPorAplicar = escala || configuracionLayoutLocal.scale;
        if (escalaPorAplicar) {
            document.documentElement.style.fontSize = `${escalaPorAplicar}px`;
            console.log(`Escala aplicada: ${escalaPorAplicar}px`);
        }
    };
    
    useEffect(() => {
        //
        // Sincroniza el estado local, el contexto de layout y aplica el CSS del tema al cargar una empresa.
        // Depende de empresa?.id en lugar de empresa para no dispararse en cada pulsación de teclado:
        // los cambios manuales de configuración (colores, modo menú, escala...) los gestiona directamente
        // actualizarConfiguracionEmpresaLayout, por lo que este efecto solo es necesario en la carga inicial.
        // Esto permite la vista previa completa del tema de cualquier empresa al abrirla, de forma que un
        // administrador global verá exactamente cómo queda antes de guardar.
        //
        if (empresa) {
            const configDesdeEmpresa = getLayoutConfigFromEmpresa(empresa);
            setConfiguracionLayoutLocal(configDesdeEmpresa);

            if (setLayoutContextConfig) {
                setLayoutContextConfig(prevConfig => ({
                    ...prevConfig,
                    ...configDesdeEmpresa
                }));
            }

            if (configDesdeEmpresa.scale) {
                aplicarEscala(configDesdeEmpresa.scale);
            }

            applyThemeConfig({
                colorScheme: configDesdeEmpresa.colorScheme,
                theme: configDesdeEmpresa.theme
            });
        }
    }, [empresa?.id]);
    
    // Aplicar la escala cuando cambie la configuración
    useEffect(() => {
        aplicarEscala(configuracionLayoutLocal.scale);
    }, [configuracionLayoutLocal.scale]);
    
    // Aplicar cambios al contexto global cuando cambien las configuraciones
    // TEMPORALMENTE COMENTADO para evitar conflictos con changeTheme
    /*
    useEffect(() => {
        console.log('configuracionLayoutLocal cambió:', configuracionLayoutLocal);
        if (setLayoutContextConfig && configuracionLayoutLocal) {
            setLayoutContextConfig(prevConfig => ({
                ...prevConfig,
                ...configuracionLayoutLocal
            }));
        }
    }, [configuracionLayoutLocal, setLayoutContextConfig]);
    */
    
    // Función para obtener la configuración del layout
    const obtenerConfiguracionLayout = () => {
        return configuracionLayoutLocal;
    };
    
    // Función auxiliar para validar que un tema existe
    const validarTema = (esquemaColor, nombreTema) => {
        const temasValidos = ["indigo", "blue", "purple", "teal", "cyan", "green", "orange", "pink", "mitema"];
        const esquemasValidos = ["light", "dim", "dark"];
        
        const temaValido = temasValidos.includes(nombreTema);
        const esquemaValido = esquemasValidos.includes(esquemaColor);
        
        if (!temaValido) {
            console.warn(`Tema no válido: ${nombreTema}. Temas disponibles:`, temasValidos);
        }
        if (!esquemaValido) {
            console.warn(`Esquema no válido: ${esquemaColor}. Esquemas disponibles:`, esquemasValidos);
        }
        
        return temaValido && esquemaValido;
    };
    
    // Función auxiliar para obtener el valor actual del menuTheme
    const obtenerMenuThemeActual = () => {
        const valorLocal = configuracionLayoutLocal.menuTheme;
        const valorEmpresa = empresa.temaMenu;
        
        console.log('obtenerMenuThemeActual - valorLocal:', valorLocal, 'valorEmpresa:', valorEmpresa);
        
        // Prioridad: valor local si existe, sino valor de empresa, sino valor por defecto
        return valorLocal || valorEmpresa || "colorScheme";
    };
    
    // Función para actualizar la configuración del layout
    const actualizarConfiguracionEmpresaLayout = (nuevaConfig) => {
        // Actualizar datos de la empresa
        setEmpresa(empresaPrevia => ({
            ...empresaPrevia,
            temaRipple: nuevaConfig.ripple !== undefined ? nuevaConfig.ripple : empresaPrevia.temaRipple,
            estiloInput: nuevaConfig.inputStyle !== undefined ? nuevaConfig.inputStyle : empresaPrevia.estiloInput,
            modoMenu: nuevaConfig.menuMode !== undefined ? nuevaConfig.menuMode : empresaPrevia.modoMenu,
            temaMenu: nuevaConfig.menuTheme !== undefined ? nuevaConfig.menuTheme : empresaPrevia.temaMenu,
            esquemaColor: nuevaConfig.colorScheme !== undefined ? nuevaConfig.colorScheme : empresaPrevia.esquemaColor,
            tema: nuevaConfig.theme !== undefined ? nuevaConfig.theme : empresaPrevia.tema,
            escala: nuevaConfig.scale !== undefined ? nuevaConfig.scale : empresaPrevia.escala
        }));
        
        // Actualizar estado local inmediatamente para UI responsiva
        setConfiguracionLayoutLocal(configPrevia => ({
            ...configPrevia,
            ripple: nuevaConfig.ripple !== undefined ? nuevaConfig.ripple : configPrevia.ripple,
            inputStyle: nuevaConfig.inputStyle !== undefined ? nuevaConfig.inputStyle : configPrevia.inputStyle,
            menuMode: nuevaConfig.menuMode !== undefined ? nuevaConfig.menuMode : configPrevia.menuMode,
            menuTheme: nuevaConfig.menuTheme !== undefined ? nuevaConfig.menuTheme : configPrevia.menuTheme,
            colorScheme: nuevaConfig.colorScheme !== undefined ? nuevaConfig.colorScheme : configPrevia.colorScheme,
            theme: nuevaConfig.theme !== undefined ? nuevaConfig.theme : configPrevia.theme,
            scale: nuevaConfig.scale !== undefined ? nuevaConfig.scale : configPrevia.scale
        }));
        
        // Sincronizar con el contexto de layout global
        if (setLayoutContextConfig) {
            setLayoutContextConfig(prevConfig => ({
                ...prevConfig,
                ripple: nuevaConfig.ripple !== undefined ? nuevaConfig.ripple : prevConfig.ripple,
                inputStyle: nuevaConfig.inputStyle !== undefined ? nuevaConfig.inputStyle : prevConfig.inputStyle,
                menuMode: nuevaConfig.menuMode !== undefined ? nuevaConfig.menuMode : prevConfig.menuMode,
                menuTheme: nuevaConfig.menuTheme !== undefined ? nuevaConfig.menuTheme : prevConfig.menuTheme,
                colorScheme: nuevaConfig.colorScheme !== undefined ? nuevaConfig.colorScheme : prevConfig.colorScheme,
                theme: nuevaConfig.theme !== undefined ? nuevaConfig.theme : prevConfig.theme,
                scale: nuevaConfig.scale !== undefined ? nuevaConfig.scale : prevConfig.scale
            }));
        }
    };
    
    const cambiarEstiloInput = (e) => {
        actualizarConfiguracionEmpresaLayout({ inputStyle: e.value });
        // Aplicar cambio al contexto PrimeReact inmediatamente
        if (setLayoutContextConfig) {
            setLayoutContextConfig(prevConfig => ({
                ...prevConfig,
                inputStyle: e.value
            }));
        }
        console.log(`Estilo de input cambiado a: ${e.value}`);
    };

    const cambiarRipple = (e) => {
        actualizarConfiguracionEmpresaLayout({ ripple: e.value });
        // Aplicar cambio al contexto PrimeReact inmediatamente
        if (setLayoutContextConfig) {
            setLayoutContextConfig(prevConfig => ({
                ...prevConfig,
                ripple: e.value
            }));
        }
        console.log(`Efecto ripple cambiado a: ${e.value}`);
    };

    const cambiarModoMenu = (e) => {
        actualizarConfiguracionEmpresaLayout({ menuMode: e.value });
        // Aplicar cambio al contexto de layout inmediatamente
        if (setLayoutContextConfig) {
            setLayoutContextConfig(prevConfig => ({
                ...prevConfig,
                menuMode: e.value
            }));
        }
        // Forzar actualización del menú si es necesario
        if (onMenuToggle && typeof onMenuToggle === 'function') {
            setTimeout(() => onMenuToggle(), 100);
        }
        console.log(`Modo de menú cambiado a: ${e.value}`);
    };

    const cambiarTemaMenu = (e) => {
        actualizarConfiguracionEmpresaLayout({ menuTheme: e.value });
        // Aplicar cambio al contexto de layout inmediatamente
        if (setLayoutContextConfig) {
            setLayoutContextConfig(prevConfig => ({
                ...prevConfig,
                menuTheme: e.value
            }));
        }
        console.log(`Tema de menú cambiado a: ${e.value}`);
    };

    const cambiarEsquemaColor = (esquemaColor) => {
        actualizarConfiguracionEmpresaLayout({ colorScheme: esquemaColor });

        if (changeTheme) {
            //
            // Leemos el esquema actual directamente del DOM (fuente de verdad real) en lugar del
            // contexto React, que puede estar desincronizado. PrimeReact necesita que el valor
            // "from" coincida exactamente con el href del <link> o la sustitución falla en silencio.
            //
            const { colorScheme: esquemaActual } = getCurrentThemeConfig();
            setCargandoTema(true);
            changeTheme(esquemaActual, esquemaColor, "theme-link", () => {
                if (setLayoutContextConfig) {
                    setLayoutContextConfig(prevConfig => ({
                        ...prevConfig,
                        colorScheme: esquemaColor
                    }));
                }
                setCargandoTema(false);
            });
        }
    };

    const cambiarTema = (tema) => {
        actualizarConfiguracionEmpresaLayout({ theme: tema });

        if (changeTheme) {
            //
            // Igual que en cambiarEsquemaColor: leemos el tema actual del DOM para garantizar
            // que el "from" de changeTheme siempre sea correcto.
            //
            const { theme: temaActual } = getCurrentThemeConfig();
            setCargandoTema(true);
            changeTheme(temaActual, tema, "theme-link", () => {
                if (setLayoutContextConfig) {
                    setLayoutContextConfig(prevConfig => ({
                        ...prevConfig,
                        theme: tema
                    }));
                }
                setCargandoTema(false);
            });
        }
    };

    const decrementarEscala = () => {
        const config = obtenerConfiguracionLayout();
        const nuevaEscala = config.scale - 1;
        if (nuevaEscala >= escalas[0]) {
            actualizarConfiguracionEmpresaLayout({ scale: nuevaEscala });
            aplicarEscala(nuevaEscala);
        }
    };

    const incrementarEscala = () => {
        const config = obtenerConfiguracionLayout();
        const nuevaEscala = config.scale + 1;
        if (nuevaEscala <= escalas[escalas.length - 1]) {
            actualizarConfiguracionEmpresaLayout({ scale: nuevaEscala });
            aplicarEscala(nuevaEscala);
        }
    };

    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={empresa}
                        setRegistro={setEmpresa}
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
                        registro={empresa}
                        setRegistro={setEmpresa}
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
        let _empresa = { ...empresa };
        const esTrue = valor === true ? 'S' : 'N';
        _empresa[`${nombreInputSwitch}`] = esTrue;
        setEmpresa(_empresa);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos de la empresa' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="codigo"><b>{intl.formatMessage({ id: 'Código' })}*</b></label>
                        <InputText 
                            id="codigo"
                            value={empresa.codigo}
                            placeholder={intl.formatMessage({ id: 'Código de la empresa' })}
                            onChange={(e) => setEmpresa({ ...empresa, codigo: e.target.value })}
                            className={`${(estadoGuardando && empresa.codigo === "") ? "p-invalid" : ""}`}
                            maxLength={20}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={empresa.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre de la empresa' })}
                            onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })}
                            className={`${(estadoGuardando && empresa.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={50}
                            disabled={estadoGuardando}
                        />
                    </div>

                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="tiempoInactividad">{intl.formatMessage({ id: 'Tiempo de Inactividad' })} ({intl.formatMessage({ id: 'minutos' })})</label>
                    <InputNumber 
                        id="tiempoInactividad"
                        value={empresa.tiempoInactividad === undefined || empresa.tiempoInactividad === null || empresa.tiempoInactividad === "" ? 100 : empresa.tiempoInactividad}
                        placeholder={intl.formatMessage({ id: 'Tiempo en minutos' })}
                        onValueChange={(e) => setEmpresa({ ...empresa, tiempoInactividad: e.value === null ? 100 : e.value })}
                        disabled={estadoGuardando}
                        min={100}
                        inputStyle={{ textAlign: 'right' }}
                    />
                    <span style={{ fontWeight: 'bold', color: '#6c757d', fontStyle: 'italic' }}><small className="text-muted">{intl.formatMessage({ id: 'El valor mínimo es 100' })}</small></span>
                </div>

                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                    <InputSwitch
                        id="activo"
                        checked={empresa.activoSn === 'S'}
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
                        value={empresa.descripcion || ''}
                        placeholder={intl.formatMessage({ id: 'Descripción de la empresa' })}
                        onChange={(e) => setEmpresa({ ...empresa, descripcion: e.target.value })}
                        rows={3}
                        maxLength={500}
                        disabled={estadoGuardando}
                    />
                </div>
            </div>
        </Fieldset>
        
        {/* Fieldset de Configuración de Interfaz */}
        <Fieldset legend="Configuración de Interfaz" className="mt-3 mb-3" toggleable collapsed>
            <div className="grid">
                {/* Temas */}
                <div className="col-12 md:col-6">
                    <h6>{intl.formatMessage({ id: 'Temas' })}</h6>
                    {cargandoTema ? (
                        <div className="flex justify-content-center p-4">
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {temasComponentes.map((tema, i) => {
                                const config = obtenerConfiguracionLayout();
                                return (
                                    <div
                                        key={i}
                                        className="w-2rem h-2rem"
                                        onClick={() => cambiarTema(tema.name)}
                                        style={{
                                            backgroundColor: tema.color,
                                            cursor: "pointer",
                                            borderRadius: "18px",
                                            border:
                                                tema.name === config.theme
                                                    ? "2px solid var(--primary-color)"
                                                    : "2px solid transparent",
                                        }}
                                        title={tema.name}
                                    ></div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Escala */}
                <div className="col-12 md:col-6">
                    <h6>{intl.formatMessage({ id: 'Escala' })} ({obtenerConfiguracionLayout().scale}px)</h6>
                    <div className="flex align-items-center">
                        <Button
                            icon="pi pi-minus"
                            type="button"
                            onClick={decrementarEscala}
                            className="w-2rem h-2rem mr-2"
                            rounded
                            text
                            disabled={obtenerConfiguracionLayout().scale === escalas[0]}
                        ></Button>
                        <div className="flex gap-2 align-items-center">
                            {escalas.map((s, i) => {
                                const config = obtenerConfiguracionLayout();
                                return (
                                    <i
                                        key={i}
                                        className={classNames(
                                            "pi pi-circle-fill text-300",
                                            {
                                                "text-primary-500":
                                                    s === config.scale,
                                            }
                                        )}
                                    ></i>
                                );
                            })}
                        </div>
                        <Button
                            icon="pi pi-plus"
                            type="button"
                            onClick={incrementarEscala}
                            className="w-2rem h-2rem ml-2"
                            rounded
                            text
                            disabled={obtenerConfiguracionLayout().scale === escalas[escalas.length - 1]}
                        ></Button>
                    </div>
                </div>

                {/* Modo Menú */}
                <div className="col-12">
                    <h6>{intl.formatMessage({ id: 'Modo Menú' })}</h6>
                    <div className="grid">
                        <div className="col-12 md:col-2">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuMode"
                                    value="static"
                                    onChange={cambiarModoMenu}
                                    checked={obtenerConfiguracionLayout().menuMode === "static"}
                                    inputId="mode1"
                                ></RadioButton>
                                <label htmlFor="mode1">{intl.formatMessage({ id: 'Estático' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-2">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuMode"
                                    value="overlay"
                                    onChange={cambiarModoMenu}
                                    checked={obtenerConfiguracionLayout().menuMode === "overlay"}
                                    inputId="mode2"
                                ></RadioButton>
                                <label htmlFor="mode2">{intl.formatMessage({ id: 'Superposición' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-2">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuMode"
                                    value="slim"
                                    onChange={cambiarModoMenu}
                                    checked={obtenerConfiguracionLayout().menuMode === "slim"}
                                    inputId="mode3"
                                ></RadioButton>
                                <label htmlFor="mode3">{intl.formatMessage({ id: 'Delgado' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-2">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuMode"
                                    value="slim-plus"
                                    onChange={cambiarModoMenu}
                                    checked={obtenerConfiguracionLayout().menuMode === "slim-plus"}
                                    inputId="mode4"
                                ></RadioButton>
                                <label htmlFor="mode4">{intl.formatMessage({ id: 'Delgado Plus' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-2">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuMode"
                                    value="drawer"
                                    onChange={cambiarModoMenu}
                                    checked={obtenerConfiguracionLayout().menuMode === "drawer"}
                                    inputId="mode5"
                                ></RadioButton>
                                <label htmlFor="mode5">{intl.formatMessage({ id: 'Cajón' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-2">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuMode"
                                    value="horizontal"
                                    onChange={cambiarModoMenu}
                                    checked={obtenerConfiguracionLayout().menuMode === "horizontal"}
                                    inputId="mode6"
                                ></RadioButton>
                                <label htmlFor="mode6">{intl.formatMessage({ id: 'Horizontal' })}</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tema Menú */}
                <div className="col-12">
                    <h6>{intl.formatMessage({ id: 'Tema Menú' })} - Valor actual: {obtenerMenuThemeActual()}</h6>
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuTheme"
                                    value="colorScheme"
                                    onChange={cambiarTemaMenu}
                                    checked={obtenerMenuThemeActual() === "colorScheme"}
                                    inputId="menutheme1"
                                ></RadioButton>
                                <label htmlFor="menutheme1">{intl.formatMessage({ id: 'Esquema Color' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuTheme"
                                    value="primaryColor"
                                    onChange={cambiarTemaMenu}
                                    checked={obtenerMenuThemeActual() === "primaryColor"}
                                    inputId="menutheme2"
                                ></RadioButton>
                                <label htmlFor="menutheme2">{intl.formatMessage({ id: 'Color Primario' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="menuTheme"
                                    value="transparent"
                                    onChange={cambiarTemaMenu}
                                    checked={obtenerMenuThemeActual() === "transparent"}
                                    inputId="menutheme3"
                                ></RadioButton>
                                <label htmlFor="menutheme3">{intl.formatMessage({ id: 'Transparente' })}</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Esquema Color */}
                <div className="col-12">
                    <h6>{intl.formatMessage({ id: 'Esquema Color' })}</h6>
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="colorScheme"
                                    value="light"
                                    onChange={(e) => cambiarEsquemaColor(e.value)}
                                    checked={obtenerConfiguracionLayout().colorScheme === "light"}
                                    inputId="colorscheme1"
                                    disabled={cargandoTema}
                                ></RadioButton>
                                <label htmlFor="colorscheme1">{intl.formatMessage({ id: 'Claro' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="colorScheme"
                                    value="dim"
                                    onChange={(e) => cambiarEsquemaColor(e.value)}
                                    checked={obtenerConfiguracionLayout().colorScheme === "dim"}
                                    inputId="colorscheme2"
                                    disabled={cargandoTema}
                                ></RadioButton>
                                <label htmlFor="colorscheme2">{intl.formatMessage({ id: 'Tenue' })}</label>
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="field-radiobutton">
                                <RadioButton
                                    name="colorScheme"
                                    value="dark"
                                    onChange={(e) => cambiarEsquemaColor(e.value)}
                                    checked={obtenerConfiguracionLayout().colorScheme === "dark"}
                                    inputId="colorscheme3"
                                    disabled={cargandoTema}
                                ></RadioButton>
                                <label htmlFor="colorscheme3">{intl.formatMessage({ id: 'Oscuro' })}</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estilo Input y Ripple */}
                <div className="col-12">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <h6>{intl.formatMessage({ id: 'Estilo Input' })}</h6>
                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <div className="field-radiobutton">
                                        <RadioButton
                                            name="inputstyle"
                                            value="outlined"
                                            onChange={cambiarEstiloInput}
                                            checked={obtenerConfiguracionLayout().inputStyle === "outlined"}
                                            inputId="inputstyle1"
                                        ></RadioButton>
                                        <label htmlFor="inputstyle1">{intl.formatMessage({ id: 'Contorno' })}</label>
                                    </div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <div className="field-radiobutton">
                                        <RadioButton
                                            name="inputstyle"
                                            value="filled"
                                            onChange={cambiarEstiloInput}
                                            checked={obtenerConfiguracionLayout().inputStyle === "filled"}
                                            inputId="inputstyle2"
                                        ></RadioButton>
                                        <label htmlFor="inputstyle2">{intl.formatMessage({ id: 'Relleno' })}</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <h6>{intl.formatMessage({ id: 'Efecto' })}</h6>
                            <InputSwitch
                                checked={obtenerConfiguracionLayout().ripple}
                                onChange={cambiarRipple}
                                inputId="ripple"
                            ></InputSwitch>
                            <label htmlFor="ripple">{intl.formatMessage({ id: 'Efecto Ripple' })}</label>
                        </div>
                    </div>
                </div>
            </div>
        </Fieldset>
        </>
    );
};

export default EditarDatosEmpresa;
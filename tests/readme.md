# Testeo automático de nuevos módulos

Suite de tests E2E con [Playwright](https://playwright.dev/) que verifica el ciclo completo CRUD de cualquier pantalla de la aplicación y genera un reporte Excel con los resultados.

---

## Requisitos previos

- Node.js ≥ 18
- Aplicación corriendo en `http://localhost:3000`
- Backend corriendo y accesible

---

## Instalación

```bash
# 1. Instalar navegadores de Playwright
npm install
npm install -D @playwright/test
npx playwright install

# 2. Instalar dependencias de Excel (Si está en package.json con npm install sería suficiente)
npm install exceljs
```

---

## Ejecución

### Pantalla específica (recomendado para pruebas puntuales)

```powershell
$env:TEST_URL="/tipo-uso-multimedia"; npx playwright test tests/revision-pantallas.spec.ts --headed --workers=1
```

### Todas las pantallas (extrae rutas automáticamente de AuthContext.tsx)

```powershell
npx playwright test tests/revision-pantallas.spec.ts --headed --workers=1 
Usar test('Probar botón Buscar en páginas CRUD', async ({ browser }) => {})
```

### Ver el reporte HTML de Playwright tras la ejecución

```powershell
npx playwright show-report
```

---

## Parámetros de entorno

| Variable           | Descripción                                                  | Ejemplo            |
|--------------------|--------------------------------------------------------------|--------------------|
| `TEST_URL`         | Ruta de la pantalla a probar. Si se omite, prueba todas.     | `/planificador`    |
| `TEST_RESPONSABLE` | Nombre que aparece en el Excel si no se detecta git user.    | `JSanzDyna`        |

---

## Flujo de cada test

1. **Login** — Se autentica con las credenciales de soporte.
2. **Navegar** — Accede a la URL indicada (o a todas las rutas de `AuthContext.tsx`).
3. **Insert** — Rellena y envía el formulario de creación de registro.
4. **Búsqueda** — Filtra por el nombre del registro recién creado.
5. **Update** — Edita el registro creado.
6. **Delete** — Elimina el registro creado y confirma el diálogo.

---

## Reporte Excel

Cada ejecución añade filas al fichero `test-results/reporte-pruebas.xlsx`.

### Plantilla personalizada

Coloca tu plantilla en `tests/plantilla-pruebas.xlsx`.  
La primera ejecución la usará como base, preservando colores, fuentes y cabeceras.  
Los datos se escriben a partir de la **fila 4** (configurable con `DATA_START_ROW`).

### Columnas del reporte

| Columna             | Descripción                                      |
|---------------------|--------------------------------------------------|
| Id                  | Autoincremental global                           |
| Servicio            | Ruta de la pantalla probada                      |
| Prueba              | Autenticación / Creación / Filtrado / Edición / Eliminación |
| Resultado esperado  | Comportamiento esperado de la prueba             |
| Datos utilizados    | Valor introducido en el formulario               |
| Responsable         | Usuario de git (`git config user.name`)          |
| Fecha               | Fecha de ejecución (dd/mm/aaaa)                  |
| Ciclo               | Se incrementa automáticamente en cada ejecución  |
| Estado              | `OK` / `KO`                                      |
| Observaciones       | Detalle del error si el estado es KO             |

### Resetear ciclos

Borra `tests/reporte-estado.json` para reiniciar el contador de ciclos e IDs.

### Empezar desde cero (Excel limpio)

Para generar un reporte completamente nuevo, borra los tres ficheros:

```powershell
Remove-Item tests\reporte-estado.json, tests\reporte-pruebas.xlsx, test-results\reporte-pruebas.xlsx -ErrorAction SilentlyContinue
```

| Fichero | Qué contiene | Efecto de borrarlo |
|---|---|---|
| `tests/reporte-estado.json` | Ciclo, lastId, nextRow | Resetea contadores (ciclo 1, ID 1) |
| `tests/reporte-pruebas.xlsx` | Copia de respaldo del reporte | La próxima ejecución parte de la plantilla |
| `test-results/reporte-pruebas.xlsx` | Reporte oficial acumulado | Elimina todos los resultados anteriores |

---

## Archivos generados

```
tests/
├── plantilla-pruebas.xlsx         # Plantilla con el formato deseado (la pones tú)
├── reporte-pruebas.xlsx           # Copia de respaldo (sobrevive a la limpieza de Playwright)
├── reporte-estado.json            # Estado interno: ciclo, lastId, nextRow
└── revision-pantallas.spec.ts

test-results/                      # Playwright limpia esta carpeta en cada ejecución
├── reporte-pruebas.xlsx           # Reporte acumulativo de resultados ← AQUÍ está el oficial
└── 01-paso2-insert-...png         # Capturas de pantalla numeradas por paso
```

## Usar extensión
```
Para usar la extensión se debe modificar el .vscode/settings.json de tu entorno y añadir: 

{
  "playwright.env": {
    "TEST_URL": "/tablas-maestras/idioma"
  }
}

En test url se marca dónde queremos hacer el test de igual forma que en $env:TEST_URL="/tablas-maestras/idioma"; npx playwright test tests/revision-pantallas.spec.ts --headed --workers=1 

Es la forma para hacerlo desde el IDE sin poner el código
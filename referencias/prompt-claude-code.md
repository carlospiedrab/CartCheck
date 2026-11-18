# CartCheck — Lista de supermercado en Angular 22

## Contexto
Estás trabajando en un proyecto existente de **Angular 22** que ya tiene instalados **Angular Material** y **Tailwind CSS**. Quiero construir la aplicación "CartCheck", una lista de supermercado.

En la carpeta `/referencias` está el prototipo aprobado. **Antes de escribir código, revisa todos los archivos de `/referencias`** y respeta su diseño: estructura, jerarquía visual, colores, espaciados, textos en español y comportamiento. Si algo del prototipo no se puede lograr igual con Angular Material, usa lo más cercano y explícame la diferencia.

Revisa también `package.json` y `angular.json` para confirmar las versiones instaladas y la configuración actual (tema de Material, configuración de Tailwind, estilos globales) antes de cambiar nada.

## Funcionalidad requerida
1. **Agregar productos** con un formulario que tenga:
   - **Producto**: texto, obligatorio, sin espacios al inicio o al final, máximo 60 caracteres.
   - **Cantidad**: numérica y mayor que 0, con un botón **−** a la izquierda y un botón **+** a la derecha del campo. También se puede escribir directamente.
     - El incremento es **1** para `Unidad` y `Paquete`, y **0.5** para `Libras` y `Kilos`.
     - El botón **−** se desactiva cuando la cantidad llega al mínimo (1 o 0.5 según la unidad). La cantidad nunca puede ser 0 ni negativa.
     - Al cambiar de unidad, si la cantidad actual no encaja con el nuevo incremento (por ejemplo, 1.5 al pasar a `Unidad`), ajústala al valor válido más cercano.
   - **Unidad**: selector con las opciones `Unidad`, `Paquete`, `Libras`, `Kilos` (valor por defecto: `Unidad`).
   - Botón **Agregar**. Al agregar, se limpia el nombre, la cantidad vuelve a su valor inicial y el foco regresa al campo Producto. También debe poder enviarse con Enter.
   - No se permite agregar si el formulario no es válido. Muestra los mensajes de error con `mat-error`.
2. **Lista de productos agregados**, donde cada fila muestra el nombre, la cantidad y la unidad (ej. "1.5 · Kilos").
3. **Marcar como comprado**: una casilla (`mat-checkbox`) por producto. Al marcarla, el nombre y la cantidad se muestran **tachados** y en un tono atenuado. Al desmarcarla, vuelve a la normalidad.
4. **Eliminar un producto** con un botón de icono (papelera) en cada fila, con `aria-label="Eliminar <nombre>"`.
5. **Limpiar toda la lista** con un botón "Limpiar lista" que pide confirmación con un `MatDialog` antes de borrar. El botón se desactiva cuando la lista está vacía.
6. **Contador y progreso**: en el encabezado se muestra "X de Y comprados" y una barra de progreso (`mat-progress-bar`) con el porcentaje de productos comprados.
7. **Estado vacío**: cuando no hay productos, se muestra un mensaje que invita a agregar el primero.
8. **Persistencia**: la lista se guarda en `localStorage` y se restaura al recargar la página. Si los datos guardados están corruptos o tienen un formato inválido, se ignoran sin romper la app.

## Requisitos técnicos (Angular 22 moderno)
- **Componentes standalone** (el valor por defecto; no uses NgModules).
- **Signals en todo el estado**: `signal`, `computed`, `effect` (solo para efectos secundarios como la persistencia) y `linkedSignal` donde tenga sentido. No uses `BehaviorSubject` ni RxJS para el estado local.
- **Signal Forms** (estables en Angular 22) para el formulario de producto, con su esquema de validación. Usa la API exacta que expone la versión instalada de `@angular/forms`; no uses Reactive Forms ni `ngModel`.
- **APIs de componentes basadas en signals**: `input()`, `input.required()`, `output()` y `model()` cuando aplique. No uses los decoradores `@Input`/`@Output`.
- **Control de flujo nuevo** en las plantillas: `@if`, `@for` (con `track item.id`), `@empty` y `@let`. No uses `*ngIf` ni `*ngFor`.
- **Inyección con `inject()`**, no por constructor.
- **Detección de cambios**: OnPush ya es el valor por defecto en Angular 22 y la app es zoneless, así que no agregues `zone.js` ni configures `changeDetection` manualmente salvo que haga falta.
- **TypeScript estricto**: sin `any`, con tipos e interfaces explícitos y actualizaciones inmutables del estado.
- **Accesibilidad**: etiquetas en todos los campos, `aria-label` en los botones que solo tienen icono, áreas táctiles de al menos 44×44 px, contraste AA y navegación completa con teclado.

## Arquitectura sugerida
Organiza el código por funcionalidad, por ejemplo:

```
src/app/features/shopping-list/
  models/shopping-item.model.ts          // interface ShoppingItem { id; name; quantity; unit; purchased; createdAt }, type Unit
  data/shopping-list.store.ts            // servicio con el estado en signals
  components/
    shopping-list-page/                  // contenedor: une store, formulario y lista
    product-form/                        // formulario con Signal Forms y selector de cantidad
    quantity-stepper/                    // control reutilizable − [input] + (compatible con Signal Forms)
    shopping-list-item/                  // fila: checkbox, texto tachado, botón eliminar
    list-header/                         // título, contador y barra de progreso
    confirm-clear-dialog/                // diálogo de confirmación
```

- **`ShoppingListStore`** (`providedIn: 'root'`): mantiene un `signal<ShoppingItem[]>` privado y lo expone como solo lectura (`asReadonly()`). Expone los `computed` `total`, `purchasedCount`, `progress` e `isEmpty`, y los métodos `add()`, `togglePurchased(id)`, `remove(id)` y `clear()`. Genera los ids con `crypto.randomUUID()`. La persistencia en `localStorage` se hace con un `effect`, y la lectura inicial debe validar la forma de los datos.
- Los componentes de presentación (`shopping-list-item`, `list-header`, `quantity-stepper`) solo reciben datos con `input()` y emiten eventos con `output()`. No inyectan el store.
- Las reglas de incremento y mínimo por unidad viven en una sola función o constante reutilizable, no repetidas en varios lugares.

## Diseño y responsive
- **Mobile first**, siguiendo el prototipo: encabezado con el logo y el contador, la tarjeta del formulario, la sección "Mi lista" con el botón "Limpiar lista" y la lista de tarjetas.
- **Tablet (`md`)**: contenido centrado con ancho máximo y más aire entre secciones.
- **Escritorio (`lg` y mayor)**: dos columnas. El formulario va a la izquierda (fijo con `sticky` al hacer scroll) y la lista a la derecha.
- Tailwind se encarga del layout, espaciado y responsive. Angular Material aporta los controles (`mat-form-field`, `matInput`, `mat-select`, `mat-checkbox`, `mat-icon-button`, `mat-progress-bar`, `MatDialog`).
- Configura un **tema de Material 3** con el verde del prototipo como color primario (`#1F6B43`), un fondo `#F4F5F0` y un color de alerta terracota (`#9A3412`) para eliminar y limpiar. Expón los colores como variables CSS para usarlos también desde Tailwind, sin duplicar los valores.
- Verifica que Tailwind y Material no se pisen: revisa el orden de los estilos globales y el preflight de Tailwind.
- Tipografía: Inter para el texto y Space Grotesk para el título "CartCheck".
- Iconos: Material Symbols. No uses emojis.

## Pruebas
- Escribe pruebas unitarias con el runner configurado en el proyecto (Vitest por defecto en Angular moderno) para:
  - El store: agregar, marcar o desmarcar, eliminar, limpiar, los `computed` y la persistencia (incluidos los datos corruptos).
  - Las reglas de cantidad: incremento por unidad, mínimo y ajuste al cambiar de unidad.
  - El formulario: validaciones y que no se pueda enviar si es inválido.
  - `shopping-list-item`: que el texto se tache al marcar la casilla y que el botón de eliminar emita el evento.

## Forma de trabajo
1. Revisa `/referencias` y la configuración del proyecto, y muéstrame un **plan breve** (archivos a crear o modificar y decisiones principales) antes de implementar.
2. Implementa por pasos pequeños: modelo y store, luego componentes, después estilos y tema, y al final las pruebas.
3. Al terminar, ejecuta `ng build` y las pruebas, y corrige cualquier error o advertencia.
4. Dame un resumen final con los archivos creados, las decisiones tomadas y cualquier diferencia con el prototipo.

# Módulo de Gestión de Menús

## 📍 Ubicación
`src/pages/usuarios/Menus-Page.vue`

## 🎯 Funcionalidad
Módulo completo para administrar la estructura jerárquica de menús del sistema con interfaz visual en árbol.

## ✨ Características Principales

### 1. **Visualización en Árbol**
- Vista jerárquica recursiva de todos los menús
- Expandir/colapsar nodos individuales
- Toggle para expandir/colapsar todo el árbol
- Indicadores visuales por tipo (menú, submenú, botón)
- Badges para rutas, tipo y orden

### 2. **Tipos de Elementos**

#### 🗂️ Menú (menu)
- Elemento raíz sin padre (`parent_id: null`)
- No tiene ruta de navegación
- Puede contener submenús
- **Ejemplo**: Gestión de Usuarios, Financiero, Deportivo

#### 📄 Submenú (submenu)
- Pertenece a un menú padre
- Tiene ruta de navegación obligatoria
- Puede contener botones
- **Ejemplo**: Lista de Usuarios `/usuarios`, Gastos `/gastos`

#### 🔘 Botón (button)
- Pertenece a un submenú padre
- No tiene ruta (representa una acción)
- No puede tener hijos
- **Ejemplo**: Eliminar Usuario, Registrar Gasto

### 3. **Operaciones CRUD**

#### Crear
- **Nuevo Menú Principal**: Botón "Nuevo Menú" en header
- **Agregar Hijo**: Botón "+" en cada nodo (excepto botones)
- El tipo de hijo se determina automáticamente:
  - Menú → puede agregar Submenú
  - Submenú → puede agregar Botón

#### Editar
- Botón de edición (✏️) en cada nodo
- Formulario pre-cargado con datos actuales
- No se puede cambiar el tipo después de crear

#### Eliminar
- Botón de eliminación (🗑️) en cada nodo
- Confirmación con advertencia si tiene hijos
- Eliminación en cascada (elimina hijos automáticamente por `ON DELETE CASCADE`)

### 4. **Formulario de Edición**

Campos del formulario:

```javascript
{
  id: number,              // Auto-generado
  parent_id: number|null,  // Seleccionado automáticamente
  name: string,            // Requerido
  route: string|null,      // Requerido para submenu, null para menu y button
  icon: string,            // Requerido (Material Icons)
  order_index: number,     // Auto-calculado, editable
  type: 'menu'|'submenu'|'button'  // No editable después de crear
}
```

#### Validaciones:
- **name**: Siempre requerido
- **route**: Requerido solo para `submenu`, null para `menu` y `button`
- **icon**: Siempre requerido
- **parent_id**: Requerido para `submenu` y `button`, null para `menu`

### 5. **Selector de Iconos**
- Dialog con grid de iconos comunes de Material Icons
- Búsqueda en tiempo real
- Vista previa del icono seleccionado
- 60+ iconos predefinidos más comunes

#### Iconos Incluidos:
- Navegación: folder, topic, smart_button, home, dashboard
- Usuarios: group, people, person, school
- Deportivo: sports, fitness_center, sports_soccer, sports_martial_arts
- Financiero: payments, attach_money, receipt_long
- Acciones: add, edit, delete, save, cancel, check
- Reportes: analytics, bar_chart, pie_chart, assessment
- Y muchos más...

## 🎨 Diseño Visual

### Paleta de Colores (Verde Forest)
- **Menú**: Verde oscuro (#2e7d32) - Fondo degradado
- **Submenú**: Verde medio (#7cb342) - Borde izquierdo
- **Botón**: Naranja (#ff8f00) - Acento

### Elementos Visuales
- **Icono personalizado** por cada elemento (Material Icons)
- **Badge verde** para rutas
- **Chip de tipo** con color según tipo (Menú/Submenú/Botón)
- **Badge gris** para orden (#1, #2, etc.)
- **Botones de acción** visibles al hacer hover

## 🔄 Integración con Backend

### Endpoints Necesarios

```javascript
// GET - Obtener todos los menús (lista plana)
GET /api/menus
Response: [
  { id: 1, parent_id: null, name: "Usuarios", route: null, icon: "group", order_index: 1, type: "menu" },
  { id: 2, parent_id: 1, name: "Lista", route: "/usuarios", icon: "list", order_index: 1, type: "submenu" },
  ...
]

// POST - Crear nuevo menú
POST /api/menus
Body: {
  parent_id: number|null,
  name: string,
  route: string|null,
  icon: string,
  order_index: number,
  type: 'menu'|'submenu'|'button'
}

// PUT - Actualizar menú
PUT /api/menus/:id
Body: {
  name: string,
  route: string|null,
  icon: string,
  order_index: number
}

// DELETE - Eliminar menú (cascada automática por ON DELETE CASCADE)
DELETE /api/menus/:id
```

### Función de Construcción de Árbol

El componente incluye la función `buildTree()` que convierte la lista plana del backend en árbol jerárquico:

```javascript
const buildTree = (flatList, parentId = null) => {
  return flatList
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      ...item,
      children: buildTree(flatList, item.id)
    }))
}
```

### Dónde Conectar el Backend

En el archivo `Menus-Page.vue`, busca estas funciones y reemplaza el código de simulación:

1. **`fetchMenus()`** (línea ~450)
```javascript
// Reemplazar:
const flatMenus = [...]  // Datos de ejemplo

// Por:
const response = await fetch('/api/menus')
const flatMenus = await response.json()
```

2. **`saveMenu()`** (línea ~520)
```javascript
if (editMode.value) {
  await fetch(`/api/menus/${currentMenu.value.id}`, {
    method: 'PUT',
    body: JSON.stringify(currentMenu.value)
  })
} else {
  await fetch('/api/menus', {
    method: 'POST',
    body: JSON.stringify(currentMenu.value)
  })
}
```

3. **`confirmDelete()`** (línea ~545)
```javascript
await fetch(`/api/menus/${node.id}`, {
  method: 'DELETE'
})
```

## 📱 Responsive

- **Desktop**: Árbol completo con todas las funciones
- **Tablet**: Layout adaptado con scroll
- **Mobile**: Dialog fullscreen, botones compactos

## 🌙 Modo Oscuro

Soporte completo con adaptaciones de colores para tema oscuro.

## 🚀 Acceso

Ruta: `/menus`

URL completa: `http://localhost:9000/menus`

## 📝 Notas Importantes

1. **El componente recursivo `MenuTreeNode`** se define dentro del mismo archivo usando la API de componentes de Vue 3

2. **Orden automático**: Al crear un hijo, el `order_index` se calcula automáticamente como `(hermanos.length + 1)`

3. **Tipo de hijo automático**: 
   - Al agregar hijo a un `menu` → crea `submenu`
   - Al agregar hijo a un `submenu` → crea `button`
   - Los `button` no pueden tener hijos

4. **Eliminación en cascada**: La base de datos maneja automáticamente la eliminación de hijos con `ON DELETE CASCADE`

5. **Validación de rutas**: 
   - Menús: ruta opcional (null o vacío)
   - Submenús: ruta obligatoria
   - Botones: ruta siempre null

## 🎯 Ejemplo de Uso

1. Crear menú principal "Gestión de Usuarios" (icon: group)
2. Agregar hijo "Lista de Usuarios" (route: /usuarios, icon: list)
3. Agregar hijo a "Lista de Usuarios" → "Eliminar Usuario" (icon: delete)
4. El sistema automáticamente:
   - Asigna parent_id correcto
   - Calcula order_index
   - Determina tipo (menu → submenu → button)

## 🔗 Relación con Módulo de Roles

Los menús creados aquí se usan en el módulo de Roles (`Roles-Page.vue`) para:
- Asignar permisos a roles
- Construir el menú lateral del sistema
- Controlar acceso a funcionalidades

Ambos módulos comparten la misma estructura de datos jerárquica.

# Estructura de Menús - Base de Datos

## Tabla `menus`

```sql
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES menus(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    route VARCHAR(150),
    icon VARCHAR(50),
    order_index INT DEFAULT 0,
    type VARCHAR(20) CHECK (type IN ('menu','submenu','button')) NOT NULL
);
```

## Mapeo de Campos

### Campos de la Tabla:
- **`id`**: Identificador único del elemento de menú
- **`parent_id`**: ID del padre (null para elementos raíz, referencia a otro menú para hijos)
- **`name`**: Nombre visible del elemento
- **`route`**: Ruta de navegación (solo para 'menu' y 'submenu', null para 'button')
- **`icon`**: Nombre del ícono de Material Icons (ej: 'folder', 'list', 'add')
- **`order_index`**: Orden de aparición (para ordenar hermanos)
- **`type`**: Tipo de elemento ('menu', 'submenu', 'button')

### Tipos de Elementos:

#### 1. **menu** (Menú Principal)
- `parent_id`: **null** (siempre es raíz)
- `route`: **null** (no navega)
- `icon`: Requerido (ej: 'group', 'payments', 'sports_soccer')
- `type`: 'menu'
- **Ejemplos**: Gestión de Usuarios, Financiero, Deportivo

#### 2. **submenu** (Submenú/Página)
- `parent_id`: ID del 'menu' padre
- `route`: **Requerido** (ej: '/usuarios', '/gastos', '/estudiantes')
- `icon`: Opcional pero recomendado
- `type`: 'submenu'
- **Ejemplos**: Lista de Usuarios, Gastos, Estudiantes

#### 3. **button** (Botón/Acción)
- `parent_id`: ID del 'submenu' padre
- `route`: **null** (representa una acción, no navegación)
- `icon`: Recomendado (ej: 'add', 'edit', 'delete')
- `type`: 'button'
- **Ejemplos**: Eliminar Usuario, Registrar Gasto, Crear Rol

## Ejemplo de Estructura Recursiva

```json
{
  "id": 1,
  "parent_id": null,
  "name": "Gestión de Usuarios",
  "route": null,
  "icon": "group",
  "order_index": 1,
  "type": "menu",
  "children": [
    {
      "id": 2,
      "parent_id": 1,
      "name": "Lista de Usuarios",
      "route": "/usuarios",
      "icon": "list",
      "order_index": 1,
      "type": "submenu",
      "children": [
        {
          "id": 3,
          "parent_id": 2,
          "name": "Eliminar Usuario",
          "route": null,
          "icon": "delete",
          "order_index": 1,
          "type": "button"
        },
        {
          "id": 4,
          "parent_id": 2,
          "name": "Editar Usuario",
          "route": null,
          "icon": "edit",
          "order_index": 2,
          "type": "button"
        }
      ]
    },
    {
      "id": 7,
      "parent_id": 1,
      "name": "Gestión de Roles",
      "route": "/roles",
      "icon": "admin_panel_settings",
      "order_index": 2,
      "type": "submenu",
      "children": []
    }
  ]
}
```

## Datos de Ejemplo para Insertar

```sql
-- Menú principal: Gestión de Usuarios
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (1, NULL, 'Gestión de Usuarios', NULL, 'group', 1, 'menu');

-- Submenú: Lista de Usuarios
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (2, 1, 'Lista de Usuarios', '/usuarios', 'list', 1, 'submenu');

-- Botones de Lista de Usuarios
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (3, 2, 'Eliminar Usuario', NULL, 'delete', 1, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (4, 2, 'Editar Usuario', NULL, 'edit', 2, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (5, 2, 'Ver Detalles', NULL, 'visibility', 3, 'button');

-- Submenú: Gestión de Roles
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (7, 1, 'Gestión de Roles', '/roles', 'admin_panel_settings', 2, 'submenu');

-- Botones de Gestión de Roles
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (8, 7, 'Crear Rol', NULL, 'add_circle', 1, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (9, 7, 'Editar Rol', NULL, 'edit', 2, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (10, 7, 'Eliminar Rol', NULL, 'delete', 3, 'button');

-- Menú principal: Miembros
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (11, NULL, 'Miembros', NULL, 'people', 2, 'menu');

-- Submenú: Estudiantes
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (12, 11, 'Estudiantes', '/estudiantes', 'school', 1, 'submenu');

-- Botones de Estudiantes
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (13, 12, 'Ver Lista', NULL, 'list', 1, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (14, 12, 'Agregar Estudiante', NULL, 'person_add', 2, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (15, 12, 'Editar Estudiante', NULL, 'edit', 3, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (16, 12, 'Eliminar Estudiante', NULL, 'delete', 4, 'button');

-- Menú principal: Financiero
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (22, NULL, 'Financiero', NULL, 'payments', 3, 'menu');

-- Submenú: Gastos
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (23, 22, 'Gastos', '/gastos', 'receipt_long', 1, 'submenu');

-- Botones de Gastos
INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (24, 23, 'Registrar Gasto', NULL, 'add', 1, 'button');

INSERT INTO menus (id, parent_id, name, route, icon, order_index, type) 
VALUES (25, 23, 'Ver Reportes', NULL, 'assessment', 2, 'button');
```

## Consulta SQL para Obtener Árbol Completo

```sql
-- Consulta recursiva para obtener toda la jerarquía
WITH RECURSIVE menu_tree AS (
  -- Nodos raíz (parent_id IS NULL)
  SELECT 
    id, 
    parent_id, 
    name, 
    route, 
    icon, 
    order_index, 
    type,
    ARRAY[order_index] as path
  FROM menus
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Nodos hijos
  SELECT 
    m.id, 
    m.parent_id, 
    m.name, 
    m.route, 
    m.icon, 
    m.order_index, 
    m.type,
    mt.path || m.order_index
  FROM menus m
  INNER JOIN menu_tree mt ON m.parent_id = mt.id
)
SELECT * FROM menu_tree
ORDER BY path;
```

## Función del Backend para Construir Árbol

```javascript
// Función para convertir lista plana en árbol jerárquico
function buildTree(flatList, parentId = null) {
  return flatList
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      ...item,
      children: buildTree(flatList, item.id)
    }));
}

// Uso:
const menusList = await db.query('SELECT * FROM menus ORDER BY order_index');
const menuTree = buildTree(menusList.rows);
```

## Iconos Recomendados de Material Icons

### Menús Principales:
- `group` - Usuarios
- `people` - Miembros
- `payments` - Financiero
- `sports_soccer` - Deportivo
- `analytics` - Reportes
- `settings` - Configuración

### Submenús:
- `list` - Listados
- `school` - Estudiantes
- `sports` - Entrenadores
- `receipt_long` - Gastos
- `attach_money` - Pagos
- `app_registration` - Inscripciones
- `fitness_center` - Entrenamientos

### Botones:
- `add` / `add_circle` - Crear/Agregar
- `edit` - Editar
- `delete` - Eliminar
- `visibility` - Ver/Detalles
- `save` - Guardar
- `cancel` - Cancelar
- `check` - Confirmar
- `event` - Programar
- `checklist` - Asistencia
- `picture_as_pdf` - Exportar PDF

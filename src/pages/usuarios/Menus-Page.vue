<template>
  <q-page class="menus-page">
    <!-- Header con gradiente verde -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">
            <q-icon name="account_tree" class="title-icon" />
            Gestión de Menús del Sistema
          </h2>
          <div class="page-subtitle">Administración de la estructura de menús jerárquica recursiva</div>
        </div>
        <div class="header-actions">
          <q-btn unelevated rounded class="add-menu-btn" icon="add_circle" label="Nuevo Menú"
            @click="openDialog(null, 'menu')" />
        </div>
      </div>
    </div>

    <!-- Árbol de menús -->
    <div class="menus-tree-container">
      <q-card class="tree-card">
        <q-card-section class="tree-header">
          <div class="tree-title">
            <q-icon name="folder_open" size="1.5em" />
            Estructura de Menús
          </div>
          <div class="tree-actions">
            <q-btn flat dense round icon="refresh" @click="fetchMenus" class="refresh-btn">
              <q-tooltip>Refrescar</q-tooltip>
            </q-btn>
            <q-toggle v-model="expandAll" @update:model-value="toggleExpandAll" label="Expandir todo" color="green-8" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="tree-body">
          <div v-if="menusList.length > 0" class="menu-tree">
            <MenuTreeNode v-for="menu in menusList" :key="menu.id" :node="menu" :level="0" :expand-all="expandAll"
              @edit="openDialog" @add-child="openDialog" @delete="confirmDelete" />
          </div>
          <div v-else class="empty-tree">
            <q-icon name="folder_off" size="4em" color="grey-5" />
            <div class="empty-text">No hay menús creados</div>
            <q-btn unelevated color="primary" icon="add" label="Crear primer menú" @click="openDialog(null, 'menu')"
              class="q-mt-md" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Dialog para crear/editar menú -->
    <q-dialog v-model="dialogOpen" persistent :maximized="$q.screen.lt.md">
      <q-card class="menu-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-title">
            <q-icon :name="getDialogIcon()" size="1.5em" />
            {{ getDialogTitle() }}
          </div>
          <q-btn flat round dense icon="close" @click="closeDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="dialog-body">
          <q-form ref="menuForm">
            <!-- Tipo de elemento -->
            <div class="form-section">
              <div class="section-title">
                <q-icon name="category" />
                Tipo de Elemento
              </div>
              <div class="type-selector">
                <q-btn-toggle v-model="currentMenu.type" :options="typeOptions" unelevated spread :disable="editMode"
                  color="primary" toggle-color="green-8" class="full-width" />
              </div>
              <div class="type-description q-mt-sm">
                {{ getTypeDescription(currentMenu.type) }}
              </div>
            </div>

            <!-- Información básica -->
            <div class="form-section">
              <div class="section-title">
                <q-icon name="info" />
                Información Básica
              </div>

              <q-input v-model="currentMenu.name" label="Nombre" outlined dense
                :rules="[val => !!val || 'El nombre es requerido']" class="form-input">
                <template v-slot:prepend>
                  <q-icon name="label" />
                </template>
              </q-input>

              <q-input v-if="currentMenu.type !== 'button'" v-model="currentMenu.route"
                :label="currentMenu.type === 'menu' ? 'Ruta (opcional)' : 'Ruta de navegación'" outlined dense
                placeholder="/ejemplo/ruta"
                :rules="currentMenu.type === 'submenu' ? [val => !!val || 'La ruta es requerida para submenús'] : []"
                class="form-input">
                <template v-slot:prepend>
                  <q-icon name="link" />
                </template>
                <template v-slot:hint>
                  {{ currentMenu.type === 'menu' ? 'Dejar vacío para menús principales' : 'Ej: /usuarios, /gastos' }}
                </template>
              </q-input>

              <div class="icon-input-group">
                <q-input v-model="currentMenu.icon" label="Icono (Material Icons)" outlined dense placeholder="folder"
                  class="form-input" :rules="[val => !!val || 'El icono es requerido']">
                  <template v-slot:prepend>
                    <q-icon name="emoji_symbols" />
                  </template>
                  <template v-slot:append>
                    <q-icon v-if="currentMenu.icon" :name="currentMenu.icon" color="primary" size="md" />
                  </template>
                </q-input>
                <q-btn flat dense icon="search" label="Buscar ícono" @click="openIconPicker" class="icon-search-btn" />
              </div>

              <q-input v-model.number="currentMenu.order_index" label="Orden" type="number" outlined dense min="0"
                class="form-input">
                <template v-slot:prepend>
                  <q-icon name="sort" />
                </template>
                <template v-slot:hint>
                  Número para ordenar elementos del mismo nivel
                </template>
              </q-input>
            </div>

            <!-- Menú padre (solo para submenu y button) -->
            <div v-if="currentMenu.type !== 'menu'" class="form-section">
              <div class="section-title">
                <q-icon name="account_tree" />
                Elemento Padre
              </div>
              <q-select v-model="currentMenu.parent_id" :options="getParentOptions()" option-label="label"
                option-value="value" emit-value map-options outlined dense
                :rules="[val => val !== null || 'Debe seleccionar un elemento padre']" class="form-input">
                <template v-slot:prepend>
                  <q-icon name="folder_open" />
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt.icon" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.route || 'Sin ruta' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions class="dialog-actions">
          <q-btn flat label="Cancelar" class="cancel-btn" @click="closeDialog" />
          <q-btn unelevated label="Guardar" class="save-btn" icon-right="save" @click="saveMenu" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog selector de iconos -->
    <q-dialog v-model="iconPickerOpen">
      <q-card style="min-width: 500px; max-width: 700px;">
        <q-card-section class="dialog-header">
          <div class="dialog-title">
            <q-icon name="emoji_symbols" size="1.5em" />
            Seleccionar Icono
          </div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-input v-model="iconSearch" label="Buscar icono" outlined dense clearable autofocus>
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="icons-grid q-mt-md">
            <div v-for="icon in filteredIcons" :key="icon" class="icon-item" @click="selectIcon(icon)">
              <q-icon :name="icon" size="2em" />
              <div class="icon-name">{{ icon }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// ===== COMPONENTE RECURSIVO PARA NODOS DEL ÁRBOL =====
const MenuTreeNode = {
  name: 'MenuTreeNode',
  props: {
    node: Object,
    level: Number,
    expandAll: Boolean
  },
  emits: ['edit', 'add-child', 'delete'],
  data() {
    return {
      expanded: this.expandAll
    }
  },
  watch: {
    expandAll(val) {
      this.expanded = val
    }
  },
  template: `
    <div class="tree-node" :style="{ marginLeft: level * 24 + 'px' }">
      <div class="node-content" :class="'node-type-' + node.type">
        <q-btn
          v-if="node.children && node.children.length > 0"
          flat
          dense
          round
          size="sm"
          :icon="expanded ? 'expand_more' : 'chevron_right'"
          @click="expanded = !expanded"
          class="expand-btn"
        />
        <div v-else class="expand-spacer"></div>

        <q-icon
          :name="node.icon || getDefaultIcon(node.type)"
          :class="'node-icon node-icon-' + node.type"
          size="sm"
        />

        <span class="node-name">{{ node.name }}</span>

        <q-badge
          v-if="node.route"
          :label="node.route"
          class="route-badge"
        />

        <q-chip
          :label="getTypeLabel(node.type)"
          size="sm"
          :class="'type-chip type-chip-' + node.type"
        />

        <q-badge
          :label="'#' + node.order_index"
          class="order-badge"
        />

        <div class="node-actions">
          <q-btn
            v-if="node.type !== 'button'"
            flat
            dense
            round
            size="sm"
            icon="add"
            @click="$emit('add-child', node, getChildType(node.type))"
            class="action-btn add-btn"
          >
            <q-tooltip>Agregar hijo</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="edit"
            @click="$emit('edit', node)"
            class="action-btn edit-btn"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="delete"
            @click="$emit('delete', node)"
            class="action-btn delete-btn"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div v-if="expanded && node.children && node.children.length > 0" class="node-children">
        <MenuTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :expand-all="expandAll"
          @edit="$emit('edit', $event)"
          @add-child="$emit('add-child', $event, $event.type)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  `,
  methods: {
    getDefaultIcon(type) {
      const icons = {
        menu: 'folder',
        submenu: 'topic',
        button: 'smart_button'
      }
      return icons[type] || 'radio_button_unchecked'
    },
    getTypeLabel(type) {
      const labels = {
        menu: 'Menú',
        submenu: 'Submenú',
        button: 'Botón'
      }
      return labels[type] || type
    },
    getChildType(parentType) {
      if (parentType === 'menu') return 'submenu'
      if (parentType === 'submenu') return 'button'
      return 'button'
    }
  }
}

// ===== ESTADO Y DATOS =====
const menusList = ref([])
const dialogOpen = ref(false)
const editMode = ref(false)
const expandAll = ref(false)
const iconPickerOpen = ref(false)
const iconSearch = ref('')
const menuForm = ref(null)

const currentMenu = ref({
  id: null,
  parent_id: null,
  name: '',
  route: null,
  icon: '',
  order_index: 0,
  type: 'menu'
})

const typeOptions = [
  { label: 'Menú Principal', value: 'menu', icon: 'folder' },
  { label: 'Submenú', value: 'submenu', icon: 'topic' },
  { label: 'Botón', value: 'button', icon: 'smart_button' }
]

// Iconos comunes de Material Icons
const commonIcons = [
  'folder', 'topic', 'smart_button', 'home', 'dashboard', 'group', 'people',
  'person', 'school', 'sports', 'fitness_center', 'payments', 'attach_money',
  'receipt_long', 'app_registration', 'list', 'analytics', 'bar_chart',
  'pie_chart', 'assessment', 'event', 'calendar_today', 'schedule',
  'settings', 'admin_panel_settings', 'security', 'lock', 'vpn_key',
  'add', 'edit', 'delete', 'save', 'cancel', 'check', 'close',
  'visibility', 'search', 'filter_list', 'sort', 'more_vert',
  'sports_soccer', 'sports_martial_arts', 'sports_basketball',
  'emoji_events', 'military_tech', 'workspace_premium',
  'description', 'article', 'note', 'assignment', 'folder_open',
  'account_tree', 'device_hub', 'hub', 'share', 'link',
  'notifications', 'mail', 'message', 'chat', 'forum',
  'info', 'help', 'warning', 'error', 'check_circle',
  'inventory', 'category', 'label', 'bookmark', 'grade'
]

const filteredIcons = computed(() => {
  if (!iconSearch.value) return commonIcons
  const search = iconSearch.value.toLowerCase()
  return commonIcons.filter(icon => icon.includes(search))
})

// ===== FUNCIONES =====
const fetchMenus = async () => {
  try {
    // Simulación: datos de ejemplo
    // En producción, llamar a tu API: const res = await api.getMenus()
    const flatMenus = [
      { id: 1, parent_id: null, name: 'Gestión de Usuarios', route: null, icon: 'group', order_index: 1, type: 'menu' },
      { id: 2, parent_id: 1, name: 'Lista de Usuarios', route: '/usuarios', icon: 'list', order_index: 1, type: 'submenu' },
      { id: 3, parent_id: 2, name: 'Eliminar Usuario', route: null, icon: 'delete', order_index: 1, type: 'button' },
      { id: 4, parent_id: 2, name: 'Editar Usuario', route: null, icon: 'edit', order_index: 2, type: 'button' },
      { id: 7, parent_id: 1, name: 'Gestión de Roles', route: '/roles', icon: 'admin_panel_settings', order_index: 2, type: 'submenu' },
      { id: 11, parent_id: null, name: 'Miembros', route: null, icon: 'people', order_index: 2, type: 'menu' },
      { id: 12, parent_id: 11, name: 'Estudiantes', route: '/estudiantes', icon: 'school', order_index: 1, type: 'submenu' },
      { id: 22, parent_id: null, name: 'Financiero', route: null, icon: 'payments', order_index: 3, type: 'menu' },
      { id: 23, parent_id: 22, name: 'Gastos', route: '/gastos', icon: 'receipt_long', order_index: 1, type: 'submenu' },
      { id: 24, parent_id: 23, name: 'Registrar Gasto', route: null, icon: 'add', order_index: 1, type: 'button' }
    ]

    menusList.value = buildTree(flatMenus)
    $q.notify({ type: 'positive', message: 'Menús cargados correctamente' })
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar menús' })
  }
}

const buildTree = (flatList, parentId = null) => {
  return flatList
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      ...item,
      children: buildTree(flatList, item.id)
    }))
}

const openDialog = (node, childType = null) => {
  if (node && !childType) {
    // Editar existente
    editMode.value = true
    currentMenu.value = { ...node }
  } else if (node && childType) {
    // Agregar hijo
    editMode.value = false
    currentMenu.value = {
      id: null,
      parent_id: node.id,
      name: '',
      route: childType === 'button' ? null : '',
      icon: '',
      order_index: (node.children?.length || 0) + 1,
      type: childType
    }
  } else {
    // Crear nuevo menú raíz
    editMode.value = false
    currentMenu.value = {
      id: null,
      parent_id: null,
      name: '',
      route: null,
      icon: '',
      order_index: menusList.value.length + 1,
      type: 'menu'
    }
  }
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  currentMenu.value = {
    id: null,
    parent_id: null,
    name: '',
    route: null,
    icon: '',
    order_index: 0,
    type: 'menu'
  }
}

const saveMenu = async () => {
  if (menuForm.value) {
    const ok = await menuForm.value.validate()
    if (!ok) {
      $q.notify({ type: 'negative', message: 'Corrige los errores del formulario' })
      return
    }
  }

  try {
    if (editMode.value) {
      // Actualizar existente
      $q.notify({ type: 'positive', message: 'Menú actualizado correctamente' })
    } else {
      // Crear nuevo
      $q.notify({ type: 'positive', message: 'Menú creado correctamente' })
    }
    await fetchMenus()
    closeDialog()
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar el menú' })
  }
}

const confirmDelete = (node) => {
  const hasChildren = node.children && node.children.length > 0
  const message = hasChildren
    ? `¿Eliminar "${node.name}" y todos sus hijos (${node.children.length})?`
    : `¿Eliminar "${node.name}"?`

  $q.dialog({
    title: 'Confirmar eliminación',
    message,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Eliminar',
      color: 'negative'
    }
  }).onOk(async () => {
    try {
      // Llamar a API para eliminar
      $q.notify({ type: 'positive', message: 'Menú eliminado correctamente' })
      await fetchMenus()
    } catch {
      $q.notify({ type: 'negative', message: 'Error al eliminar el menú' })
    }
  })
}

const toggleExpandAll = (val) => {
  expandAll.value = val
}

const getParentOptions = () => {
  const flatList = []

  const flatten = (nodes, prefix = '') => {
    nodes.forEach(node => {
      if (currentMenu.value.type === 'submenu' && node.type === 'menu') {
        flatList.push({
          value: node.id,
          label: prefix + node.name,
          icon: node.icon,
          route: node.route
        })
      } else if (currentMenu.value.type === 'button' && node.type === 'submenu') {
        flatList.push({
          value: node.id,
          label: prefix + node.name,
          icon: node.icon,
          route: node.route
        })
      }

      if (node.children && node.children.length > 0) {
        flatten(node.children, prefix + node.name + ' > ')
      }
    })
  }

  flatten(menusList.value)
  return flatList
}

const getDialogIcon = () => {
  if (editMode.value) return 'edit'
  const icons = { menu: 'folder', submenu: 'topic', button: 'smart_button' }
  return icons[currentMenu.value.type] || 'add_circle'
}

const getDialogTitle = () => {
  if (editMode.value) return `Editar ${getTypeLabel(currentMenu.value.type)}`
  return `Crear Nuevo ${getTypeLabel(currentMenu.value.type)}`
}

const getTypeLabel = (type) => {
  const labels = { menu: 'Menú', submenu: 'Submenú', button: 'Botón' }
  return labels[type] || type
}

const getTypeDescription = (type) => {
  const descriptions = {
    menu: 'Menú principal del sistema. No tiene padre y puede contener submenús.',
    submenu: 'Página o vista del sistema. Pertenece a un menú y puede contener botones.',
    button: 'Acción o funcionalidad específica. Pertenece a un submenú.'
  }
  return descriptions[type] || ''
}

const openIconPicker = () => {
  iconPickerOpen.value = true
  iconSearch.value = ''
}

const selectIcon = (icon) => {
  currentMenu.value.icon = icon
  iconPickerOpen.value = false
}

onMounted(() => {
  fetchMenus()
})
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// ===== PALETA DE COLORES =====
$color-forest-dark: #1b5e20;
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-sage: #8bc34a;
$color-orange: #ff6f00;
$color-orange-light: #ff8f00;
$color-amber: #ffa726;

// ===== ANIMACIONES =====
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

// ===== PÁGINA =====
.menus-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%);
  min-height: 100vh;
  animation: fadeIn 0.5s ease;
}

// ===== HEADER =====
.page-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 50%, $color-moss 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(27, 94, 32, 0.25);
  animation: slideInUp 0.6s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.page-title {
  color: white;
  font-size: 2em;
  font-weight: 700;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

  .title-icon {
    font-size: 1.3em;
    animation: pulse 3s ease infinite;
  }
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95em;
  font-weight: 500;
}

.add-menu-btn {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(255, 111, 0, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 111, 0, 0.4);
  }
}

// ===== ÁRBOL =====
.menus-tree-container {
  animation: slideInUp 0.6s ease;
}

.tree-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tree-header {
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(85, 139, 47, 0.08) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
}

.tree-title {
  font-size: 1.3em;
  font-weight: 700;
  color: $color-forest;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tree-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.refresh-btn {
  color: $color-forest;
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
}

.tree-body {
  padding: 24px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.menu-tree {
  animation: fadeIn 0.5s ease;
}

.tree-node {
  margin-bottom: 4px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #f8f8f8;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;

  &:hover {
    background: #e8f5e9;
    transform: translateX(4px);

    .node-actions {
      opacity: 1;
    }
  }

  &.node-type-menu {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.12) 0%, rgba(85, 139, 47, 0.1) 100%);
    border-left-color: $color-forest;
    font-weight: 600;
  }

  &.node-type-submenu {
    background: rgba(124, 179, 66, 0.1);
    border-left-color: $color-leaf;
    font-weight: 500;
  }

  &.node-type-button {
    background: rgba(255, 143, 0, 0.06);
    border-left-color: $color-orange-light;
  }
}

.expand-btn {
  color: $color-forest;
}

.expand-spacer {
  width: 36px;
}

.node-icon {
  flex-shrink: 0;

  &.node-icon-menu {
    color: $color-forest;
    font-size: 1.3em;
  }

  &.node-icon-submenu {
    color: $color-moss;
    font-size: 1.2em;
  }

  &.node-icon-button {
    color: $color-orange;
  }
}

.node-name {
  flex: 1;
  font-size: 0.95em;
}

.route-badge {
  background: $color-sage;
  color: white;
  font-size: 0.75em;
  padding: 4px 8px;
}

.type-chip {
  font-size: 0.7em;
  padding: 3px 8px;
  font-weight: 600;

  &.type-chip-menu {
    background: $color-forest;
    color: white;
  }

  &.type-chip-submenu {
    background: $color-leaf;
    color: white;
  }

  &.type-chip-button {
    background: $color-orange;
    color: white;
  }
}

.order-badge {
  background: #757575;
  color: white;
  font-size: 0.7em;
  padding: 3px 6px;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.action-btn {
  &.add-btn {
    color: $color-forest;
  }

  &.edit-btn {
    color: #1976d2;
  }

  &.delete-btn {
    color: #d32f2f;
  }

  &:hover {
    transform: scale(1.1);
  }
}

.node-children {
  margin-top: 4px;
}

.empty-tree {
  text-align: center;
  padding: 60px 20px;
  color: #9e9e9e;

  .empty-text {
    font-size: 1.1em;
    margin-top: 16px;
    margin-bottom: 8px;
  }
}

// ===== DIALOG =====
.menu-dialog {
  min-width: 600px;
  max-width: 800px;
  border-radius: 16px;

  @media (max-width: 768px) {
    min-width: 100%;
    border-radius: 0;
  }
}

.dialog-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  font-size: 1.3em;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 1.1em;
  font-weight: 700;
  color: $color-forest;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid $color-leaf;
}

.type-selector {
  margin-bottom: 12px;
}

.type-description {
  font-size: 0.9em;
  color: #616161;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  border-left: 3px solid $color-leaf;
}

.form-input {
  margin-bottom: 16px;
}

.icon-input-group {
  display: flex;
  gap: 8px;
  align-items: flex-start;

  .form-input {
    flex: 1;
  }
}

.icon-search-btn {
  margin-top: 4px;
  color: $color-forest;
}

.dialog-actions {
  padding: 16px 24px;
  background: #f5f5f5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  color: #d32f2f;
  font-weight: 600;

  &:hover {
    background: rgba(211, 47, 47, 0.1);
  }
}

.save-btn {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
  }
}

// ===== ICON PICKER =====
.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e8f5e9;
    transform: scale(1.05);
  }

  .icon-name {
    font-size: 0.7em;
    margin-top: 4px;
    text-align: center;
    color: #616161;
  }
}

// ===== MODO OSCURO =====
.body--dark {
  .menus-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
  }

  .tree-card {
    background: #2a2a2a;
  }

  .tree-header {
    background: rgba(46, 125, 50, 0.15);
  }

  .tree-title {
    color: $color-lime;
  }

  .node-content {
    background: #333;
    color: #e0e0e0;

    &:hover {
      background: rgba(46, 125, 50, 0.2);
    }
  }

  .menu-dialog {
    background: #2a2a2a;
  }

  .dialog-body {
    background: #2a2a2a;
  }

  .type-description {
    background: #333;
    color: #b0bec5;
  }

  .dialog-actions {
    background: #1f1f1f;
  }

  .icon-item:hover {
    background: rgba(46, 125, 50, 0.2);

    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #e8f5e9;
      transform: scale(1.05);
    }

    .icon-name {
      font-size: 0.7em;
      margin-top: 4px;
      text-align: center;
      color: #616161;
    }
  }

  // ===== MODO OSCURO =====
  .body--dark {
    .menus-page {
      background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
    }

    .tree-card {
      background: #2a2a2a;
    }

    .tree-header {
      background: rgba(46, 125, 50, 0.15);
    }

    .tree-title {
      color: $color-lime;
    }

    .node-content {
      background: #333;
      color: #e0e0e0;

      &:hover {
        background: rgba(46, 125, 50, 0.2);
      }
    }

    .menu-dialog {
      background: #2a2a2a;
    }

    .dialog-body {
      background: #2a2a2a;
    }

    .type-description {
      background: #333;
      color: #b0bec5;
    }

    .dialog-actions {
      background: #1f1f1f;
    }

    .icon-item:hover {
      background: rgba(46, 125, 50, 0.2);
      umns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
    }

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #e8f5e9;
        transform: scale(1.05);
      }

      .icon-name {
        font-size: 0.7em;
        margin-top: 4px;
        text-align: center;
        color: #616161;
      }
    }

    // ===== MODO OSCURO =====
    .body--dark {
      .menus-page {
        background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
      }

      .tree-card {
        background: #2a2a2a;
      }

      .tree-header {
        background: rgba(46, 125, 50, 0.15);
      }

      .tree-title {
        color: $color-lime;
      }

      .node-content {
        background: #333;
        color: #e0e0e0;

        &:hover {
          background: rgba(46, 125, 50, 0.2);
        }
      }

      .menu-dialog {
        background: #2a2a2a;
      }

      .dialog-body {
        background: #2a2a2a;
      }

      .type-description {
        background: #333;
        color: #b0bec5;
      }

      .dialog-actions {
        background: #1f1f1f;
      }

      .icon-item:hover {
        background: rgba(46, 125, 50, 0.2);
      }
    }
  }
}
</style>

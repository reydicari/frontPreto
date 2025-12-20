<template>
  <q-page class="roles-page" :class="$q.dark.isActive ? 'dark-mode' : 'light-mode'">
    <!-- Header mejorado -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <q-icon name="admin_panel_settings" class="title-icon" />
            Gestión de Roles y Permisos
          </h1>
          <p class="page-subtitle">Administra roles y controla el acceso a módulos del sistema</p>
        </div>
        <div class="header-actions">
          <q-btn unelevated rounded class="add-role-btn" icon="add_circle" label="Nuevo Rol"
            @click="openDialog(null)" />
        </div>
      </div>
    </div>

    <!-- Tabla de roles mejorada -->
    <q-card class="roles-table-card">
      <q-card-section class="table-header">
        <div class="text-h6">Roles del Sistema</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <div class="table-wrapper">
          <q-table :rows="filteredRoles" :columns="displayColumns" row-key="id" flat bordered separator="cell">
            <template v-slot:header="props">
              <q-tr :props="props" class="table-header-row">
                <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-header-cell" align="center">
                  {{ col.label }}
                </q-th>
              </q-tr>
            </template>
            <template v-slot:body="props">
              <q-tr :props="props" class="table-body-row">
                <q-td class="text-center row-number-cell">
                  <q-badge :label="props.rowIndex + 1" class="row-badge" />
                </q-td>
                <q-td class="role-name-cell">
                  <div class="role-name-text">{{ props.row.nombre }}</div>
                </q-td>
                <q-td class="permisos-cell">
                  <div class="perm-chips">
                    <template v-for="(p, idx) in toPermArray(props.row.permisos)" :key="p">
                      <q-chip size="sm" class="perm-chip" color="green-8" text-color="white">
                        {{ getModuleLabel(p) }}
                      </q-chip>
                      <div v-if="(idx + 1) % 3 === 0" class="chip-break"></div>
                    </template>
                  </div>
                </q-td>
                <q-td class="actions-cell">
                  <div class="action-buttons">
                    <q-btn flat dense round icon="edit" color="green-8" size="sm" @click="openDialog(props.row)"
                      class="action-btn">
                      <q-tooltip>Editar rol</q-tooltip>
                    </q-btn>
                    <q-toggle v-if="props.row.id !== 2 && props.row.id !== 3 && props.row.id !== 4"
                      :model-value="!!props.row.estado" @update:model-value="val => confirmToggleRole(props.row, val)"
                      color="orange-9" size="sm" />
                  </div>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </q-card-section>
    </q-card>


    <!-- Dialog mejorado -->
    <q-dialog v-model="dialogOpen" persistent :maximized="$q.screen.lt.md">
      <q-card class="role-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-header-content">
            <q-icon :name="editMode ? 'edit' : 'add_circle'" size="1.5em" class="dialog-icon" />
            <div>
              <div class="dialog-title">{{ editMode ? 'Editar Rol' : 'Crear Nuevo Rol' }}</div>
              <div class="dialog-subtitle">
                {{ editMode ? 'Actualiza la información del rol' : 'Define un nuevo rol conpermisos específicos' }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" @click="dialogOpen = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="dialog-body">
          <q-form ref="roleForm" @submit.prevent="saveRole">
            <div class="q-gutter-lg">
              <!-- Información básica del rol -->
              <div class="form-section">
                <div class="section-title">
                  <q-icon name="info" size="sm" />
                  Información del Rol
                </div>
                <q-input v-model="currentRole.nombre" label="Nombre del rol" hint="Ej: Administrador, Editor, Contador"
                  outlined dense class="q-mt-md" :rules="[val => !!val || 'El nombre es requerido']" color="green-8">
                  <template v-slot:prepend>
                    <q-icon name="label" />
                  </template>
                </q-input>
              </div>

              <!-- Selector de permisos mejorado -->
              <div class="form-section">
                <div class="section-title">
                  <q-icon name="security" size="sm" />
                  Asignar Permisos
                </div>
                <div class="permissions-grid">
                  <div v-for="mod in modules" :key="mod.id" class="permission-card">
                    <q-card flat class="permission-item"
                      :class="{ 'permission-active': hasPerm(currentRole.permisos, mod.id) }"
                      @click="togglePerm(mod.id, !hasPerm(currentRole.permisos, mod.id))">
                      <q-card-section class="permission-content">
                        <div class="permission-info">
                          <div class="permission-number">{{ mod.id }}</div>
                          <div class="permission-name">{{ mod.label }}</div>
                        </div>
                        <q-checkbox :model-value="hasPerm(currentRole.permisos, mod.id)"
                          @update:model-value="val => togglePerm(mod.id, val)" color="green-8" @click.stop size="md" />
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions class="dialog-actions">
          <q-btn flat label="Cancelar" color="grey-7" @click="dialogOpen = false" />
          <q-btn unelevated label="Guardar Rol" icon-right="save" color="green-8" text-color="white" @click="saveRole"
            class="save-btn" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Módulos disponibles (id = número que representa módulo). Completados 0..19 según especificación
const modules = [
  { id: 0, label: 'Menú principal', hint: 'Acceso al menú principal' },
  { id: 1, label: 'Área personal', hint: 'Ver y editar tu perfil' },
  { id: 2, label: 'Lista de usuarios', hint: 'Ver y buscar usuarios' },
  { id: 3, label: 'Roles', hint: 'Gestionar roles y permisos' },
  { id: 4, label: 'Inscripciones', hint: 'Gestionar inscripciones' },
  { id: 5, label: 'Paquetes', hint: 'Administrar paquetes' },
  { id: 6, label: 'Estudiantes', hint: 'Gestión de estudiantes' },
  { id: 7, label: 'Entrenadores', hint: 'Gestión de entrenadores' },
  { id: 8, label: 'Gastos', hint: 'Registrar y consultar gastos' },
  { id: 9, label: 'Pagos', hint: 'Registrar y consultar pagos' },
  { id: 10, label: 'Disciplinas', hint: 'Gestionar disciplinas' },
  { id: 11, label: 'Entrenamientos', hint: 'Programar entrenamientos' },
  { id: 12, label: 'Torneos', hint: 'Administrar torneos' },
  { id: 13, label: 'Niveles', hint: 'Gestionar niveles' },
  { id: 14, label: 'Ubicaciones', hint: 'Administrar ubicaciones' },
  { id: 15, label: 'Reportes', hint: 'Generar e inspeccionar reportes' },
  { id: 16, label: 'Configuraciones', hint: 'Ajustes generales del sistema' }
]

// Lista de roles (mock). Cada rol: { id, nombre, permisos: '1,2,3' }
const rolesList = ref([])

const columns = [
  { name: 'nro', label: '#', field: 'nro', align: 'center' },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'center' },
  { name: 'permisos', label: 'Permisos', field: 'permisos', align: 'center' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' }
]

const displayColumns = computed(() => columns)

const dialogOpen = ref(false)
const editMode = ref(false)
const currentRole = ref({ id: null, nombre: '', permisos: '' })
const roleForm = ref(null)

const openDialog = (role) => {
  if (role) {
    editMode.value = true
    currentRole.value = { id: role.id, nombre: role.nombre, permisos: role.permisos }
  } else {
    editMode.value = false
    currentRole.value = { id: null, nombre: '', permisos: '' }
  }
  dialogOpen.value = true
}

const toPermArray = (perms) => {
  if (!perms) return []
  return String(perms).split(',').map(x => x.trim()).filter(x => x !== '').map(Number)
}

const hasPerm = (perms, id) => {
  const arr = toPermArray(perms)
  return arr.includes(Number(id))
}

const togglePerm = (id, enabled) => {
  const arr = toPermArray(currentRole.value.permisos)
  const idx = arr.indexOf(Number(id))
  if (enabled && idx === -1) {
    arr.push(Number(id))
  } else if (!enabled && idx !== -1) {
    arr.splice(idx, 1)
  }
  // mantener orden y convertir a cadena
  currentRole.value.permisos = arr.sort((a, b) => a - b).join(',')
}

const saveRole = async () => {
  // validar formulario
  if (roleForm.value) {
    const ok = roleForm.value.validate ? roleForm.value.validate() : true
    if (!ok) { $q.notify({ type: 'negative', message: 'Corrige los errores del formulario' }); return }
  }
  if (!currentRole.value.nombre) { $q.notify({ type: 'negative', message: 'El nombre del rol es requerido' }); return }
  // si edicion, actualizar
  if (editMode.value) {
    await modificarRol(currentRole.value)
    fetchRoles()
  } else {
    await agregarRol(currentRole.value)
    fetchRoles()
  }
  dialogOpen.value = false
}

const getModuleLabel = (id) => {
  const m = modules.find(x => Number(x.id) === Number(id))
  return m ? m.label : `M${id}`
}

// Nota: Eliminación física no usada en UI; si se necesita activar, implementar llamada al backend.

// Confirmar cambio de estado (toggle) para roles
const confirmToggleRole = (role, nextVal) => {
  $q.dialog({ title: 'Confirmar cambio de estado', message: `¿Cambiar estado de ${role.nombre} a ${nextVal ? 'Activo' : 'Inactivo'}?`, cancel: true, persistent: true }).onOk(() => {
    const idx = rolesList.value.findIndex(r => r.id === role.id)
    if (idx !== -1) {
      rolesList.value[idx].estado = !!nextVal
      $q.notify({ type: 'positive', message: `Estado de ${role.nombre} actualizado` })
    }
  }).onCancel(() => {
    // si cancela, no hacer nada — el toggle volverá a su valor anterior porque no cambiamos el dato
  })
}

onMounted(async () => {
  // placeholder si se conectara al backend en el futuro
  fetchRoles()
})
const fetchRoles = async () => {
  const res = await listarRoles()
  // asegurar que cada rol tenga estado (por defecto true si no viene)
  rolesList.value = (Array.isArray(res) ? res : []).map(r => ({ ...r, estado: r.estado === undefined ? true : r.estado }))
}

const filteredRoles = computed(() => {
  return rolesList.value || []
})
import { computed } from 'vue'
import { listarRoles } from 'src/stores/rol-store'
import { agregarRol, modificarRol } from 'src/stores/rol-store'

</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// Paleta de colores personalizada
$color-forest-dark: #1b5e20;
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-sage: #8bc34a;
$color-orange: #ff6f00;
$color-orange-light: #ff8f00;
$color-amber: #ffa726;

// ===== PÁGINA PRINCIPAL =====
.roles-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%);
  min-height: 100vh;
  transition: all 0.3s ease;

  &.dark-mode {
    background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
  }
}

// ===== HEADER =====
.page-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 50%, $color-moss 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(27, 94, 32, 0.25);
  animation: slideInDown 0.6s ease;

  @media (max-width: 768px) {
    padding: 20px;
    margin-bottom: 20px;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

.header-left {
  flex: 1;
}

.page-title {
  color: white;
  font-size: 2.2em;
  font-weight: 800;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1.2;

  .title-icon {
    animation: pulse 3s ease infinite;
  }

  @media (max-width: 768px) {
    font-size: 1.8em;
  }

  @media (max-width: 480px) {
    font-size: 1.4em;
  }
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95em;
  font-weight: 500;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 0.85em;
  }
}

.header-actions {
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
  }
}

.add-role-btn {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(255, 111, 0, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 111, 0, 0.4);
    background: linear-gradient(135deg, $color-orange-light 0%, $color-amber 100%);
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 10px 16px;
    font-size: 0.9em;
  }
}

// ===== TOOLBAR Y FILTROS =====
.toolbar-card {
  display: none;
}

.full-width {
  width: 100%;
}

// ===== TABLA DE ROLES =====
.roles-table-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border-color: $color-leaf;
  }
}

.table-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  padding: 20px 24px;

  .text-h6 {
    color: white;
    font-weight: 700;
    margin: 0;
  }
}

.table-wrapper {
  overflow-x: auto;

  @media (max-width: 768px) {
    overflow-x: auto;
  }
}

.table-header-row {
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(85, 139, 47, 0.95) 100%);
}

.table-header-cell {
  color: white !important;
  font-weight: 700 !important;
  padding: 16px 12px !important;
  font-size: 0.95em !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-body-row {
  border-bottom: 1px solid rgba(46, 125, 50, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(46, 125, 50, 0.05);
  }

  @media (max-width: 768px) {
    &:last-child {
      border-bottom: 1px solid rgba(46, 125, 50, 0.1);
    }
  }
}

.role-id-cell {
  min-width: 60px;
}

.row-number-cell {
  min-width: 60px;
  width: 60px;
}

.row-badge {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  font-weight: 700;
  padding: 4px 12px;
}

.role-name-cell {
  min-width: 150px;
}

.role-name-text {
  font-weight: 600;
  color: $color-forest;
  font-size: 1em;
}

.permisos-cell {
  min-width: 300px;
  padding: 12px !important;

  @media (max-width: 768px) {
    min-width: 200px;
  }
}

.perm-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-break {
  width: 100%;
  height: 0;
}

.perm-chip {
  font-weight: 500;
  font-size: 0.8em;
  padding: 4px 10px !important;
  border-radius: 8px !important;
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%) !important;
  box-shadow: 0 2px 6px rgba(46, 125, 50, 0.2);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(46, 125, 50, 0.3);
  }
}

.actions-cell {
  min-width: 120px;
  text-align: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  transition: all 0.3s ease;

  &:hover {
    background: rgba(46, 125, 50, 0.1);
    transform: scale(1.15);
  }
}

// ===== DIALOG =====
.role-dialog {
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  max-width: 900px;
  min-width: 600px;

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
  gap: 16px;
}

.dialog-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;

  .dialog-icon {
    color: $color-lime;
  }
}

.dialog-title {
  font-size: 1.3em;
  font-weight: 700;
  color: white;
  margin: 0;
}

.dialog-subtitle {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.8);
  margin: 4px 0 0 0;
}

.dialog-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.form-section {
  margin-bottom: 32px;

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
  padding-bottom: 12px;
  border-bottom: 2px solid $color-leaf;

  .q-icon {
    color: $color-orange;
  }
}

// ===== GRID DE PERMISOS =====
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.permission-card {
  display: flex;
  transition: all 0.2s ease;
}

.permission-item {
  border: 2px solid rgba(46, 125, 50, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  width: 100%;

  &:hover {
    border-color: $color-leaf;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
    transform: translateY(-2px);
  }

  &.permission-active {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(85, 139, 47, 0.08) 100%);
    border-color: $color-leaf;
    box-shadow: 0 4px 16px rgba(46, 125, 50, 0.2);
  }
}

.permission-content {
  padding: 12px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 80px;
}

.permission-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  flex-direction: column;
}

.permission-number {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9em;
  flex-shrink: 0;
}

.permission-name {
  font-weight: 600;
  color: $color-forest;
  font-size: 0.9em;
  line-height: 1.2;
}

// ===== ACCIONES DEL DIALOG =====
.dialog-actions {
  padding: 16px 24px;
  background: linear-gradient(135deg, #f9f9f9 0%, #f0f5f0 100%);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(46, 125, 50, 0.1);

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
}

.save-btn {
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(46, 125, 50, 0.4);
    background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  }
}

// ===== ANIMACIONES =====
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
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

// ===== MODO OSCURO =====
:deep(.body--dark) {
  .roles-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
  }

  .toolbar-card,
  .roles-table-card,
  .role-dialog {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  .table-body-row:hover {
    background: rgba(46, 125, 50, 0.1);
  }

  .role-name-text {
    color: $color-leaf;
  }

  .permission-item {
    background: #333;
    border-color: rgba(46, 125, 50, 0.3);

    &.permission-active {
      background: rgba(46, 125, 50, 0.15);
      border-color: $color-leaf;
    }
  }

  .dialog-body {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  .dialog-actions {
    background: #1f1f1f;
  }

  .section-title {
    color: $color-leaf;
    border-color: rgba(46, 125, 50, 0.5);
  }
}
</style>

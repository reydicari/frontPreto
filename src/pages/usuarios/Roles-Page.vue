<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="col-6">
        <h2 class="text-h5 q-ma-none">Gestión de Roles</h2>
        <div class="text-subtitle2 text-grey">Crea, edita y asigna permisos a los roles</div>
      </div>
      <div class="col-6 ">
        <div class="row">
          <q-select v-model="filterStatus" :options="statusOptions" emit-value map-options label="Filtrar por estado"
            dense outlined clearable class="q-mr-xl col-6" />
          <q-btn color="primary" icon="add" label="Nuevo Rol" @click="openDialog(null)" />
        </div>
      </div>
    </div>

    <q-card>
      <q-card-section>
        <q-table :rows="filteredRoles" :columns="columns" row-key="id">
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat dense icon="edit" color="primary" @click="openDialog(props.row)" />
              <!-- Toggle de estado en lugar de eliminar (con confirmación). No mostrar para roles 2,3,4 -->
              <q-toggle dense v-if="props.row.id !== 2 && props.row.id !== 3 && props.row.id !== 4"
                :model-value="!!props.row.estado" @update:model-value="val => confirmToggleRole(props.row, val)" />
            </q-td>
          </template>
          <template v-slot:body-cell-permisos="props">
            <q-td :props="props">
              <div class="perm-chips">
                <template v-for="(p, idx) in toPermArray(props.row.permisos)" :key="p">
                  <q-chip size="sm" class="q-mr-sm q-mb-sm" color="teal" text-color="white">
                    {{ getModuleLabel(p) }}
                  </q-chip>
                  <!-- forzar salto de línea después del séptimo elemento -->
                  <div v-if="idx === 6 || idx === 13" class="w-100"></div>
                </template>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card :style="dialogCardStyle" :class="{ 'dialog-fullscreen': isCompact }">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Editar Rol' : 'Crear Rol' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form ref="roleForm" @submit.prevent="saveRole">
            <div class="q-gutter-md">
              <q-input v-model="currentRole.nombre" label="Nombre del rol" hint="Nombre corto (ej: admin, editor)" dense
                outlined :rules="[val => !!val || 'El nombre es requerido']" />

              <div class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">Permisos (activar módulos)</div>
                <div class="row q-col-gutter-md">
                  <div v-for="mod in modules" :key="mod.id" class="col-12 col-sm-6 col-md-4">
                    <q-card flat bordered class="q-pa-sm module-card"
                      @click="togglePerm(mod.id, !hasPerm(currentRole.permisos, mod.id))">
                      <div class="row items-center" style="width:100%">
                        <div class="col">
                          <div class="row items-center">
                            <div class="text-subtitle1 module-number">{{ mod.id }}.</div>
                            <div class="text-subtitle1">{{ mod.label }}</div>
                          </div>
                          <!-- <div class="text-caption text-grey">{{ mod.hint }}</div> -->
                        </div>
                        <div class="module-toggle">
                          <q-toggle :model-value="hasPerm(currentRole.permisos, mod.id)"
                            @update:model-value="val => togglePerm(mod.id, val)" size="sm" checked-icon="check"
                            unchecked-icon="clear" @click.stop />
                        </div>
                      </div>
                    </q-card>
                  </div>
                </div>
              </div>

            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup @click="dialogOpen = false" />
          <q-btn flat label="Guardar" color="primary" @click="saveRole" />
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
  { name: 'id', label: 'ID', field: 'id' },
  { name: 'nombre', label: 'Nombre', field: 'nombre' },
  { name: 'permisos', label: 'Permisos', field: 'permisos' },
  { name: 'actions', label: 'Acciones', field: 'actions' }
]

const dialogOpen = ref(false)
const editMode = ref(false)
const currentRole = ref({ id: null, nombre: '', permisos: '' })
const roleForm = ref(null)
const filterStatus = ref(null)
const statusOptions = [{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]

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
  let res = rolesList.value || []
  if (filterStatus.value !== null) {
    res = res.filter(r => (!!r.estado) === filterStatus.value)
  }
  return res
})
import { computed } from 'vue'
import { listarRoles } from 'src/stores/rol-store'
import { agregarRol, modificarRol } from 'src/stores/rol-store'

const isCompact = computed(() => $q.screen.lt.lg) // true para pantallas small y medium

const dialogCardStyle = computed(() => {
  if (isCompact.value) {
    return { minWidth: '100vw', maxWidth: '100vw', width: '100vw', height: '100vh', margin: '0', borderRadius: '0' }
  }
  return { minWidth: '420px', maxWidth: '720px' }
})

</script>

<style scoped>
.module-card {
  height: 110px;
  /* tamaño uniforme */
  display: flex;
  align-items: center;
}

.module-number {
  width: 28px;
  text-align: right;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.7);
}

.module-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 56px;
}
</style>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h2 class="text-h5 q-ma-none">Gestión de Roles</h2>
        <div class="text-subtitle2 text-grey">Crea, edita y asigna permisos a los roles</div>
      </div>
      <q-btn color="primary" icon="add" label="Nuevo Rol" @click="openDialog(null)" />
    </div>

    <q-card>
      <q-card-section>
        <q-table :rows="rolesList" :columns="columns" row-key="id">
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat dense icon="edit" color="primary" @click="openDialog(props.row)" />
              <q-btn flat dense icon="delete" color="negative" @click="confirmDelete(props.row)" />
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
  { id: 2, label: 'Módulo 2', hint: 'Función específica (personalizar)' },
  { id: 3, label: 'Lista de usuarios', hint: 'Ver y buscar usuarios' },
  { id: 4, label: 'Roles', hint: 'Gestionar roles y permisos' },
  { id: 5, label: 'Inscripciones', hint: 'Gestionar inscripciones' },
  { id: 6, label: 'Paquetes', hint: 'Administrar paquetes' },
  { id: 7, label: 'Estudiantes', hint: 'Gestión de estudiantes' },
  { id: 8, label: 'Entrenadores', hint: 'Gestión de entrenadores' },
  { id: 9, label: 'Gastos', hint: 'Registrar y consultar gastos' },
  { id: 10, label: 'Pagos', hint: 'Registrar y consultar pagos' },
  { id: 11, label: 'Categorías pago/gasto', hint: 'Clasificar pagos y gastos' },
  { id: 12, label: 'Métodos pago/gasto', hint: 'Definir métodos de pago y gasto' },
  { id: 13, label: 'Disciplinas', hint: 'Gestionar disciplinas' },
  { id: 14, label: 'Entrenamientos', hint: 'Programar entrenamientos' },
  { id: 15, label: 'Torneos', hint: 'Administrar torneos' },
  { id: 16, label: 'Niveles', hint: 'Gestionar niveles' },
  { id: 17, label: 'Ubicaciones', hint: 'Administrar ubicaciones' },
  { id: 18, label: 'Reportes', hint: 'Generar e inspeccionar reportes' },
  { id: 19, label: 'Configuraciones', hint: 'Ajustes generales del sistema' }
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

const saveRole = () => {
  // validar formulario
  if (roleForm.value) {
    const ok = roleForm.value.validate ? roleForm.value.validate() : true
    if (!ok) { $q.notify({ type: 'negative', message: 'Corrige los errores del formulario' }); return }
  }
  if (!currentRole.value.nombre) { $q.notify({ type: 'negative', message: 'El nombre del rol es requerido' }); return }
  // si edicion, actualizar
  if (editMode.value) {
    const idx = rolesList.value.findIndex(r => r.id === currentRole.value.id)
    if (idx !== -1) {
      rolesList.value[idx] = { ...rolesList.value[idx], nombre: currentRole.value.nombre, permisos: currentRole.value.permisos }
      $q.notify({ type: 'positive', message: 'Rol actualizado' })
    }
  } else {
    const newRole = { id: Date.now(), nombre: currentRole.value.nombre, permisos: currentRole.value.permisos }
    rolesList.value.push(newRole)
    $q.notify({ type: 'positive', message: 'Rol creado' })
  }
  dialogOpen.value = false
}

const getModuleLabel = (id) => {
  const m = modules.find(x => Number(x.id) === Number(id))
  return m ? m.label : `M${id}`
}

const confirmDelete = (role) => {
  $q.dialog({ title: 'Confirmar eliminación', message: `¿Eliminar rol ${role.nombre}?`, cancel: true, persistent: true }).onOk(() => {
    rolesList.value = rolesList.value.filter(r => r.id !== role.id)
    $q.notify({ type: 'positive', message: 'Rol eliminado' })
  })
}

onMounted(async () => {
  // placeholder si se conectara al backend en el futuro
  rolesList.value = await listarRoles()
})
import { computed } from 'vue'
import { listarRoles } from 'src/stores/usuario-store'

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

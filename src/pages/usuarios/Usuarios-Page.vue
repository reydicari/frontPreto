<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <h2 class="text-h4 q-ma-none">Gestión de Usuarios</h2>
    </div>

    <!-- Barra de herramientas -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <!-- Botón para agregar usuario -->
          <q-btn color="primary" icon="person_add" label="Nuevo Usuario" @click="showUserDialog(null)" />


          <!-- Buscador -->
          <q-input v-model="searchTerm" outlined dense placeholder="Buscar usuarios..." class="col-md-4">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Filtros avanzados -->
        <q-expansion-item v-model="filtersExpanded" label="Filtros avanzados" class="q-mt-sm bg-grey-3 q-px-sm">
          <div class="row q-col-gutter-md q-pt-md">
            <q-select v-model="filtroRol" :options="roles" label="Rol" option-label="nombre" outlined multiple dense
              clearable class="col-md-4 col-sm-6 col-xs-12">
              <template v-slot:selected-item="scope">
                <q-chip dense class="q-mx-xs" :color="scope.opt.color || 'primary'" text-color="white" removable
                  @remove="scope.removeAtIndex(scope.index)">
                  {{ scope.opt.nombre }}
                </q-chip>
              </template>
            </q-select>


            <q-select v-model="filterStatus" :options="statusOptions" label="Estado" outlined dense clearable
              class="col-md-4 col-sm-6 col-xs-12" />

            <q-input v-model="dateRangeLabel" label="Rango de fechas" outlined dense class="col-md-4 col-sm-6 col-xs-12"
              readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="dateRange" range>
                      <div class="row items-center justify-end q-gutter-sm">
                        <q-btn label="Aceptar" color="primary" flat v-close-popup />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="row justify-end q-mt-sm">
            <q-btn label="Limpiar filtros" flat color="primary" @click="clearFilters" />
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!-- Tabla de usuarios -->
    <q-card>
      <q-table :rows="filteredUsers" :columns="columns" row-key="id" :loading="loading" @request="onRequest">
        <!-- Columna número (nro) -->
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ computeRowNumber(props) }}
          </q-td>
        </template>

        <!-- Columna de estado con switch y confirmación -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-toggle dense :model-value="props.row.estado"
              @update:model-value="val => confirmChangeEstado(props.row, val)" />
          </q-td>
        </template>
        <!-- Columna de acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn icon="edit" color="primary" flat dense @click="showUserDialog(props.row)" />
          </q-td>
        </template>

        <!-- Columna de roles -->
        <template v-slot:body-cell-roles="props">
          <q-td :props="props">
            <q-chip v-for="role in props.row.rols || []" :key="role.id" size="sm" :color="getRoleColor(role.nombre)"
              text-color="white">
              {{ role.nombre }}
            </q-chip>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Diálogo para editar/crear usuario -->
    <q-dialog v-model="userDialog" persistent>
      <q-card style=" max-width: 600px ;">
        <q-card-section>
          <div class="text-h6">
            {{ editMode ? 'Editar Usuario' : 'Crear Usuario' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form ref="userForm" @submit.prevent="saveUser">
            <div class="row q-col-gutter-md">
              <q-input v-model="currentUser.usuario" label="Usuario" dense hint="Nombre de usuario (una palabra)"
                class="col-12" @keyup="verificarUsuario" :rules="[
                  rules.required(),
                  rules.maxLength(15),
                  rules.minLength(5),
                  rules.letrasNumeros,
                  val => !val.includes(' ') || 'Debe ser una sola palabra',
                  /* proteger caso donde users pueda contener elementos undefined */
                  val => !users.some(user => user && user.usuario === val && user.id !== (currentUser.value?.id ?? currentUser.id)) || 'Este nombre de usuario ya existe'
                ]" />

              <q-input v-model="currentUser.clave" :label="editMode ? 'Nueva contraseña (opcional)' : 'Contraseña'"
                type="password" outlined dense class="col-12"
                :rules="[val => editMode || (val && val.length >= 6) || 'Mínimo 6 caracteres']" />

              <q-input v-model="currentUser.clave_confirmation"
                :label="editMode ? 'Confirmar nueva contraseña (opcional)' : 'Confirmar contraseña'" type="password"
                outlined dense class="col-12" :rules="[
                  val => editMode || val === currentUser.clave || 'Las contraseñas no coinciden'
                ]" />

              <div v-if="editMode" class="col-12">
                <q-banner dense class="bg-grey-2 text-red">Si deja los campos de contraseña vacíos, la contraseña
                  actual
                  se mantiene.</q-banner>
              </div>

              <!-- Selección múltiple de roles -->
              <q-select v-model="currentUser.roles" :options="roles" option-label="nombre" label="Roles" map-options
                multiple outlined dense class="col-12" clearable
                :rules="[val => val && val.length > 0 || 'Se requiere al menos un rol']">
                <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section>
                      <q-item-label>{{ opt.nombre }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:selected-item="{ opt, index, removeAtIndex }">
                  <q-chip removable @remove="removeAtIndex(index)" color="primary" text-color="white" class="q-ma-xs">
                    {{ opt.nombre }}
                  </q-chip>
                </template>
              </q-select>

              <!-- Selección de persona (única) -->
              <q-select v-model="currentUser.id_persona" :options="personaOptions" option-label="displayName" emit-value
                option-value="id" label="Persona" map-options outlined dense use-input input-debounce="300"
                class="col-12" @filter="filtrarPersonasSingle"
                :rules="[val => !!val || 'Se requiere seleccionar una persona']">
                <template v-slot:option="{ itemProps, opt }">
                  <q-item v-bind="itemProps">
                    <q-item-section>
                      <q-item-label>{{ opt.nombres }} {{ opt.apellido_paterno }} {{ opt.apellido_materno
                      }}</q-item-label>
                      <q-item-label caption>{{ opt.ci }} {{ opt.complemento }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:selected-item="{ opt }">
                  <div>{{ getPersonaDisplay(opt) }}</div>
                </template>
              </q-select>

              <div class="col-12 q-mt-sm" v-if="editMode">
                <q-toggle v-model="currentUser.estado" label="Estado" true-value="true" false-value="false" />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup />
          <q-btn flat label="Guardar" color="primary" @click="saveUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { listarUsuarios, listarRoles, registrarUsuario } from 'src/stores/usuario-store.js'
import { useValidation } from 'src/composables/useValidation.js'
import { listar } from 'src/stores/persona-store'

const rules = useValidation()
const $q = useQuasar()

// personaOptions (mocked). Each item should include id, nombres, apellido_*, ci, complemento
const personaOptions = ref([])
const personaCache = ref([])
const userForm = ref(null)

// Estado del componente
const dateRange = ref({ from: null, to: null })
const dateRangeLabel = computed(() => (dateRange.value.from && dateRange.value.to) ? `${dateRange.value.from} al ${dateRange.value.to}` : '')

const users = ref([])
const usersAux = ref([])
const roles = ref([])
const loading = ref(false)
const searchTerm = ref('')
const filtersExpanded = ref(false)
const filterStatus = ref(null)
const filterDateFrom = ref(null)
const filterDateTo = ref(null)
const userDialog = ref(false)
const editMode = ref(false)

const currentUser = ref({ id: null, usuario: '', clave: '', id_persona: null, estado: true, roles: [] })

// Opciones para filtros
const filtroRol = ref([])
const statusOptions = [{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]

// Columnas de the table
const columns = [
  { name: 'index', label: 'Nro', field: (row, index) => index + 1, align: 'left', sortable: true },
  { name: 'usuario', label: 'Usuario', field: 'usuario', align: 'left', sortable: true },
  { name: 'telefono', label: 'Telefono', field: row => row.persona?.telefono || '', align: 'left', sortable: true },
  { name: 'ultima_sesion', label: 'Ultimo ingreso', field: 'ultimo_ingreso', align: 'left' },
  { name: 'persona', label: 'Persona', field: row => (row.persona?.nombres || '') + ' ' + (row.persona?.apellido_paterno || ''), align: 'center' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'roles', label: 'Roles', field: 'rols', align: 'center' },
  { name: 'actions', label: 'Modificar', align: 'center' }
]

// Paginación
const pagination = ref({ sortBy: 'name', descending: false, page: 1, rowsPerPage: 10, rowsNumber: 0 })

// Helper: verificar usuario único
const verificarUsuario = () => {
  return users.value.some(u => u.usuario === currentUser.value.usuario && u.id !== currentUser.value.id)
}

// Filtrado para el q-select de persona (single)
const filtrarPersonasSingle = (val, update) => {
  const q = (val || '').toLowerCase()
  if (!Array.isArray(personaCache.value)) { update(() => []); return }
  const results = personaCache.value.filter(p => `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.toLowerCase().includes(q))
  update(() => results)
}

// Seguridad al mostrar persona seleccionada: opt puede ser null, un id, o el objeto
const getPersonaDisplay = (opt) => {
  if (!opt) return ''
  // si opt es un número (id), buscar en personaOptions
  if (typeof opt === 'number' || typeof opt === 'string') {
    const p = personaOptions.value.find(x => x.id === opt)
    return p ? `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno}` : ''
  }
  // si es objeto
  return `${opt.nombres || ''} ${opt.apellido_paterno || ''} ${opt.apellido_materno || ''}`.trim()
}

onMounted(async () => {
  fetchUsers()//pequeña espera visual
  usersAux.value = users.value
  roles.value = await listarRoles()
})

// Obtener usuarios (simulando llamada API)
const fetchUsers = async () => {
  loading.value = true
  setTimeout(async () => {
    loading.value = false
    users.value = await listarUsuarios()

  }, 500)
}

// Filtrar usuarios
const filteredUsers = computed(() => {
  let result = users.value

  // Filtro de búsqueda general
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(user => {
      const nombrePersona = `${user.persona?.nombres || ''} ${user.persona?.apellido_paterno || ''} ${user.persona?.apellido_materno || ''}`.toLowerCase()
      return (user.usuario || '').toLowerCase().includes(term) || nombrePersona.includes(term)
    })
  }

  // Filtro por estado
  if (filterStatus.value !== null) {
    result = result.filter(user => user.estado === filterStatus.value)
  }

  // Filtro por fecha (usa dateRange.from / dateRange.to) sobre user.ultimo_ingreso
  const from = dateRange.value && dateRange.value.from ? new Date(dateRange.value.from) : null
  const to = dateRange.value && dateRange.value.to ? new Date(dateRange.value.to) : null
  if (from) {
    result = result.filter(user => user.ultimo_ingreso && new Date(user.ultimo_ingreso) >= from)
  }
  if (to) {
    result = result.filter(user => user.ultimo_ingreso && new Date(user.ultimo_ingreso) <= to)
  }

  // Filtro por rol (si aplica)
  if (filtroRol.value.length > 0) {
    filtroRol.value.forEach(fr => {
      result = result.filter(u => (u.rols || []).some(r => r.id === fr.id))
    })
  }

  return result
})

// calcular número de fila teniendo en cuenta paginación y orden/filtrado actual
const computeRowNumber = (props) => {
  try {
    const all = filteredUsers.value || []
    const idx = all.findIndex(r => r && r.id === props.row.id)
    const page = pagination.value?.page || 1
    const per = pagination.value?.rowsPerPage && pagination.value.rowsPerPage > 0 ? pagination.value.rowsPerPage : all.length
    if (idx === -1) return ''
    return (page - 1) * per + idx + 1
  } catch (e) {
    void e
    return ''
  }
}

// Mostrar diálogo para editar/crear usuario
const showUserDialog = async (user) => {
  // cargar personas y normalizar la respuesta (puede venir como array o como {data: [...]})
  try {
    const res = await listar()
    const arr = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])
    personaCache.value = arr
    personaOptions.value = arr
    console.log('PERSONAS cargadas:', personaOptions.value.length)
  } catch (err) {
    console.error('Error cargando personas', err)
    personaCache.value = []
    personaOptions.value = []
  }

  if (user) {
    editMode.value = true
    currentUser.value = { id: user.id, usuario: user.usuario, id_persona: user.persona?.id || null, estado: user.estado !== undefined ? user.estado : true, clave: '', roles: user.rols ? [...user.rols] : [] }
  } else {
    editMode.value = false
    currentUser.value = { id: null, usuario: '', id_persona: null, clave: '', estado: true, roles: [] }
  }
  userDialog.value = true
}

// Guardar usuario (mocked local behavior) con validaciones
const saveUser = async () => {
  // validar el form (q-form) si existe
  if (userForm.value) {
    const ok = await userForm.value.validate()
    if (!ok) {
      $q.notify({ type: 'negative', message: 'Corrige los errores del formulario antes de guardar' })
      return
    }
  }

  // Validaciones adicionales: roles y persona
  if (!currentUser.value.roles || currentUser.value.roles.length === 0) {
    $q.notify({ type: 'negative', message: 'Debes seleccionar al menos un rol' })
    return
  }
  if (!currentUser.value.id_persona) {
    $q.notify({ type: 'negative', message: 'Debes seleccionar una persona' })
    return
  }

  // contraseña: en edición es opcional; en creación obligatoria
  if (editMode.value) {
    if (currentUser.value.clave && currentUser.value.clave.length > 0) {
      if (currentUser.value.clave !== currentUser.value.clave_confirmation) {
        $q.notify({ type: 'negative', message: 'Las contraseñas no coinciden' })
        return
      }
    }

    const index = users.value.findIndex(u => u.id === currentUser.value.id)
    if (index !== -1) {
      // buscar persona comparando como strings para evitar mismatch number/string
      const persona = personaOptions.value.find(p => String(p.id) === String(currentUser.value.id_persona))
      users.value[index] = {
        ...users.value[index],
        usuario: currentUser.value.usuario,
        estado: !!currentUser.value.estado,
        persona: persona || users.value[index].persona,
        rols: currentUser.value.roles || users.value[index].rols
      }
      if (currentUser.value.clave && currentUser.value.clave.length > 0) users.value[index].clave = currentUser.value.clave
    }
    currentUser.value.rols = currentUser.value.roles
    console.log('UYSUARIO MODIFICADO', currentUser.value);

    $q.notify({ type: 'positive', message: 'Usuario actualizado correctamente' })
    userDialog.value = false
  } else {
    // creación: validar contraseña
    if (!currentUser.value.clave || currentUser.value.clave.length < 6) {
      $q.notify({ type: 'negative', message: 'La contraseña es obligatoria y debe tener al menos 6 caracteres' })
      return
    }
    if (currentUser.value.clave !== currentUser.value.clave_confirmation) {
      $q.notify({ type: 'negative', message: 'Las contraseñas no coinciden' })
      return
    }
    // al crear, buscar persona por id (comparando como strings)
    const persona = personaOptions.value.find(p => String(p.id) === String(currentUser.value.id_persona)) || null
    const newUser = { id: Date.now(), usuario: currentUser.value.usuario, estado: true, id_persona: persona.id, rols: currentUser.value.roles || [], ultimo_ingreso: null, clave: currentUser.value.clave }
    await registrarUsuario(newUser)
    $q.notify({ type: 'positive', message: 'Usuario creado correctamente' })
    userDialog.value = false

  }
  await fetchUsers()
}

// (Nota) eliminación no implementada en UI actual. Si se necesita, reactivar la función.

// Limpiar filtros
const clearFilters = () => {
  searchTerm.value = ''
  filtroRol.value = []
  filterStatus.value = null
  filterDateFrom.value = null
  filterDateTo.value = null
}

// Color para los roles
const getRoleColor = (role) => { const colors = { admin: 'red', editor: 'blue', viewer: 'green' }; return colors[role] || 'grey' }

// Manejar paginación/ordenamiento
const onRequest = (props) => { pagination.value = props.pagination }

// Confirm change of estado with a small dialog
const confirmChangeEstado = (user, nextVal) => {
  $q.dialog({ title: 'Confirmar cambio de estado', message: `¿Desea cambiar el estado de ${user.persona?.nombres || user.usuario} a ${nextVal ? 'Activo' : 'Inactivo'}?`, cancel: true, persistent: true }).onOk(() => {
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) { users.value[idx].estado = !!nextVal; $q.notify({ type: 'positive', message: 'Estado actualizado' }) }
  })
}

</script>

<style scoped>
/* Estilos personalizados si son necesarios */
</style>

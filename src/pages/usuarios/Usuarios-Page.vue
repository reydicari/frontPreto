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
          <!-- <q-btn color="primary" icon="person_add" label="Nuevo Usuario" @click="showUserDialog(null)" /> -->


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


            <q-select v-model="filterStatus" emit-value map-options :options="statusOptions" label="Estado" outlined
              dense clearable class="col-md-4 col-sm-6 col-xs-12" />

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
                  // rules.existUsername(usuarioTemporal, currentUser.usuario),
                  val => !val.includes(' ') || 'Debe ser una sola palabra',
                  /* proteger caso donde users pueda contener elementos undefined */
                  val => !users.some(user => user && user.usuario == val && val != usuarioTemporal) || 'Este nombre de usuario ya existe'
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
              <!-- <q-select readonly v-model="currentUser.id_persona" :options="personaOptions" option-label="displayName"
                  emit-value option-value="id" label="Persona" map-options outlined dense use-input input-debounce="300"
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
                </q-select> -->

              <!-- <div class="col-12 q-mt-sm" v-if="editMode"> -->
              <!-- <q-toggle v-model="currentUser.estado" label="Estado" true-value="true" false-value="false" /> -->
              <!-- </div> -->
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
import { ref, computed, onMounted, nextTick } from 'vue'

// Helper para parsear distintos formatos de fecha/hora que pueden venir del backend
// Acepta: Date, timestamp (number), ISO con 'T' o con espacio 'YYYY-MM-DD HH:mm:ss', o ISO con Z
const parseDateValue = (val) => {
  if (!val && val !== 0) return null
  if (val instanceof Date) return val
  if (typeof val === 'number') return new Date(val)
  if (typeof val === 'string') {
    // Intentar detectar formatos comunes y parsear componentes numéricos para garantizar
    // que la hora se respete (evitar ambigüedades de interpretación por Date.parse)
    // Soporta: YYYY-MM-DD[ T]HH:mm:ss[.SSS][Z?]
    const re = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?)?(Z?)$/
    const m = val.match(re)
    if (m) {
      const year = Number(m[1])
      const month = Number(m[2]) - 1
      const day = Number(m[3])
      const hour = m[4] ? Number(m[4]) : 0
      const minute = m[5] ? Number(m[5]) : 0
      const second = m[6] ? Number(m[6]) : 0
      const ms = m[7] ? Number((m[7] + '00').slice(0, 3)) : 0
      // Si el string incluye 'Z' al final, Date.UTC es apropiado; si no, construir en zona local
      if (m[8] === 'Z') {
        return new Date(Date.UTC(year, month, day, hour, minute, second, ms))
      }
      return new Date(year, month, day, hour, minute, second, ms)
    }

    // si no coincide con el patrón, intentar parseo más flexible
    // reemplazar primer espacio por 'T' para intentar un parseo estándar
    let s = val
    if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T')
    const d = new Date(s)
    if (!isNaN(d)) return d
    const alt = new Date(s.replace(/-/g, '/'))
    return isNaN(alt) ? null : alt
  }
  return null
}
import { useQuasar } from 'quasar'
import { listarUsuarios, registrarUsuario, modificarUsuario, cambiarEstadoUsuario } from 'src/stores/usuario-store.js'
import { listarRoles } from 'src/stores/rol-store.js'
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
const userDialog = ref(false)
const editMode = ref(false)
const usuarioTemporal = ref('')

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
    console.log('Usuarios: ', users.value);

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
  // Manejar tres casos: solo from, solo to, o ambos (inclusive en 'to' hasta 23:59:59.999)
  if (dateRange.value && (dateRange.value.from || dateRange.value.to)) {
    // Normalizar localmente: usar las cadenas originales pero parsearlas
    let fromStr = dateRange.value.from
    let toStr = dateRange.value.to

    const parsedFrom = fromStr ? parseDateValue(fromStr) : null
    const parsedTo = toStr ? parseDateValue(toStr) : null

    // Si ambas existen y están invertidas, intercambiarlas para que from <= to
    if (parsedFrom && parsedTo && parsedFrom > parsedTo) {
      const tmp = fromStr
      fromStr = toStr
      toStr = tmp
      // Actualizar la UI de forma segura en el siguiente tick para reflejar el orden correcto
      nextTick(() => { dateRange.value = { from: fromStr, to: toStr } })
    }

    const from = fromStr ? new Date(fromStr) : null
    const to = toStr ? new Date(toStr) : null
    const toInclusive = to ? new Date(to) : null
    if (toInclusive) toInclusive.setHours(23, 59, 59, 999)

    if (from && toInclusive) {
      // Ambos límites: filtrar por rango inclusivo en una sola pasada
      result = result.filter(user => {
        const d = parseDateValue(user.ultimo_ingreso)
        if (!d) return false
        return d >= from && d <= toInclusive
      })
    } else if (from) {
      // Solo desde
      result = result.filter(user => {
        const d = parseDateValue(user.ultimo_ingreso)
        return d && d >= from
      })
    } else if (toInclusive) {
      // Solo hasta (inclusivo)
      result = result.filter(user => {
        const d = parseDateValue(user.ultimo_ingreso)
        return d && d <= toInclusive
      })
    }
  }

  // Filtro por rol (si aplica)
  if (Array.isArray(filtroRol.value) && filtroRol.value.length > 0) {
    // Obtener set de ids seleccionados (puede contener objetos de rol)
    const selectedRoleIds = new Set(filtroRol.value.map(r => String(r.id ?? r)))
    // Incluir usuarios que tengan al menos uno de los roles seleccionados
    result = result.filter(u => (u.rols || []).some(r => selectedRoleIds.has(String(r.id))))
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
    usuarioTemporal.value = user ? user.usuario : ''
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
    await modificarUsuario(usuarioTemporal.value, currentUser.value)
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
  // resetear el q-date range
  dateRange.value = { from: null, to: null }
}

// Color para los roles
const getRoleColor = (role) => { const colors = { admin: 'red', editor: 'blue', viewer: 'green' }; return colors[role] || 'grey' }

// Manejar paginación/ordenamiento
const onRequest = (props) => { pagination.value = props.pagination }

// Confirm change of estado with a small dialog
const confirmChangeEstado = (user, nextVal) => {
  $q.dialog({ title: 'Confirmar cambio de estado', message: `¿Desea cambiar el estado de ${user.persona?.nombres || user.usuario} a ${nextVal ? 'Activo' : 'Inactivo'}?`, cancel: true, persistent: true }).onOk(async () => {
    const idx = users.value.findIndex(u => u.usuario === user.usuario)
    try {
      await cambiarEstadoUsuario({ usuario: user.usuario, estado: nextVal })
      if (idx !== -1) { users.value[idx].estado = !!nextVal; }
    } catch (error) {
      console.log(error);

    }
  })
}

</script>

<style scoped>
/* Estilos personalizados si son necesarios */
</style>

<template>
  <q-page class="q-pa-md page-container">
    <!-- Header con estadísticas -->
    <div class="page-header q-mb-lg">
      <div class="header-content">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-sm-auto">
            <div class="header-title">
              <q-icon name="admin_panel_settings" size="42px" class="q-mr-sm" />
              <h2 class="page-title">Usuarios</h2>
            </div>
          </div>
          <!-- <div class="col-12 col-sm-auto">
            <q-btn class="btn-add-header" icon="person_add" label="Nuevo Usuario" @click="showUserDialog(null)"
              unelevated no-caps />
          </div> -->
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <!-- <div class="stats-container row q-gutter-md q-mt-md">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <q-icon name="groups" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.total }}</div>
            <div class="stat-label">Total Usuarios</div>
          </div>
        </div>

        <div class="stat-card stat-card-active">
          <div class="stat-icon">
            <q-icon name="verified_user" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.activos }}</div>
            <div class="stat-label">Activos</div>
          </div>
        </div>

        <div class="stat-card stat-card-inactive">
          <div class="stat-icon">
            <q-icon name="block" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.inactivos }}</div>
            <div class="stat-label">Inactivos</div>
          </div>
        </div>

        <div class="stat-card stat-card-roles">
          <div class="stat-icon">
            <q-icon name="badge" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.rolesUnicos }}</div>
            <div class="stat-label">Roles Únicos</div>
          </div>
        </div>

        <div class="stat-card stat-card-recent">
          <div class="stat-icon">
            <q-icon name="schedule" size="36px" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.ultimaSemana }}</div>
            <div class="stat-label">Activos esta Semana</div>
          </div>
        </div>
      </div> -->
    </div>

    <!-- Barra de herramientas -->
    <q-card class="q-mb-md toolbar-card">
      <q-card-section>
        <div class="row items-center q-col-gutter-sm">
          <!-- Buscador -->
          <q-input v-model="searchInput" clearable @update:model-value="handleSearchInput" outlined dense
            placeholder="Buscar por usuario, nombre, teléfono..." class="col-12 search-input">
            <template v-slot:prepend>
              <q-icon name="search" class="text-brown-7" />
            </template>
          </q-input>
        </div>

        <!-- Filtros avanzados -->
        <q-expansion-item v-model="filtersExpanded" class="q-mt-md filters-expansion" icon="filter_list">
          <template v-slot:header>
            <div class="filters-header">
              <q-icon name="tune" size="24px" class="q-mr-sm" />
              <span class="filters-title">Filtros Avanzados</span>
              <q-badge v-if="activeFiltersCount > 0" color="brown-7" class="q-ml-sm">
                {{ activeFiltersCount }}
              </q-badge>
            </div>
          </template>

          <div class="filters-body q-pt-md">
            <div class="row q-col-gutter-md">
              <q-select v-model="filtroRol" :options="roles" label="Roles" option-label="nombre" outlined multiple dense
                clearable @update:model-value="applyFilters" class="col-12 col-sm-6 col-md-4 filter-input">
                <template v-slot:prepend>
                  <q-icon name="badge" class="text-green-8" />
                </template>
                <template v-slot:selected-item="scope">
                  <q-chip dense class="q-mx-xs" color="brown-7" text-color="white" removable
                    @remove="scope.removeAtIndex(scope.index)">
                    {{ scope.opt.nombre }}
                  </q-chip>
                </template>
              </q-select>

              <q-select v-model="filterStatus" emit-value map-options :options="statusOptions" label="Estado" outlined
                dense clearable @update:model-value="applyFilters" class="col-12 col-sm-6 col-md-4 filter-input">
                <template v-slot:prepend>
                  <q-icon name="toggle_on" class="text-brown-6" />
                </template>
              </q-select>


            </div>

            <!-- <div class="row justify-end q-mt-md q-gutter-sm">
              <q-btn label="Limpiar filtros" outline class="btn-clear-filters" icon="clear_all" @click="clearFilters" />
              <q-btn label="Aplicar filtros" class="btn-apply-filters" icon="check" @click="applyFilters" unelevated />
            </div> -->
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!-- Lista de usuarios en tarjetas -->
    <q-infinite-scroll ref="infiniteScrollRef" @load="loadMore" :offset="250">
      <div class="row q-col-gutter-md">
        <div v-for="(user, index) in users" :key="user.id" class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
          :style="{ animationDelay: (index * 30) + 'ms' }">
          <q-card class="user-card">
            <div class="card-number">{{ index + 1 }}</div>

            <div class="card-ribbon" :class="user.estado ? 'ribbon-active' : 'ribbon-inactive'">
              {{ user.estado ? 'ACTIVO' : 'INACTIVO' }}
            </div>

            <q-card-section class="card-header">
              <div class="avatar-container">
                <q-avatar size="80px" class="avatar-user">
                  <q-img v-if="user.persona?.fotografia" :src="host + user.persona.fotografia" />
                  <div v-else class="avatar-placeholder">
                    <q-icon name="person" size="48px" />
                  </div>
                </q-avatar>
              </div>

              <div class="user-username">
                <q-icon name="account_circle" size="20px" class="q-mr-xs" />
                {{ user.usuario }}
              </div>
              <div class="user-fullname" v-if="user.persona">
                {{ user.persona.nombres }} {{ user.persona.apellido_paterno }}
              </div>
              <div class="user-fullname" v-else>
                Sin persona asignada
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="card-body">
              <div class="info-row" v-if="user.persona?.telefono">
                <q-icon name="phone" size="18px" class="info-icon text-green-7" />
                <span class="info-label">Teléfono:</span>
                <span class="info-value">{{ user.persona.telefono }}</span>
              </div>

              <div class="info-row" v-if="user.persona?.ci">
                <q-icon name="badge" size="18px" class="info-icon text-brown-7" />
                <span class="info-label">CI:</span>
                <span class="info-value">{{ user.persona.ci }} {{ user.persona.complemento || '' }}</span>
              </div>

              <div class="info-row">
                <q-icon name="schedule" size="18px" class="info-icon text-light-green-8" />
                <span class="info-label">Último ingreso:</span>
                <span class="info-value">{{ formatDate(user.ultimo_ingreso) }}</span>
              </div>

              <div class="roles-section q-mt-md">
                <div class="roles-label">
                  <q-icon name="badge" size="16px" class="q-mr-xs" />
                  Roles
                </div>
                <div class="roles-chips">
                  <q-chip v-for="role in user.rols || []" :key="role.id" size="sm" class="role-chip" dense>
                    {{ role.nombre }}
                  </q-chip>
                  <q-chip v-if="!user.rols || user.rols.length === 0" size="sm" color="grey-5" text-color="grey-8"
                    dense>
                    Sin roles
                  </q-chip>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions class="card-actions">
              <q-btn class="btn-action btn-edit" round icon="edit" @click="showUserDialog(user)">
                <q-tooltip>Editar usuario</q-tooltip>
              </q-btn>
              <q-toggle :model-value="user.estado" @update:model-value="confirmChangeEstado(user, !user.estado)"
                :color="user.estado ? 'green-7' : 'red-6'" checked-icon="check" unchecked-icon="close" size="lg">
                <q-tooltip>
                  {{ user.estado ? 'Activo - Click para desactivar' : 'Inactivo - Click para activar' }}
                </q-tooltip>
              </q-toggle>
              <q-btn class="btn-action btn-info" round icon="info" @click="showUserInfo(user)">
                <q-tooltip>Ver detalles</q-tooltip>
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>

        <div v-if="users.length === 0 && !loading" class="col-12 text-center q-pa-xl">
          <q-icon name="search_off" size="64px" class="text-grey-5" />
          <div class="text-h6 text-grey-6 q-mt-md">No se encontraron usuarios</div>
          <div class="text-caption text-grey-5">Intenta ajustar los filtros de búsqueda</div>
        </div>
      </div>
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="green-7" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>

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
import { ref, computed, onMounted, watch } from 'vue'

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
const host = 'http://localhost:3001/uploads/'

// personaOptions (mocked). Each item should include id, nombres, apellido_*, ci, complemento
const personaOptions = ref([])
const personaCache = ref([])
const userForm = ref(null)

// Estado del componente
const dateRange = ref({ from: null, to: null })

const users = ref([])
const roles = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMoreData = ref(true)
const currentPage = ref(1)
const itemsPerPage = 10
const searchInput = ref('')
const searchTerm = ref('')
const filtersExpanded = ref(false)
const filterStatus = ref(null)
const filterTelefono = ref(null)
const filterOrden = ref(null)
const userDialog = ref(false)
const editMode = ref(false)
const usuarioTemporal = ref('')
const infiniteScrollRef = ref(null)

const currentUser = ref({ id: null, usuario: '', clave: '', id_persona: null, estado: true, roles: [] })

// Opciones para filtros
const filtroRol = ref([])
const statusOptions = [{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]


let searchTimeout = null

// Computed para contar filtros activos
const activeFiltersCount = computed(() => {
  let count = 0
  if (filtroRol.value && filtroRol.value.length > 0) count++
  if (filterStatus.value !== null) count++
  if (dateRange.value.from || dateRange.value.to) count++
  if (filterTelefono.value) count++
  if (filterOrden.value) count++
  return count
})

// Computed para estadísticas

// Función para manejar la búsqueda con debounce
const handleSearchInput = (value) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchTerm.value = value
  }, 300)
}

// Formatear fecha
const formatDate = (date) => {
  if (!date) return 'Nunca'
  const d = parseDateValue(date)
  if (!d) return 'Nunca'
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Helper: verificar usuario único
const verificarUsuario = () => {
  return users.value.some(u => u.usuario === currentUser.value.usuario && u.id !== currentUser.value.id)
}

// Filtrado para el q-select de persona (single) - Comentado porque el select está deshabilitado
// const filtrarPersonasSingle = (val, update) => {
//   const q = (val || '').toLowerCase()
//   if (!Array.isArray(personaCache.value)) { update(() => []); return }
//   const results = personaCache.value.filter(p => `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.toLowerCase().includes(q))
//   update(() => results)
// }

// Seguridad al mostrar persona seleccionada - Comentado porque el select está deshabilitado
// const getPersonaDisplay = (opt) => {
//   if (!opt) return ''
//   // si opt es un número (id), buscar en personaOptions
//   if (typeof opt === 'number' || typeof opt === 'string') {
//     const p = personaOptions.value.find(x => x.id === opt)
//     return p ? `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno}` : ''
//   }
//   // si es objeto
//   return `${opt.nombres || ''} ${opt.apellido_paterno || ''} ${opt.apellido_materno || ''}`.trim()
// }

// Watches para filtros que recargan inmediatamente
watch([filterStatus, filtroRol, filterOrden, dateRange, searchTerm], () => {
  currentPage.value = 1
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
  }
  loadUsers(1, false)
}, { deep: true })

onMounted(async () => {
  roles.value = await listarRoles()
  loadUsers()
})

// Obtener usuarios con paginación y filtros
const loadUsers = async (page = 1, append = false) => {
  try {
    if (append) loadingMore.value = true
    else {
      loading.value = true
      users.value = []
      currentPage.value = page
      hasMoreData.value = true
    }

    // Preparar parámetros de filtros
    const params = {
      estado: filterStatus.value,
      search: searchTerm.value,
      telefono: filterTelefono.value,
      orden: filterOrden.value,
      page,
      limit: itemsPerPage
    }

    // Agregar filtro de roles si hay selección
    if (Array.isArray(filtroRol.value) && filtroRol.value.length > 0) {
      params.id_rol = filtroRol.value.map(r => r.id).join(',')
    }

    // Agregar filtro de fecha si existe
    if (dateRange.value && dateRange.value.from) {
      params.fecha_desde = dateRange.value.from
    }
    if (dateRange.value && dateRange.value.to) {
      params.fecha_hasta = dateRange.value.to
    }

    console.log('Parámetros de usuarios:', params)

    const response = await listarUsuarios(params)
    console.log(response);

    if (response && Array.isArray(response)) {
      if (append && page > 1) {
        users.value.push(...response)
      } else {
        users.value = response
      }
      hasMoreData.value = response.length === itemsPerPage
      currentPage.value++
    } else {
      hasMoreData.value = false
    }
    console.log('Usuarios cargados:', users.value)
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    hasMoreData.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async (index, done) => {
  if (!hasMoreData.value || loadingMore.value) {
    done()
    return
  }
  setTimeout(async () => {
    // `index` viene desde q-infinite-scroll y representa la página a cargar.
    // Usarlo evita desincronizar `currentPage` y provoca saltos (1 → 3).
    const pageToLoad = (typeof index === 'number' && index > 0) ? index : currentPage.value
    await loadUsers(pageToLoad, true)
    done()
  }, 100)
}

// Los filtros ahora se manejan en el backend mediante loadUsers con params

// Mostrar info de usuario
const showUserInfo = (user) => {
  const personaNombre = user.persona ? `${user.persona.nombres} ${user.persona.apellido_paterno} ${user.persona.apellido_materno || ''}` : 'Sin persona asignada'
  const rolesStr = user.rols && user.rols.length > 0 ? user.rols.map(r => r.nombre).join(', ') : 'Sin roles'
  const ultimoIngreso = formatDate(user.ultimo_ingreso)

  $q.dialog({
    title: `Información de ${user.usuario}`,
    message: `
      <div style="line-height: 1.8;">
        <strong>Usuario:</strong> ${user.usuario}<br>
        <strong>Estado:</strong> ${user.estado ? 'Activo' : 'Inactivo'}<br>
        <strong>Persona:</strong> ${personaNombre}<br>
        ${user.persona?.ci ? `<strong>CI:</strong> ${user.persona.ci} ${user.persona.complemento || ''}<br>` : ''}
        ${user.persona?.telefono ? `<strong>Teléfono:</strong> ${user.persona.telefono}<br>` : ''}
        <strong>Roles:</strong> ${rolesStr}<br>
        <strong>Último ingreso:</strong> ${ultimoIngreso}
      </div>
    `,
    html: true,
    ok: {
      label: 'Cerrar',
      color: 'primary',
      flat: true
    }
  })
}

// Aplicar filtros
const applyFilters = () => {
  currentPage.value = 1
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
  }
  loadUsers(1, false)
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
  currentPage.value = 1
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
  }
  await loadUsers(1, false)
}

// Confirm change of estado with a small dialog
const confirmChangeEstado = (user, nextVal) => {
  $q.dialog({ title: 'Confirmar cambio de estado', message: `El usuario ${user.persona?.nombres || user.usuario} ${nextVal ? 'podra acceder al sistema' : 'no tendra acceso al sistema'}`, cancel: true, persistent: true }).onOk(async () => {
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

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

/* Paleta de colores verde-marrón tierra/naturaleza */
$color-forest: #2e7d32; // Verde bosque
$color-moss: #558b2f; // Verde musgo
$color-leaf: #7cb342; // Verde hoja
$color-lime: #9ccc65; // Verde lima
$color-sage: #8bc34a; // Verde salvia
$color-bark: #5d4037; // Marrón corteza
$color-wood: #795548; // Marrón madera
$color-earth: #8d6e63; // Marrón tierra
$color-clay: #a1887f; // Arcilla
$color-sand: #bcaaa4; // Arena

$pastel-mint: #c8e6c9; // Menta pastel
$pastel-lime: #dcedc8; // Lima pastel
$pastel-sage: #f1f8e9; // Salvia pastel
$pastel-sand: #efebe9; // Arena pastel
$pastel-clay: #d7ccc8; // Arcilla pastel

/* Fondo degradado tierra */
.bg-gradient {
  background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 50%, #efebe9 100%);
}

.page-container {
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Header principal */
.page-header {
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-content {
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 50%, $color-bark 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
}

.header-subtitle {
  color: #5d4037;
  font-size: 1.1em;
  margin: 8px 0 0 0;
  font-weight: 500;
}

/* Tarjetas de estadísticas */
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.stat-card {
  flex: 1;
  min-width: 180px;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-card-total {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
}

.stat-card-active {
  background: linear-gradient(135deg, $color-leaf 0%, $color-sage 100%);
  color: white;
}

.stat-card-inactive {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
}

.stat-card-roles {
  background: linear-gradient(135deg, $color-lime 0%, #c5e1a5 100%);
  color: #33691e;
}

.stat-card-recent {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
  color: white;
}

.stat-icon {
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 2.5em;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 0.85em;
  opacity: 0.95;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Toolbar */
.toolbar-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-left: 4px solid $color-forest;
}

.search-input :deep(.q-field__control) {
  transition: all 0.3s ease;
}

.search-input:hover :deep(.q-field__control) {
  border-color: $color-moss;
}

.search-input:focus-within :deep(.q-field__control) {
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}

.btn-add-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-add-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 125, 50, 0.4);
}

/* Filtros */
.filters-expansion {
  background: $pastel-sage;
  border-radius: 12px;
  border-left: 4px solid $color-moss;
}

.filters-header {
  display: flex;
  align-items: center;
  font-weight: 700;
  color: $color-forest;
  width: 100%;
}

.filters-title {
  font-size: 1.1em;
}

.filters-body {
  background: white;
  padding: 20px;
  border-radius: 0 0 12px 12px;
}

.filter-input :deep(.q-field__control) {
  transition: all 0.3s ease;
}

.filter-input:hover :deep(.q-field__control) {
  border-color: $color-moss;
}

.btn-clear-filters {
  border: 2px solid $color-earth;
  color: $color-earth;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-clear-filters:hover {
  background: $color-earth;
  color: white;
}

.btn-apply-filters {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.3);
  transition: all 0.3s ease;
}

.btn-apply-filters:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(85, 139, 47, 0.4);
}

/* Tarjetas de usuarios */
.user-card {
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  opacity: 0;
  animation: cardFadeIn 0.6s ease forwards;
  border: 2px solid $pastel-mint;
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
  }
}

.user-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: $color-leaf;
}

.card-number {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9em;
  box-shadow: 0 2px 8px rgba(93, 64, 55, 0.3);
  z-index: 10;
}

.card-ribbon {
  position: absolute;
  top: 16px;
  right: -32px;
  padding: 4px 40px;
  font-size: 0.65em;
  font-weight: 800;
  letter-spacing: 1px;
  transform: rotate(45deg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.ribbon-active {
  background: linear-gradient(135deg, $color-forest 0%, $color-leaf 100%);
  color: white;
}

.ribbon-inactive {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
}

.card-header {
  background: linear-gradient(135deg, $pastel-sage 0%, $pastel-mint 100%);
  padding: 24px 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.card-header:hover {
  background: linear-gradient(135deg, $pastel-mint 0%, $pastel-lime 100%);
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.avatar-user {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-placeholder {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.user-username {
  font-size: 1.1em;
  font-weight: 700;
  color: $color-forest;
  line-height: 1.2;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-fullname {
  font-size: 0.95em;
  font-weight: 600;
  color: $color-wood;
  line-height: 1.2;
}

.card-body {
  padding: 16px;
  background: white;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid $pastel-mint;
  transition: all 0.3s ease;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row:hover {
  background: $pastel-sage;
  padding-left: 8px;
  margin: 0 -8px;
  padding-right: 8px;
  border-radius: 8px;
}

.info-icon {
  flex-shrink: 0;
}

.info-label {
  font-size: 0.85em;
  font-weight: 600;
  color: $color-bark;
  min-width: 100px;
}

.info-value {
  font-size: 0.9em;
  font-weight: 500;
  color: #424242;
  flex: 1;
}

.roles-section {
  background: $pastel-lime;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid $color-leaf;
}

.roles-label {
  font-size: 0.85em;
  font-weight: 700;
  color: $color-forest;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.roles-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-chip {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-weight: 600;
}

.card-actions {
  background: $pastel-sand;
  padding: 12px;
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.btn-action {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-action:hover {
  transform: scale(1.15);
}

.btn-edit {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
}

.btn-edit:hover {
  box-shadow: 0 4px 12px rgba(85, 139, 47, 0.4);
}

.btn-toggle {
  background: linear-gradient(135deg, $color-wood 0%, $color-earth 100%);
  color: white;
}

.btn-toggle:hover {
  box-shadow: 0 4px 12px rgba(121, 85, 72, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, $color-lime 0%, #c5e1a5 100%);
  color: #33691e;
}

.btn-info:hover {
  box-shadow: 0 4px 12px rgba(156, 204, 101, 0.4);
}

/* Responsive */
@media (max-width: 959px) {
  .page-title {
    font-size: 2em;
  }

  .stats-container {
    flex-direction: column;
  }

  .stat-card {
    width: 100%;
  }

  .btn-add-header {
    width: 100%;
    margin-top: 12px;
  }
}

@media (max-width: 599px) {
  .page-header {
    flex-direction: column;
  }

  .page-title {
    font-size: 1.6em;
  }

  .header-subtitle {
    font-size: 0.9em;
    margin-bottom: 8px;
  }

  .header-title {
    margin-bottom: 8px;
  }

  .stat-card {
    min-width: 100%;
    padding: 16px;
  }

  .stat-number {
    font-size: 1.8em;
  }

  .card-number {
    width: 28px;
    height: 28px;
    font-size: 0.8em;
  }

  .user-username {
    font-size: 1em;
  }

  .info-label {
    min-width: 80px;
    font-size: 0.8em;
  }

  .info-value {
    font-size: 0.85em;
  }
}

/* Dark mode adaptations */
.body--dark .page-container {
  background: transparent;
}

.body--dark .toolbar-card {
  background: $grey-9;
  border-left-color: $color-forest;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

.body--dark .filters-expansion {
  background: rgba(241, 248, 233, 0.1);
}

.body--dark .filters-body {
  background: rgba(0, 0, 0, 0.3);
}

.body--dark .user-card {
  background: $grey-9;
  border-color: rgba(102, 187, 106, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.body--dark .user-card:hover {
  border-color: rgba(102, 187, 106, 0.5);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8);
}

.body--dark .card-header {
  background: linear-gradient(135deg, darken($color-forest, 25%) 0%, darken($color-moss, 20%) 100%);
}

.body--dark .card-header:hover {
  background: linear-gradient(135deg, darken($color-forest, 20%) 0%, darken($color-moss, 15%) 100%);
}

.body--dark .user-username {
  color: $color-leaf;
}

.body--dark .user-fullname {
  color: #cfd8dc;
}

.body--dark .card-body {
  background: rgba(0, 0, 0, 0.2);
}

.body--dark .info-row {
  border-bottom-color: rgba(200, 230, 201, 0.2);
}

.body--dark .info-row:hover {
  background: rgba(46, 125, 50, 0.15);
}

.body--dark .info-label {
  color: #90a4ae;
}

.body--dark .info-value {
  color: #cfd8dc;
}

.body--dark .roles-section {
  background: rgba(124, 179, 66, 0.15);
  border-left-color: rgba(124, 179, 66, 0.4);
}

.body--dark .roles-label {
  color: $color-lime;
}

.body--dark .card-actions {
  background: rgba(0, 0, 0, 0.3);
}
</style>

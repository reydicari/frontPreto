<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="header-modern">
      <q-toolbar class="toolbar-content">
        <!-- Botón menú -->
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" class="menu-btn" />

        <q-space />

        <!-- Grupo de acciones (responsivo) -->
        <div class="header-actions">
          <!-- Botones visibles en desktop -->
          <div class="desktop-actions">
            <q-btn unelevated icon="add_circle" label="Agregar Gasto" @click="showGastoDialog"
              class="action-btn gasto-btn" no-caps>
              <q-tooltip>Registrar nuevo gasto</q-tooltip>
            </q-btn>

            <q-btn unelevated icon="add_card" label="Agregar Pago" @click="showPagoDialog" class="action-btn pago-btn"
              no-caps>
              <q-tooltip>Registrar nuevo pago</q-tooltip>
            </q-btn>

            <q-select v-model="selectedRole" :options="userRoles" option-label="nombre" option-value="id"
              label="Rol Actual" dense outlined bg-color="white" class="role-select"
              :display-value="selectedRole ? selectedRole.nombre : 'Seleccionar rol'" dropdown-icon="expand_more">
              <template v-slot:prepend>
                <q-icon name="badge" />
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon name="workspace_premium" color="green-8" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-btn flat round :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" size="md" @click="toggleDarkMode"
              aria-label="Cambiar modo oscuro/claro" class="theme-btn">
              <q-tooltip>{{ $q.dark.isActive ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
            </q-btn>

            <!-- Botón de Usuario con Avatar -->
            <q-btn flat class="user-avatar-btn">
              <div class="user-btn-content">
                <q-avatar size="36px" class="user-avatar">
                  <img v-if="userData?.persona?.fotografia" :src="host + userData.persona.fotografia" />
                  <div v-else class="avatar-placeholder">
                    {{ getInitials(userData?.persona) }}
                  </div>
                </q-avatar>
                <span class="user-display-name">{{ userData?.persona?.nombres || 'Usuario' }}</span>
              </div>

              <q-menu anchor="bottom right" self="top right" transition-show="jump-down" transition-hide="jump-up"
                class="user-menu">
                <q-card class="user-profile-card">
                  <!-- Header del perfil -->
                  <q-card-section class="profile-header">
                    <q-avatar size="80px" class="profile-avatar">
                      <img v-if="userData?.persona?.fotografia" :src="host + userData.persona.fotografia" />
                      <div v-else class="avatar-placeholder-lg">
                        {{ getInitials(userData?.persona) }}
                      </div>
                    </q-avatar>
                    <div class="profile-name">
                      {{ userData?.persona?.nombres }} {{ userData?.persona?.apellido_paterno }} {{
                        userData?.persona?.apellido_materno }}
                    </div>
                    <div class="profile-username">@{{ userData?.usuario }}</div>
                    <q-badge :color="userData?.estado ? 'positive' : 'grey'" class="status-badge">
                      <q-icon :name="userData?.estado ? 'check_circle' : 'cancel'" size="14px" class="q-mr-xs" />
                      {{ userData?.estado ? 'Activo' : 'Inactivo' }}
                    </q-badge>
                  </q-card-section>

                  <q-separator />

                  <!-- Información del usuario -->
                  <q-card-section class="profile-info">
                    <div class="info-row">
                      <q-icon name="badge" size="18px" class="info-icon" />
                      <span class="info-label">CI:</span>
                      <span class="info-value">{{ userData?.persona?.ci }} {{ userData?.persona?.complemento || ''
                        }}</span>
                    </div>

                    <div class="info-row">
                      <q-icon name="phone" size="18px" class="info-icon" />
                      <span class="info-label">Teléfono:</span>
                      <span class="info-value">{{ userData?.persona?.telefono || 'N/A' }}</span>
                    </div>

                    <div class="info-row">
                      <q-icon name="cake" size="18px" class="info-icon" />
                      <span class="info-label">Nacimiento:</span>
                      <span class="info-value">{{ formatDate(userData?.persona?.fecha_nacimiento) }}</span>
                    </div>

                    <div class="info-row">
                      <q-icon name="wc" size="18px" class="info-icon" />
                      <span class="info-label">Género:</span>
                      <span class="info-value">{{ getGender(userData?.persona?.genero) }}</span>
                    </div>

                    <div class="info-row">
                      <q-icon name="schedule" size="18px" class="info-icon" />
                      <span class="info-label">Último ingreso:</span>
                      <span class="info-value">{{ formatDateTime(userData?.ultimo_ingreso) }}</span>
                    </div>

                    <div class="info-row" v-if="userData?.persona?.categoria">
                      <q-icon name="category" size="18px" class="info-icon" />
                      <span class="info-label">Categoría:</span>
                      <span class="info-value">{{ userData?.persona?.categoria }}</span>
                    </div>
                  </q-card-section>

                  <q-separator />

                  <!-- Roles del usuario -->
                  <q-card-section class="profile-roles">
                    <div class="roles-title">
                      <q-icon name="workspace_premium" size="18px" class="q-mr-xs" />
                      Roles Asignados
                    </div>
                    <div class="roles-chips">
                      <q-chip v-for="role in userData?.rols || []" :key="role.id" size="sm" color="green-7"
                        text-color="white" icon="verified">
                        {{ role.nombre }}
                      </q-chip>
                    </div>
                  </q-card-section>

                  <q-separator />

                  <!-- Acciones -->
                  <q-card-actions class="profile-actions">
                    <q-btn flat icon="logout" label="Cerrar Sesión" color="negative" @click="cerrarSesion"
                      class="logout-action-btn" no-caps />
                  </q-card-actions>
                </q-card>
              </q-menu>
            </q-btn>
          </div>

          <!-- Botones móviles (solo íconos) -->
          <div class="mobile-actions">
            <q-btn round unelevated icon="add_circle" @click="showGastoDialog" class="mobile-icon-btn gasto-btn">
              <q-tooltip>Agregar Gasto</q-tooltip>
            </q-btn>
            <q-btn round unelevated icon="add_card" @click="showPagoDialog" class="mobile-icon-btn pago-btn">
              <q-tooltip>Agregar Pago</q-tooltip>
            </q-btn>
          </div>

          <!-- Menú desplegable para móvil -->
          <q-btn flat round icon="more_vert" class="mobile-menu-btn">
            <q-menu anchor="bottom right" self="top right" transition-show="jump-down" transition-hide="jump-up">
              <q-list style="min-width: 250px">
                <!-- Perfil de usuario en móvil -->
                <q-item>
                  <q-item-section avatar>
                    <q-avatar size="40px">
                      <img v-if="userData?.persona?.fotografia" :src="host + userData.persona.fotografia" />
                      <div v-else class="avatar-placeholder-sm">
                        {{ getInitials(userData?.persona) }}
                      </div>
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ userData?.persona?.nombres }}</q-item-label>
                    <q-item-label caption>@{{ userData?.usuario }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="showGastoDialog">
                  <q-item-section avatar>
                    <q-icon name="add_circle" color="orange" />
                  </q-item-section>
                  <q-item-section>Agregar Gasto</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="showPagoDialog">
                  <q-item-section avatar>
                    <q-icon name="add_card" color="green" />
                  </q-item-section>
                  <q-item-section>Agregar Pago</q-item-section>
                </q-item>

                <q-separator />

                <q-item>
                  <q-item-section>
                    <q-select v-model="selectedRole" :options="userRoles" option-label="nombre" label="Rol Actual" dense
                      outlined class="q-mt-sm" />
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="toggleDarkMode">
                  <q-item-section avatar>
                    <q-icon :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'" color="amber-8" />
                  </q-item-section>
                  <q-item-section>{{ $q.dark.isActive ? 'Modo Claro' : 'Modo Oscuro' }}</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="cerrarSesion">
                  <q-item-section avatar>
                    <q-icon name="logout" color="red-8" />
                  </q-item-section>
                  <q-item-section>Cerrar Sesión</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above :width="280" :breakpoint="1024" class="drawer-modern">
      <!-- Header del drawer -->
      <div class="drawer-header">
        <q-img src="../assets/logo.png" class="drawer-logo" />
        <div class="drawer-title">Petroambiental</div>
        <div class="drawer-subtitle">Tarija 2025 - Todos los derechos reservados</div>
      </div>

      <q-separator class="drawer-separator" />

      <q-scroll-area class="drawer-scroll">
        <q-list class="drawer-list">
          <!-- Menú Principal -->
          <q-item clickable v-ripple v-if="tienePermiso(0)" @click="navegar('main')" class="menu-item"
            active-class="menu-item-active">
            <q-item-section avatar>
              <q-icon name="home" class="menu-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="menu-label">Menú Principal</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Área Personal -->
          <q-item clickable v-ripple v-if="tienePermiso(1)" @click="navegar('area')" class="menu-item"
            active-class="menu-item-active">
            <q-item-section avatar>
              <q-icon name="account_circle" class="menu-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="menu-label">Área Personal</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Gestión de Usuarios -->
          <q-expansion-item v-if="tieneAlguno([2, 3])" group="menu-group" icon="manage_accounts"
            label="Gestión de Usuarios" class="expansion-item" header-class="expansion-header"
            expand-icon-class="expansion-icon">
            <q-list class="submenu-list">
              <q-item v-if="tienePermiso(2)" clickable v-ripple @click="navegar('usuarios')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Usuarios</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(3)" clickable v-ripple @click="navegar('roles')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Roles</q-item-label>
                </q-item-section>
              </q-item>

              <!-- <q-item v-if="tienePermiso(3)" clickable v-ripple @click="navegar('menus')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Gestión de Menús</q-item-label>
                </q-item-section>
              </q-item> -->
            </q-list>
          </q-expansion-item>

          <!-- Inscripciones -->
          <q-item v-if="tienePermiso(4)" clickable v-ripple @click="navegar('inscripciones')" class="menu-item"
            active-class="menu-item-active">
            <q-item-section avatar>
              <q-icon name="local_activity" class="menu-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="menu-label">Inscripciones</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Paquetes -->
          <q-item v-if="tienePermiso(5)" clickable v-ripple @click="navegar('paquetes')" class="menu-item"
            active-class="menu-item-active">
            <q-item-section avatar>
              <q-icon name="inventory_2" class="menu-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="menu-label">Paquetes</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Miembros -->
          <q-expansion-item v-if="tieneAlguno([6, 7])" group="menu-group" icon="groups" label="Miembros"
            class="expansion-item" header-class="expansion-header" expand-icon-class="expansion-icon">
            <q-list class="submenu-list">
              <q-item v-if="tienePermiso(6)" clickable v-ripple @click="navegar('estudiantes')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Estudiantes</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(7)" clickable v-ripple @click="navegar('entrenadores')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Entrenadores</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <!-- Financiero -->
          <q-expansion-item v-if="tieneAlguno([8, 9])" group="menu-group" icon="account_balance_wallet"
            label="Financiero" class="expansion-item" header-class="expansion-header"
            expand-icon-class="expansion-icon">
            <q-list class="submenu-list">
              <q-item v-if="tienePermiso(8)" clickable v-ripple @click="navegar('gastos')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Gastos</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(9)" clickable v-ripple @click="navegar('pagos')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Pagos</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>



          <!-- Deportivo -->
          <q-expansion-item v-if="tieneAlguno([10, 11, 12, 13, 14])" group="menu-group" icon="sports_soccer"
            label="Deportivo" class="expansion-item" header-class="expansion-header" expand-icon-class="expansion-icon">
            <q-list class="submenu-list">
              <q-item v-if="tienePermiso(10)" clickable v-ripple @click="navegar('disciplinas')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Disciplinas</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(11)" clickable v-ripple @click="navegar('entrenamientos')"
                class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Entrenamientos</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(12)" clickable v-ripple @click="navegar('torneos')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Torneos</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(13)" clickable v-ripple @click="navegar('niveles')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Niveles</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(14)" clickable v-ripple @click="navegar('ubicaciones')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Ubicaciones</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <!-- Reportes -->
          <q-expansion-item v-if="tieneAlguno([15, 16, 17, 18, 19])" group="menu-group" icon="assessment"
            label="Reportes" class="expansion-item" header-class="expansion-header" expand-icon-class="expansion-icon">
            <q-list class="submenu-list">
              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reportePagos')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Pagos</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reporteEntrenamientos')"
                class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Entrenamientos</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reporteTorneos')"
                class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Torneos</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reporteEstudiantes')"
                class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Estudiantes</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reporteInscripciones')"
                class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Inscripciones</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reporteEntrenadores')"
                class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Entrenadores</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reportePaquetes')"
                class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Paquetes</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="tienePermiso(15)" clickable v-ripple @click="navegar('reporteGastos')" class="submenu-item">
                <q-item-section avatar>
                  <q-icon name="keyboard_double_arrow_right" class="submenu-arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="submenu-label">Reporte de Gastos</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <!-- Configuraciones -->
          <q-item v-if="tienePermiso(16)" clickable v-ripple @click="navegar('paisaje')" class="menu-item"
            active-class="menu-item-active">
            <q-item-section avatar>
              <q-icon name="settings" class="menu-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="menu-label">Configuraciones</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" />
      <router-view />
    </q-page-container>

    <!-- Dialog de Nuevo Gasto -->
    <NuevoGastoDialog v-model="dialogGasto" @saved="onGastoSaved" />

    <!-- Dialog de Nuevo Pago -->
    <NuevoPagoDialog v-model="dialogPago" @saved="onPagoSaved" />
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { refrescarUsuario } from 'src/stores/usuario-store'
import NuevoGastoDialog from 'src/pages/gastos/NuevoGastoDialog.vue'
import NuevoPagoDialog from 'src/pages/pagos/NuevoPagoDialog.vue'

const $q = useQuasar()
const router = useRouter()
const host = 'http://localhost:3001/uploads/'
const leftDrawerOpen = ref(false)
const currentUser = ref('')
const rol = ref('')
const userRoles = ref([])
const selectedRole = ref(null)
const permisosActuales = ref([])
const userData = ref(null)
const dialogGasto = ref(false)
const dialogPago = ref(false)

// Mapeo de rutas a permisos requeridos
const routePermissions = {
  '/main': 0,
  '/area': 1,
  '/usuarios': 2,
  '/roles': 3,
  '/menus': 3,
  '/inscripciones': 4,
  '/paquetes': 5,
  '/estudiantes': 6,
  '/entrenadores': 7,
  '/gastos': 8,
  '/pagos': 9,
  '/disciplinas': 10,
  '/entrenamientos': 11,
  '/torneos': 12,
  '/niveles': 13,
  '/ubicaciones': 14,
  '/reportePagos': 15,
  '/reporteEntrenamientos': 15,
  '/reporteTorneos': 15,
  '/reporteEstudiantes': 15,
  '/reporteInscripciones': 15,
  '/reporteEntrenadores': 15,
  '/reportePaquetes': 15,
  '/reporteGastos': 15,
  '/paisaje': 16
}

// Rutas ordenadas por prioridad (orden de preferencia para redirección)
const priorityRoutes = [
  { path: '/main', permission: 0 },
  { path: '/area', permission: 1 },
  { path: '/inscripciones', permission: 4 },
  { path: '/estudiantes', permission: 6 },
  { path: '/paquetes', permission: 5 },
  { path: '/entrenamientos', permission: 11 },
  { path: '/pagos', permission: 9 },
  { path: '/gastos', permission: 8 },
  { path: '/disciplinas', permission: 10 },
  { path: '/entrenadores', permission: 7 },
  { path: '/torneos', permission: 12 },
  { path: '/niveles', permission: 13 },
  { path: '/ubicaciones', permission: 14 },
  { path: '/reportePagos', permission: 15 },
  { path: '/usuarios', permission: 2 },
  { path: '/roles', permission: 3 }
]

watch(selectedRole, (newRole, oldRole) => {
  if (newRole) {
    rol.value = newRole.nombre
    actualizarPermisos(newRole)
    // Guardar el rol seleccionado en sessionStorage
    sessionStorage.setItem('selectedRoleId', newRole.id.toString())

    // Verificar si el nuevo rol tiene permiso para ver la ruta actual
    if (oldRole && router.currentRoute.value) {
      const currentPath = router.currentRoute.value.path
      const requiredPermission = routePermissions[currentPath]

      if (requiredPermission !== undefined && !tienePermiso(requiredPermission)) {
        // El nuevo rol no tiene permiso para ver esta ruta
        // Buscar la primera ruta disponible según los permisos del nuevo rol
        const firstAvailableRoute = priorityRoutes.find(route => tienePermiso(route.permission))

        if (firstAvailableRoute) {
          $q.notify({
            type: 'warning',
            message: `No tienes permisos para ver este módulo con el rol ${newRole.nombre}. Redirigiendo...`,
            position: 'top',
            timeout: 2000
          })
          setTimeout(() => {
            router.push(firstAvailableRoute.path)
          }, 500)
        } else {
          // Si no hay ninguna ruta disponible, redirigir al login
          $q.notify({
            type: 'negative',
            message: 'Este rol no tiene permisos asignados',
            position: 'top'
          })
          setTimeout(() => {
            cerrarSesion()
          }, 1500)
        }
      }
    }
  }
})

// Función para obtener iniciales
const getInitials = (persona) => {
  if (!persona) return '?'
  const nombres = persona.nombres || ''
  const apellido = persona.apellido_paterno || ''
  return (nombres.charAt(0) + apellido.charAt(0)).toUpperCase() || '?'
}

// Función para formatear fecha
const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Función para formatear fecha y hora
const formatDateTime = (datetime) => {
  if (!datetime) return 'N/A'
  const d = new Date(datetime)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para obtener género
const getGender = (genero) => {
  if (genero === 'M') return 'Masculino'
  if (genero === 'F') return 'Femenino'
  return 'N/A'
}
// Función para verificar si el rol actual tiene un permiso específico
const tienePermiso = (opcion) => {

  // Si no hay rol seleccionado o no hay permisos, denegar acceso
  if (!selectedRole.value || !selectedRole.value.permisos) return false
  // Si el rol es 1000 (admin), permitir todo

  // Obtener permisos como array
  let permisosArray = []
  // Convertir string '1,2,3' a array [1, 2, 3]
  permisosArray = selectedRole.value.permisos
    .split(',')
    .map(p => p.trim())
    .filter(p => p) // Eliminar elementos vacíos


  // Verificar si el permiso está en el array
  return permisosArray.includes(opcion.toString())
}
// Verificar si el rol actual tiene al menos uno de los permisos en el arreglo
const tieneAlguno = (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return false
  return ids.some(id => tienePermiso(id))
}
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
const refrescar = async (usu) => {
  const res = await refrescarUsuario(usu)
  userRoles.value = res.user.rols || []
  console.log('usuario refrescado: ', res.user);
  sessionStorage.setItem('user', JSON.stringify(res.user))
}
onMounted(() => {
  try {
    // Verificar primero si existe el token
    const token = sessionStorage.getItem('token')
    if (!token) {
      router.replace('/login')
      return
    }

    const current = JSON.parse(sessionStorage.getItem('user'))
    console.log('usuario actual: ', current)

    // Verificar que el usuario existe
    if (!current) {
      sessionStorage.clear()
      router.replace('/login')
      return
    }

    userData.value = current
    refrescar(current.usuario)
    currentUser.value = current.persona.nombres
    rol.value = current.persona.tipo_persona || ''

    // Cargar roles del usuario desde localStorage
    if (current.rols && current.rols.length > 0) {
      userRoles.value = current.rols

      // Intentar recuperar el rol guardado en sessionStorage
      const savedRoleId = sessionStorage.getItem('selectedRoleId')
      let rolToSelect = null

      if (savedRoleId) {
        // Buscar el rol guardado en la lista de roles del usuario
        rolToSelect = current.rols.find(rolItem => rolItem.id.toString() === savedRoleId)
      }

      // Si no hay rol guardado o no se encontró, seleccionar el rol con más permisos
      if (!rolToSelect) {
        let rolConMasPermisos = current.rols[0]
        let maxPermisos = 0

        current.rols.forEach(rolItem => {
          if (rolItem.permisos) {
            // Contar los permisos (separados por comas)
            const numPermisos = rolItem.permisos.split(',').filter(p => p.trim()).length
            if (numPermisos > maxPermisos) {
              maxPermisos = numPermisos
              rolConMasPermisos = rolItem
            }
          }
        })

        rolToSelect = rolConMasPermisos
      }

      // Establecer el rol seleccionado
      selectedRole.value = rolToSelect
      // Actualizar el rol actual
      rol.value = rolToSelect.nombre
      // Inicializar permisos
      actualizarPermisos(rolToSelect)
    }
  } catch (error) {
    console.log(error)
  }
})

// Función para actualizar los permisos basados en el rol seleccionado
const actualizarPermisos = (rol) => {
  if (!rol || !rol.permisos) {
    permisosActuales.value = []
    return
  }
  // Convertir el string de permisos a array si es necesario
  permisosActuales.value = Array.isArray(rol.permisos)
    ? rol.permisos
    : rol.permisos.split(',').map(p => p.trim())
}

// Observar cambios en el rol seleccionado
watch(selectedRole, (newRole) => {
  if (newRole) {
    rol.value = newRole.nombre
    actualizarPermisos(newRole)
  }
})

const toggleDarkMode = () => {
  $q.dark.toggle();
};

const showGastoDialog = () => {
  dialogGasto.value = true
}

const onGastoSaved = () => {
  dialogGasto.value = false
  $q.notify({
    type: 'positive',
    message: 'Gasto registrado exitosamente',
    position: 'top'
  })
}

const showPagoDialog = () => {
  dialogPago.value = true
}

const onPagoSaved = () => {
  dialogPago.value = false
  $q.notify({
    type: 'positive',
    message: 'Pago registrado exitosamente',
    position: 'top'
  })
}

const cerrarSesion = () => {
  sessionStorage.clear()
  router.replace('/login')
}

const navegar = (ruta) => {
  router.push(ruta)
}
</script>
<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

/* ===== PALETA DE COLORES VERDE BOSQUE ===== */
$color-forest-dark: #1b5e20;
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-sage: #8bc34a;
$color-bark: #5d4037;
$color-wood: #795548;

/* ===== ANIMACIONES ===== */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes wave {

  0%,
  100% {
    transform: rotate(0deg);
  }

  10%,
  30% {
    transform: rotate(-10deg);
  }

  20%,
  40% {
    transform: rotate(12deg);
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ===== HEADER ===== */
.header-modern {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 50%, $color-moss 100%);
  box-shadow: 0 4px 20px rgba(27, 94, 32, 0.3);
  animation: fadeInDown 0.6s ease;
}

.toolbar-content {
  padding: 8px 16px;
}

.menu-btn {
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(90deg) scale(1.1);
    background: rgba(255, 255, 255, 0.1);
  }
}

.toolbar-title {
  animation: fadeInLeft 0.8s ease;
}

.welcome-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
}

.animate-wave {
  animation: wave 2s ease-in-out infinite;
  display: inline-block;
}

.welcome-label {
  font-size: 1.1em;
  opacity: 0.9;
}

.user-name {
  font-size: 1.2em;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #c8e6c9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== HEADER ACTIONS ===== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  font-weight: 600;
  border-radius: 12px;
  padding: 8px 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

.gasto-btn {
  background: linear-gradient(135deg, #ef6c00 0%, #f57c00 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #f57c00 0%, #ff8f00 100%);
  }
}

.pago-btn {
  background: linear-gradient(135deg, #2e3c7d 0%, #385d8e 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #388e3c 0%, #43a047 100%);
  }
}

.role-select {
  min-width: 200px;
  background: white;
  border-radius: 12px;

  :deep(.q-field__control) {
    border-radius: 12px;
  }
}

.theme-btn {
  color: white;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: rotate(180deg);
  }
}

/* ===== BOTÓN DE USUARIO CON AVATAR ===== */
.user-avatar-btn {
  color: white;
  padding: 4px 12px;
  border-radius: 24px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.user-btn-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.avatar-placeholder {
  background: linear-gradient(135deg, $color-moss 0%, $color-leaf 100%);
  color: white;
  font-weight: 700;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.avatar-placeholder-sm {
  @extend .avatar-placeholder;
  font-size: 0.85em;
}

.avatar-placeholder-lg {
  @extend .avatar-placeholder;
  font-size: 1.8em;
}

.user-display-name {
  font-weight: 600;
  font-size: 0.95em;
  white-space: nowrap;
}

/* ===== CARD DE PERFIL DE USUARIO ===== */
.user-menu {
  margin-top: 8px;
}

.user-profile-card {
  min-width: 320px;
  max-width: 400px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  animation: fadeInDown 0.3s ease;
}

.profile-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 100%);
  color: white;
  text-align: center;
  padding: 24px 20px;
}

.profile-avatar {
  margin: 0 auto 16px;
  border: 4px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.profile-name {
  font-size: 1.2em;
  font-weight: 700;
  margin-bottom: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.profile-username {
  font-size: 0.9em;
  opacity: 0.9;
  margin-bottom: 12px;
  font-weight: 500;
}

.status-badge {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 16px;
}

.profile-info {
  padding: 20px;
  background: white;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }
}

.info-icon {
  color: $color-forest;
  flex-shrink: 0;
}

.info-label {
  font-weight: 600;
  color: #616161;
  min-width: 100px;
  font-size: 0.85em;
}

.info-value {
  font-weight: 500;
  color: #424242;
  font-size: 0.9em;
  flex: 1;
}

.profile-roles {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(200, 230, 201, 0.3) 0%, rgba(220, 237, 200, 0.2) 100%);
}

.roles-title {
  font-weight: 700;
  color: $color-forest;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.roles-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-actions {
  padding: 16px 20px;
  background: #f5f5f5;
  justify-content: center;
}

.logout-action-btn {
  width: 100%;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(198, 40, 40, 0.1);
    transform: translateY(-2px);
  }
}

.mobile-actions {
  display: none;
  align-items: center;
  gap: 8px;
}

.mobile-icon-btn {
  width: 40px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

.mobile-menu-btn {
  display: none;
  color: white;
}

/* ===== DRAWER LATERAL ===== */
.drawer-modern {
  background: linear-gradient(180deg, #f1f8e9 0%, #dcedc8 100%);
  box-shadow: 4px 0 20px rgba(27, 94, 32, 0.15);
}

.drawer-header {
  padding: 15px 24px;
  text-align: center;
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 100%);
  color: white;
  animation: fadeInDown 0.8s ease;
}

.drawer-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  animation: pulse 3s ease-in-out infinite;
}

.drawer-title {
  font-size: 1.5em;
  font-weight: 800;
  margin-bottom: 4px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.drawer-subtitle {
  font-size: 0.85em;
  opacity: 0.9;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.drawer-separator {
  background: linear-gradient(90deg, transparent 0%, $color-forest 50%, transparent 100%);
  height: 2px;
}

.drawer-scroll {
  height: calc(100vh - 200px);
}

.drawer-list {
  padding: 16px 8px;
}

/* ===== ITEMS DEL MENÚ ===== */
.menu-item {
  border-radius: 12px;
  margin: 4px 8px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(85, 139, 47, 0.1) 100%);
    transform: translateX(8px);
    box-shadow: 0 2px 8px rgba(27, 94, 32, 0.15);
  }
}

.menu-item-active {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);

  .menu-icon,
  .menu-label {
    color: white !important;
  }
}

.menu-icon {
  color: $color-forest;
  font-size: 24px;
  transition: all 0.3s ease;
}

.menu-label {
  font-weight: 600;
  font-size: 0.95em;
  color: #424242;
}

/* ===== EXPANSION ITEMS ===== */
.expansion-item {
  margin: 8px 8px;
  border-radius: 12px;
  overflow: hidden;
  animation: slideIn 0.5s ease;

  :deep(.q-item) {
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(85, 139, 47, 0.1) 100%);
    }
  }
}

.expansion-header {
  color: $color-forest;
  font-weight: 700;
  padding: 12px 16px;

  :deep(.q-icon) {
    color: $color-forest;
    font-size: 24px;
  }
}

.expansion-icon {
  color: $color-forest;
}

.submenu-list {
  background: linear-gradient(135deg, rgba(200, 230, 201, 0.4) 0%, rgba(220, 237, 200, 0.3) 100%);
  padding: 8px 0;
}

.submenu-item {
  margin: 2px 16px;
  padding: 10px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.2) 0%, rgba(85, 139, 47, 0.15) 100%);
    transform: translateX(6px);
    box-shadow: 0 2px 6px rgba(27, 94, 32, 0.1);
  }
}

.submenu-arrow {
  color: $color-moss;
  font-size: 18px;
}

.submenu-label {
  font-weight: 500;
  font-size: 0.9em;
  color: #424242;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .desktop-actions {
    display: none;
  }

  .mobile-actions {
    display: flex;
  }

  .mobile-menu-btn {
    display: block;
  }
}

@media (max-width: 768px) {
  .welcome-text {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .welcome-label {
    font-size: 0.9em;
  }

  .user-name {
    font-size: 1em;
  }

  .drawer-header {
    padding: 24px 16px;
  }

  .drawer-logo {
    width: 60px;
    height: 60px;
  }

  .drawer-title {
    font-size: 1.2em;
  }
}

@media (max-width: 599px) {
  .toolbar-content {
    padding: 8px 12px;
  }

  .welcome-label {
    display: none;
  }

  .menu-label {
    font-size: 0.85em;
  }

  .submenu-label {
    font-size: 0.8em;
  }
}

/* ===== DARK MODE ===== */
.body--dark {
  .header-modern {
    background: linear-gradient(135deg, darken($color-forest-dark, 10%) 0%, darken($color-forest, 8%) 50%, darken($color-moss, 5%) 100%);
  }

  .drawer-modern {
    background: $grey-9;
  }

  .drawer-header {
    background: linear-gradient(135deg, darken($color-forest-dark, 15%) 0%, darken($color-forest, 12%) 100%);
  }

  .drawer-separator {
    background: linear-gradient(90deg, transparent 0%, rgba(124, 179, 66, 0.3) 50%, transparent 100%);
  }

  .menu-item:hover {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.25) 0%, rgba(85, 139, 47, 0.2) 100%);
  }

  .menu-label {
    color: #e0e0e0;
  }

  .submenu-list {
    background: rgba(46, 125, 50, 0.15);
  }

  .submenu-label {
    color: #cfd8dc;
  }

  .expansion-header {
    color: $color-lime;

    :deep(.q-icon) {
      color: $color-lime;
    }
  }

  /* Adaptaciones para el perfil de usuario en modo oscuro */
  .user-avatar-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .user-profile-card {
    background: $grey-9;
    border: 1px solid rgba(124, 179, 66, 0.3);
  }

  .profile-info {
    background: $grey-9;
  }

  .info-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .info-label {
    color: #b0bec5;
  }

  .info-value {
    color: #eceff1;
  }

  .profile-roles {
    background: linear-gradient(135deg, rgba(85, 139, 47, 0.2) 0%, rgba(124, 179, 66, 0.15) 100%);
  }

  .roles-title {
    color: $color-lime;
  }

  .profile-actions {
    background: darken($grey-9, 2%);
  }

  .logout-action-btn:hover {
    background: rgba(198, 40, 40, 0.2);
  }
}
</style>

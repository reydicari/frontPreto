<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          Bienvenido {{ currentUser }}
        </q-toolbar-title>
        <q-btn class="q-mr-md" color="info" label="Agregar gasto" @click="showGastoDialog">
        </q-btn>
        <q-select v-model="selectedRole" :options="userRoles" option-label="nombre" option-value="id" label="Rol actual"
          dense filled bg-color="white" color="primary" text-color="dark" style="min-width: 200px; margin-right: 15px;"
          class="q-mr-md" :display-value="selectedRole ? selectedRole.nombre : 'Seleccionar rol'"
          dropdown-icon="expand_more">
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.nombre }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-btn flat round :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" size="lg" @click="toggleDarkMode"
          aria-label="Cambiar modo oscuro/claro" class="light-mode" />
        <div>
          <q-btn color="negative" label="Cerrar sesion" @click="cerrarSesion">
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>
          Petroambiental
          <q-img src="../assets/logo.png" style="max-width: 50px; margin: 0 auto;"></q-img>
        </q-item-label>

        <q-list bordered>
          <q-item clickable v-ripple v-if="tienePermiso(0)" @click="navegar('main')">
            <q-item-section avatar>
              <q-icon color="primary" name="home" />
            </q-item-section>
            <q-item-section>Menu principal</q-item-section>
          </q-item>
          <q-item clickable v-ripple v-if="tienePermiso(1)" @click="navegar('inicio')">
            <q-item-section avatar>
              <q-icon color="primary" name="account_circle" />
            </q-item-section>
            <q-item-section>Area personal</q-item-section>
          </q-item>

          <div v-if="tieneAlguno([2, 3])">
            <q-list bordered>
              <q-expansion-item group="somegroup" icon="person" class="" label="Gestion de usuarios"
                header-class="text-primary">
                <q-list class="bg-grey-7">
                  <q-item clickable v-close-popup v-if="tienePermiso(2)" @click="navegar('usuarios')">
                    <q-item-section>
                      <q-item-label class="secondary_item">
                        <q-icon name="keyboard_double_arrow_right" class="q-mr-sm" />Usuarios
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item clickable v-close-popup v-if="tienePermiso(3)" @click="navegar('roles')">
                    <q-item-section>
                      <q-item-label class="secondary_item">
                        <q-icon name="keyboard_double_arrow_right" class="q-mr-sm" />Roles
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
          </div>

          <q-item clickable v-ripple v-if="tienePermiso(4)" @click="navegar('inscripciones')">
            <q-item-section avatar>
              <q-icon color="primary" name="local_activity" />
            </q-item-section>
            <q-item-section>Inscripciones</q-item-section>
          </q-item>

          <q-item clickable v-if="tienePermiso(5)" v-ripple @click="navegar('paquetes')">
            <q-item-section avatar>
              <q-icon color="primary" name="square" />
            </q-item-section>
            <q-item-section>Paquetes</q-item-section>
          </q-item>

          <div v-if="tieneAlguno([6, 7])">
            <q-list bordered>
              <q-expansion-item group="somegroup" icon="groups" class="" label="Miembros" header-class="text-primary">
                <q-list class="bg-grey-7">
                  <q-item clickable v-ripple v-if="tienePermiso(6)" @click="navegar('estudiantes')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="keyboard_double_arrow_right" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Estudiantes</q-item-section>
                  </q-item>

                  <q-item clickable v-if="tienePermiso(7)" v-ripple @click="navegar('entrenadores')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="hail" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Entrenadores</q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
          </div>

          <div v-if="tieneAlguno([8, 9])">
            <q-list bordered>
              <q-expansion-item group="somegroup" icon="groups" class="" label="Financiero" header-class="text-primary">
                <q-list class="bg-grey-7">
                  <q-item clickable v-if="tienePermiso(8)" v-ripple @click="navegar('gastos')">
                    <q-item-section avatar>
                      <q-icon color="primary" name="request_quote" />
                    </q-item-section>
                    <q-item-section>Gastos</q-item-section>
                  </q-item>

                  <q-item clickable v-if="tienePermiso(9)" v-ripple @click="navegar('pagos')">
                    <q-item-section avatar>
                      <q-icon color="primary" name="text_snippet" />
                    </q-item-section>
                    <q-item-section>Pagos</q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
          </div>



          <div v-if="tieneAlguno([10, 11, 12, 13, 14])">
            <q-list bordered>
              <q-expansion-item group="somegroup" icon="person" class="" label="Deportivo" header-class="text-primary">
                <q-list class="bg-grey-7">
                  <q-item clickable v-if="tienePermiso(10)" v-ripple @click="navegar('disciplinas')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="menu_book" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Disciplinas</q-item-section>
                  </q-item>


                  <q-item clickable v-if="tienePermiso(11)" v-ripple @click="navegar('entrenamientos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="event_available" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Entrenamientos</q-item-section>
                  </q-item>
                  <q-item clickable v-if="tienePermiso(12)" v-ripple @click="navegar('torneos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="emoji_events" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Torneos</q-item-section>
                  </q-item>

                  <q-item clickable v-if="tienePermiso(13)" v-ripple @click="navegar('niveles')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="emoji_events" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Niveles</q-item-section>
                  </q-item>
                  <q-item clickable v-if="tienePermiso(14)" v-ripple @click="navegar('ubicaciones')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="location_on" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Ubicaciones</q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
          </div>

          <div v-if="tieneAlguno([15, 16, 17, 18, 19])">
            <q-list bordered>
              <q-expansion-item group="somegroup" icon="person" class="" label="Reportes" header-class="text-primary">
                <q-list class="bg-grey-7">
                  <q-item clickable v-if="tienePermiso(15)" v-ripple @click="navegar('reportePagos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="menu_book" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Reporte de pagos</q-item-section>
                  </q-item>


                  <q-item clickable v-if="tienePermiso(15)" v-ripple @click="navegar('reporteEntrenamientos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="event_available" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Reporte de entrenamientos</q-item-section>
                  </q-item>
                  <q-item clickable v-if="tienePermiso(15)" v-ripple @click="navegar('reporteTorneos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="emoji_events" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section> Reporte de Torneos</q-item-section>
                  </q-item>

                  <q-item clickable v-if="tienePermiso(14)" v-ripple @click="navegar('reporteGastos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="location_on" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Reporte de Gastos</q-item-section>
                  </q-item>
                  <q-item clickable v-if="tienePermiso(14)" v-ripple @click="navegar('reporteGastos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="location_on" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Reporte de Inscripciones</q-item-section>
                  </q-item>
                  <q-item clickable v-if="tienePermiso(14)" v-ripple @click="navegar('reporteGastos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="location_on" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Reporte de Miembros</q-item-section>
                  </q-item>
                  <q-item clickable v-if="tienePermiso(14)" v-ripple @click="navegar('reporteGastos')">
                    <q-item-section avatar>
                      <q-item-label class="secondary_item">
                        <q-icon color="light" name="location_on" />
                      </q-item-label>
                    </q-item-section>
                    <q-item-section>Reporte de Gastos</q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
          </div>

          <!-- <q-item clickable v-if="tienePermiso(15)" v-ripple @click="navegar('reportes')">
            <q-item-section avatar>
              <q-icon color="primary" name="auto_stories" />
            </q-item-section>
            <q-item-section>Reportes</q-item-section>
          </q-item> -->

          <q-item clickable v-if="tienePermiso(16)" v-ripple @click="navegar('paisaje')">
            <q-item-section avatar>
              <q-icon color="primary" name="settings" />
            </q-item-section>
            <q-item-section>Configuraciones</q-item-section>
          </q-item>
        </q-list>
      </q-list>
    </q-drawer>

    <q-page-container>
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" />
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { refrescarUsuario } from 'src/stores/usuario-store'

const $q = useQuasar()
const router = useRouter()
const leftDrawerOpen = ref(false)
const currentUser = ref('')
const rol = ref('')
const userRoles = ref([])
const selectedRole = ref(null)
const permisosActuales = ref([])

watch(selectedRole, (newRole) => {
  if (newRole) {
    rol.value = newRole.nombre
    actualizarPermisos(newRole)
  }
})
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
    const current = JSON.parse(sessionStorage.getItem('user'))
    console.log('usuario actual: ', current)
    refrescar(current.usuario)
    const token = sessionStorage.getItem('token')
    if (!token) router.replace('/login')
    currentUser.value = current.persona.nombres
    rol.value = current.persona.tipo_persona

    // Cargar roles del usuario desde localStorage
    if (current.rols && current.rols.length > 0) {
      userRoles.value = current.rols
      // Establecer el primer rol como seleccionado por defecto
      selectedRole.value = current.rols[0]
      // Actualizar el rol actual
      rol.value = current.rols[0].nombre
      // Inicializar permisos
      actualizarPermisos(current.rols[0])
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
const cerrarSesion = () => {
  sessionStorage.clear()
  router.replace('/login')
}

const navegar = (ruta) => {
  router.push(ruta)
}
</script>
<style>
.secondary_item {
  padding-left: 20px !important;
}

q-item:hover {
  background-color: blue !important;
}
</style>

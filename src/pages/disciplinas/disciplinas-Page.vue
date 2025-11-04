<template>
  <q-page class="q-pa-md" :class="$q.dark.isActive ? '' : 'bg-grey-4'">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="page-title q-ma-none ">Gestión de disciplinas</h4>
        <p class="text-grey-7">Administra disciplinas, para los paquetes</p>
      </div>

      <div class="col">
        <q-card>
          <q-card-section>
            <q-select label="Ver por estados" emit-value map-options dense outlined hide-dropdown-icon
              v-model="filterStatus" :options="statusOptions" option-label="label" option-value="value"
              style="min-width:170px" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Formulario estático (izquierda) -->
      <div class="col-12 col-md-5">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-sm">{{ editing ? 'Editar disciplina' : 'Nueva disciplina' }}</div>

            <q-form ref="formRef" @submit.prevent="onSubmit">
              <q-input v-model="form.nombre" label="Nombre" outlined dense :rules="[val => !!val || 'Requerido']"
                hint="Nombre corto" autofocus />

              <div class="q-mt-sm">
                <div class="text-subtitle2 q-mb-xs">Icono</div>
                <div class="row q-col-gutter-sm">
                  <q-btn v-for="icon in iconOptions" :key="icon" :flat="form.icono !== icon"
                    :unelevated="form.icono === icon" dense round :color="form.icono === icon ? 'primary' : undefined"
                    :class="{ 'icon-selected': form.icono === icon }" @click.prevent="form.icono = icon">
                    <q-icon :name="icon" />
                  </q-btn>
                </div>
                <div class="text-caption q-mt-xs">Selecciona un icono (se guardará el nombre en <code>icono</code>).
                </div>
              </div>

              <div class="q-mt-sm">
                <q-toggle v-model="form.estado" label="Activo" />
              </div>

              <div class="row justify-end q-mt-md">
                <q-btn flat label="Limpiar" color="secondary" @click="resetForm" />
                <q-btn :color="editing ? 'info' : 'primary'" :label="editing ? 'Actualizar' : 'Guardar'" class="q-ml-sm"
                  @click="onSubmit" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista (derecha) -->
      <div class="col-12 col-md-7">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-6">
            <q-card class="bg-primary text-white text-center">
              <q-card-section>
                <q-icon name="sports_soccer" size="md" />
                <div class="text-h6 q-mt-sm">{{ activeCount }}</div>
                <div class="text-caption">Disciplinas Activas</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <q-card class="bg-secondary text-white text-center">
              <q-card-section>
                <q-icon name="groups" size="md" />
                <div class="text-h6 q-mt-sm">{{ totalStudents }}</div>
                <div class="text-caption">Total estudiantes</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-gutter-y-md">
          <q-card v-for="discipline in filteredDisciplines" :key="discipline.id"
            class="discipline-card row items-center q-pa-sm q-ma-xs">
            <div class="row items-center no-wrap" style="width:100%">
              <div class="col-auto">
                <q-avatar size="56px">
                  <q-icon :name="discipline.icono || 'sports'" size="lg" color="primary" />
                </q-avatar>
              </div>

              <div class="col" @click="viewDiscipline(discipline.id)">
                <div class="text-h6 text-primary">
                  {{ discipline.nombre }}
                  <span class="text-caption text-grey q-ml-sm">Estudiantes: ({{ countStudents(discipline) }})</span>
                </div>
              </div>

              <div class="col-auto row items-center q-gutter-sm">
                <q-badge :color="discipline.estado ? 'positive' : 'grey'"
                  :label="discipline.estado ? 'Activo' : 'Inactivo'" />
                <q-btn dense round flat icon="edit" title="Editar" @click.stop="editDiscipline(discipline)" />

                <q-toggle dense :model-value="discipline.estado" @update:model-value="confirmToggle(discipline, $event)"
                  @click.stop label="" />

                <div class="q-ml-sm text-caption">Estudiantes: <strong>{{ countStudents(discipline) }}</strong></div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { agregarDisciplina, cambiarEstado, listarDisciplinas, modificarDisciplina } from 'src/stores/disciplina-store';
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const router = useRouter();
const $q = useQuasar();

const editing = ref(false);
const form = ref({ id: null, nombre: '', icono: '', estado: true });
const formRef = ref(null)
const inscripciones = ref([])

// filtro de estado en el header
// filtro de estado en el header
// usamos valores booleanos (true/false) para coincidir con d.estado; null = todos
const filterStatus = ref(null)
const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false }
]

const disciplines = ref([]);

const filteredDisciplines = computed(() => {
  if (!disciplines.value) return []
  // null => todos
  if (filterStatus.value === null) return disciplines.value
  // comparar booleans (asegurando coerción)
  return disciplines.value.filter(d => Boolean(d.estado) === filterStatus.value)
})

const totalStudents = computed(() => inscripciones.value.length)

const countStudents = (discipline) => {
  if (!discipline || !discipline.id) return 0
  const id = discipline.id
  return inscripciones.value.filter(ins => {
    // varios posibles campos donde la disciplina puede estar referenciada
    if (!ins) return false
    // direct field typos
    if (ins.id_disciplina && Number(ins.id_disciplina) === Number(id)) return true
    if (ins.id_diciplina && Number(ins.id_diciplina) === Number(id)) return true
    // nested disciplina in paquete
    if (ins.paquete && ins.paquete.disciplina) {
      const pd = ins.paquete.disciplina
      if ((pd.id && Number(pd.id) === Number(id)) || (pd === id)) return true
    }
    // nested disciplina object
    if (ins.disciplina) {
      const d = ins.disciplina
      if ((d.id && Number(d.id) === Number(id)) || (d === id)) return true
    }
    return false
  }).length
}

const iconOptions = ['sports_soccer', 'pool', 'fitness_center', 'self_improvement', 'sports_tennis', 'sports_basketball'];

const activeCount = computed(() => disciplines.value.filter(d => d.estado).length);

const resetForm = () => {
  editing.value = false;
  form.value = { id: null, nombre: '', icono: '', estado: true };
}

const onSubmit = async () => {
  // validar formulario (q-form)
  if (formRef.value && formRef.value.validate) {
    const ok = await formRef.value.validate()
    if (!ok) {
      // mínima validación falla
      return
    }
  } else {
    if (!form.value.nombre) return
  }

  if (editing.value && form.value.id != null) {
    console.log('modificando: ', form.value);
    await modificarDisciplina(form.value);
    disciplines.value = await listarDisciplinas();

  } else {
    console.log('creando: ', form.value);
    await agregarDisciplina(form.value);
    disciplines.value = await listarDisciplinas();

  }

  resetForm();
}

const editDiscipline = (discipline) => {
  editing.value = true;
  form.value = { id: discipline.id, nombre: discipline.nombre, icono: discipline.icono || '', estado: !!discipline.estado };
  // scroll to top of form on small screens
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const confirmToggle = (discipline, newVal) => {
  const title = newVal ? 'Activar disciplina' : 'Desactivar disciplina'
  const message = newVal ? `¿Desea activar "${discipline.nombre}"?` : `¿Desea desactivar "${discipline.nombre}"?`
  const dlg = $q.dialog({ title, message, cancel: true, persistent: true })
  dlg.onOk(async () => {
    discipline.estado = newVal
    await cambiarEstado({ id: discipline.id, nuevoEstado: newVal })
  })
  dlg.onCancel(() => {
    // si cancela, no hacemos nada (el toggle no cambiará porque usamos model-value controlado)
  })
}

const viewDiscipline = (id) => {
  router.push(`/disciplines/${id}`);
}

onMounted(async () => {
  disciplines.value = await listarDisciplinas();
});
</script>

<style scoped>
.discipline-card {
  transition: transform 0.12s, box-shadow 0.12s;
}

.discipline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
</style>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

.icon-selected {
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.18);
  border: 1px solid rgba(33, 150, 243, 0.22);
}

.page-title {
  border-left: 6px solid $orange-8;
  padding-left: 12px;
  color: $primary;
  font-size: 2.2em;
  font-weight: 800;
  line-height: 1.2;
}
</style>

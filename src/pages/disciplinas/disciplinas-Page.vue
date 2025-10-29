<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h4 class="text-primary q-mb-xs">Gestión de disciplinas</h4>
        <p class="text-grey-7">Administra disciplinas, horarios y actividades</p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Formulario estático (izquierda) -->
      <div class="col-12 col-md-5">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-sm">{{ editing ? 'Editar disciplina' : 'Nueva disciplina' }}</div>

            <q-form @submit.prevent="onSubmit">
              <q-input v-model="form.nombre" label="Nombre" outlined dense :rules="[val => !!val || 'Requerido']"
                hint="Nombre corto" />

              <div class="q-mt-sm">
                <div class="text-subtitle2 q-mb-xs">Icono</div>
                <div class="row q-col-gutter-sm">
                  <q-btn v-for="icon in iconOptions" :key="icon" flat dense round :outline="form.icono !== icon"
                    @click.prevent="form.icono = icon">
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
                <q-btn color="primary" label="Guardar" class="q-ml-sm" @click="onSubmit" />
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
                <div class="text-h6 q-mt-sm">{{ 50 }}</div>
                <div class="text-caption">Total estudiantes</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-gutter-y-md">
          <q-card v-for="discipline in disciplines" :key="discipline.id"
            class="discipline-card row items-center q-pa-sm">
            <div class="row items-center no-wrap" style="width:100%">
              <div class="col-auto">
                <q-avatar size="56px">
                  <q-icon :name="discipline.icono || 'sports'" size="lg" color="primary" />
                </q-avatar>
              </div>

              <div class="col" @click="viewDiscipline(discipline.id)">
                <div class="text-h6 text-primary">{{ discipline.nombre }}</div>
              </div>

              <div class="col-auto row items-center q-gutter-sm">
                <q-badge :color="discipline.estado ? 'positive' : 'grey'"
                  :label="discipline.estado ? 'Activo' : 'Inactivo'" />
                <q-btn dense round flat icon="edit" title="Editar" @click.stop="editDiscipline(discipline)" />
                <q-btn dense round flat :icon="discipline.estado ? 'toggle_on' : 'toggle_off'"
                  :title="discipline.estado ? 'Desactivar' : 'Activar'" @click.stop="toggleEstado(discipline)" />
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const editing = ref(false);
const form = ref({ id: null, nombre: '', icono: '', estado: true });

// Datos de ejemplo
const disciplines = ref([
  { id: 1, nombre: 'Fútbol', estado: true, icono: 'sports_soccer' },
  { id: 2, nombre: 'Natación', estado: true, icono: 'pool' }
]);

const iconOptions = ['sports_soccer', 'pool', 'fitness_center', 'self_improvement', 'sports_tennis', 'sports_basketball'];

const activeCount = computed(() => disciplines.value.filter(d => d.estado).length);

const resetForm = () => {
  editing.value = false;
  form.value = { id: null, nombre: '', icono: '', estado: true };
}

const onSubmit = () => {
  if (!form.value.nombre) {
    // mínima validación
    return;
  }

  if (editing.value && form.value.id != null) {
    const idx = disciplines.value.findIndex(d => d.id === form.value.id);
    if (idx !== -1) {
      disciplines.value[idx] = { ...disciplines.value[idx], ...form.value };
    }
  } else {
    const nextId = disciplines.value.length ? Math.max(...disciplines.value.map(d => d.id)) + 1 : 1;
    disciplines.value.push({ id: nextId, nombre: form.value.nombre, icono: form.value.icono, estado: form.value.estado });
  }

  resetForm();
}

const editDiscipline = (discipline) => {
  editing.value = true;
  form.value = { id: discipline.id, nombre: discipline.nombre, icono: discipline.icono || '', estado: !!discipline.estado };
  // scroll to top of form on small screens
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const toggleEstado = (discipline) => {
  discipline.estado = !discipline.estado;
  // Aquí puedes persistir el cambio en el backend si lo deseas.
}

const viewDiscipline = (id) => {
  router.push(`/disciplines/${id}`);
}

onMounted(() => {
  // cargar disciplinas desde API si se desea
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
.discipline-card {

transition: transform 0.12s, box-shadow 0.12s;

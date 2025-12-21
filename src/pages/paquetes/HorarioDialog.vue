<template>
    <q-dialog v-model="isOpen" persistent>
        <q-card style="min-width: 400px; max-width: 500px;">
            <q-card-section class="dialog-header">
                <div class="text-h6">
                    <q-icon name="schedule" class="q-mr-sm" />
                    {{ isEditing ? 'Editar Horario' : 'Agregar Horario' }}
                </div>
            </q-card-section>

            <q-card-section>
                <div class="row q-col-gutter-sm">
                    <q-select class="col-12" v-model.number="form.dia" :options="diasOptions" option-label="label"
                        option-value="value" dense emit-value map-options outlined label="Día de la semana">
                        <template v-slot:prepend>
                            <q-icon name="calendar_today" />
                        </template>
                    </q-select>

                    <q-input class="col-6" v-model="form.hora_inicio" label="Hora inicio" type="time" dense outlined>
                        <template v-slot:prepend>
                            <q-icon name="access_time" />
                        </template>
                    </q-input>

                    <q-input class="col-6" v-model="form.hora_fin" label="Hora fin" type="time" dense outlined>
                        <template v-slot:prepend>
                            <q-icon name="access_time" />
                        </template>
                    </q-input>

                    <q-toggle class="col-12" v-model="form.estado" label="Activo" color="green-7" />
                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn v-if="isEditing && canRemove" flat label="Eliminar" color="negative" icon="delete"
                    @click="remove" />
                <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
                <q-btn unelevated label="Guardar" color="green-7" icon="save" @click="save" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    horario: Object,
    diasOptions: {
        type: Array,
        default: () => [
            { label: 'Lunes', value: 1 },
            { label: 'Martes', value: 2 },
            { label: 'Miércoles', value: 3 },
            { label: 'Jueves', value: 4 },
            { label: 'Viernes', value: 5 },
            { label: 'Sábado', value: 6 },
            { label: 'Domingo', value: 7 }
        ]
    }
})

const emit = defineEmits(['save', 'remove', 'update:modelValue'])

const form = ref({
    id: null,
    dia: 1,
    hora_inicio: '08:00',
    hora_fin: '09:00',
    estado: true
})

const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const isEditing = computed(() => props.horario && props.horario.id && props.horario.id > 1000)

const canRemove = computed(() => isEditing.value)

watch(() => props.horario, (newVal) => {
    if (newVal) {
        form.value = JSON.parse(JSON.stringify(newVal))
    } else {
        form.value = {
            id: Date.now(),
            dia: 1,
            hora_inicio: '08:00',
            hora_fin: '09:00',
            estado: true
        }
    }
}, { immediate: true })

const save = () => {
    emit('save', JSON.parse(JSON.stringify(form.value)))
}

const remove = () => {
    emit('remove', JSON.parse(JSON.stringify(form.value)))
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

$color-primary-green: #2e7d32;
$color-green-medium: #43a047;

.dialog-header {
    background: linear-gradient(135deg, $color-primary-green 0%, $color-green-medium 100%);
    color: white;
}

.body--dark .dialog-header {
    background: linear-gradient(135deg, darken($color-primary-green, 10%) 0%, darken($color-green-medium, 10%) 100%);
}
</style>

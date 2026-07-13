<template>
    <q-dialog v-model="modelLocal" persistent>
        <q-card class="confirm-dialog-card" style="min-width:320px; max-width:600px;">
            <q-card-section :class="['confirm-header', danger ? 'confirm-danger' : 'confirm-primary']">
                <div class="confirm-header-content">
                    <q-icon :name="danger ? 'warning' : 'help_outline'" size="28px" />
                    <div>
                        <div class="confirm-title">{{ title }}</div>
                    </div>
                </div>
                <q-btn flat round dense icon="close" color="white" @click="onCancel" />
            </q-card-section>

            <q-card-section class="confirm-body">
                <slot>
                    <div v-if="message">{{ message }}</div>
                </slot>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right" class="confirm-actions">
                <q-btn flat label="Cancelar" color="grey-7" @click="onCancel" />
                <q-btn unelevated :label="confirmLabel" :color="danger ? 'negative' : 'primary'" text-color="white"
                    @click="onConfirm" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: 'Confirmar' },
    message: { type: String, default: '' },
    danger: { type: Boolean, default: false },
    confirmLabel: { type: String, default: 'Confirmar' }
})

const emit = defineEmits(['update:modelValue', 'confirmed'])
const modelLocal = ref(props.modelValue)

watch(() => props.modelValue, v => modelLocal.value = v)
watch(modelLocal, v => emit('update:modelValue', v))

const onConfirm = () => {
    modelLocal.value = false
    emit('confirmed', 'confirm')
}

const onCancel = () => {
    modelLocal.value = false
    emit('confirmed', 'cancel')
}
</script>

<style scoped>
.confirm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
    padding: 14px 16px;
}

.confirm-header-content {
    display: flex;
    gap: 12px;
    align-items: center;
}

.confirm-title {
    font-weight: 800;
    font-size: 1.05rem;
}

.confirm-primary {
    background: linear-gradient(135deg, #2e7d32 0%, #558b2f 100%);
}

.confirm-danger {
    background: linear-gradient(135deg, #b71c1c 0%, #f44336 100%);
}

.confirm-body {
    padding: 18px;
    background: white;
}

.confirm-actions {
    padding: 12px 16px;
    background: #f6f6f6;
}
</style>

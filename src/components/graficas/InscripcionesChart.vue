<template>
  <div ref="chartContainer" style="width: 100%; height: 100%;"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const chartContainer = ref(null)

onMounted(() => {
  const chart = echarts.init(chartContainer.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Inscripciones']
    },
    xAxis: {
      type: 'category',
      data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: 'Inscripciones',
      type: 'bar',
      data: [12, 19, 15, 22, 18, 25],
      itemStyle: {
        color: '#1976D2'
      }
    }]
  }

  chart.setOption(option)

  // Ajustar tamaño al cambiar la ventana
  window.addEventListener('resize', () => chart.resize())
})
</script>

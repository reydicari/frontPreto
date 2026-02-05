import { api } from "boot/axios.js";
const URL_PART = "/api/auth";
export const loguear = async (dataform) => {
  try {
    console.log("logueando a: ", dataform);
    const response = await api.post(URL_PART + "/login", dataform, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    console.log("error en el store", error.response.data.error);
    return error.response.data;
  }
};

export const obtenerEstadisticasDashboard = async () => {
  try {
    const response = await api.get(URL_PART + "/estadisticasDashboard");
    return response.data;
  } catch (error) {
    console.log(
      "error en el store",
      error.response?.data?.error || error.message,
    );
    // Datos de prueba para desarrollo
    return {
      // ========== ESTADÍSTICAS PARA LAS 5 TARJETAS PRINCIPALES ==========
      estadisticas: {
        totalEstudiantes: 279, // (Total de estudiantes activos en el sistema)
        estudiantesTrend: "+12%", // (Tendencia comparada con el mes anterior: puede ser "+X%" o "-X%")
        totalEntrenadores: 15, // (Total de entrenadores activos en el sistema)
        entrenadoresTrend: "+2", // (Tendencia comparada con el mes anterior: puede ser "+X" o "-X")
        inscripcionesActivas: 145, // (Total de inscripciones vigentes/activas)
        inscripcionesTrend: "-5%", // (Tendencia comparada con el mes anterior: puede ser "+X%" o "-X%")
        entrenamientosDelMes: 48, // (Total de entrenamientos realizados en el mes actual)
        entrenamientosTrend: "+8%", // (Tendencia comparada con el mes anterior: puede ser "+X%" o "-X%")
        ingresosDelMes: 12450, // (Total de ingresos/pagos en bolivianos del mes actual - solo el número)
        ingresosTrend: "+15%", // (Tendencia comparada con el mes anterior: puede ser "+X%" o "-X%")
      },

      // ========== DATOS PARA GRÁFICA DE BARRAS (Inscripciones últimos 6 meses) ==========
      inscripciones: {
        meses: [
          // (Array con los nombres de los últimos 6 meses)
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
          "Enero",
        ],
        valores: [45, 52, 48, 65, 58, 72], // (Array con la cantidad de inscripciones de cada mes - debe coincidir en orden y cantidad con el array de meses)
      },

      // ========== DATOS PARA GRÁFICA CIRCULAR (Estudiantes por disciplina) ==========
      disciplinas: [
        // (Array de objetos con cada disciplina y su cantidad de estudiantes)
        {
          nombre: "Fútbol", // (Nombre de la disciplina)
          cantidad: 85, // (Número de estudiantes inscritos en esta disciplina)
        },
        {
          nombre: "Natación",
          cantidad: 65,
        },
        {
          nombre: "Baloncesto",
          cantidad: 45,
        },
        {
          nombre: "Tenis",
          cantidad: 30,
        },
        {
          nombre: "Voleibol",
          cantidad: 40,
        },
        {
          nombre: "Atletismo",
          cantidad: 55,
        },
        {
          nombre: "Karate",
          cantidad: 35,
        },
      ],
    };
  }
};

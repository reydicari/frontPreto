import { api } from "boot/axios.js";
const URL_PART = "/api/evaluacion";
import { Notify } from "quasar";
// export const listarEvaluaciones = async () => {
//   try {
//     const response = await api.get(URL_PART + "/listar");
//     return response.data;
//   } catch (error) {
//     console.log("error en el store", error);
//     return error.response.data;
//   }
// };

export const agregarEvaluaciones = async (dataform) => {
  try {
    const response = await api.post(URL_PART + "/agregar", dataform);
    Notify.create({
      type: "info",
      message: "Evaluación creada con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al crear la evaluaciones",
      position: "bottom",
    });
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const verificarEvaluado = async () => {
  try {
    const response = await api.get(URL_PART + "/verificar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};

export const listarEvaluaciones = async (params) => {
  try {
    const response = await api.get(URL_PART + "/listar", { params });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al cargar las evaluaciones",
      position: "bottom",
    });
    return error.response.data;
  }
};

import { api } from "boot/axios.js";
const URL_PART = "/api/disciplina";
import { Notify } from "quasar";
export const listarDisciplinas = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};

export const agregarDisciplina = async (dataform) => {
  try {
    const response = await api.post(URL_PART + "/agregar", dataform);
    Notify.create({
      type: "info",
      message: "Disciplina creada con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al crear la disciplina",
      position: "bottom",
    });
    console.log("error en el store", error);
    return error.response.data;
  }
};

export const modificarDisciplina = async (dataform) => {
  try {
    const response = await api.put(
      URL_PART + "/modificar/" + dataform.id,
      dataform,
    );
    Notify.create({
      type: "info",
      message: "Modificacion exitosa",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al modificar la disciplina",
      position: "bottom",
    });
    return error.response.data;
  }
};

export const cambiarEstado = async (nd) => {
  try {
    const response = await api.put(URL_PART + `/cambiarEstado/${nd.id}`, nd);
    Notify.create({
      type: "info",
      message: "Actualizacion de estado exitosa",
      position: "bottom",
    });
    return response;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    Notify.create({
      type: "negative",
      message: "Error al cambiar el estado de la disciplina",
      position: "bottom",
    });
    return error.response;
  }
};

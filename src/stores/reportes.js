import { api } from "boot/axios.js";
const URL_PART = "/api/reportes";
export const reportePagos = async () => {
  try {
    const response = await api.get(URL_PART + "/pagos", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const reportePersonas = async () => {
  try {
    const response = await api.get(URL_PART + "/estudiantes", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const reportePagosPersona = async (params) => {
  try {
    const response = await api.get(URL_PART + `/reportePagosPersona`, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};

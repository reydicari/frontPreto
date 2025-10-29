import {api} from "boot/axios.js";
const URL_PART="/api/disciplina"
export const listarDisciplinas= async()=>{
  try {
    const response = await api.get(URL_PART+'/listar')
    return response.data
  } catch (error) {
    console.log('error en el store',error)
    return error.response.data
  }
}
export const listarRoles = async()=>{
  try {
    const response = await api.get(URL_PART+'/listarRoles')
    return response.data
  } catch (error) {
    console.log('error en el store',error.response)
    return error.response.data
  }
}
export const registrar = async(dataform)=>{
  try {
    const response = await api.post(URL_PART+'/registrar', dataform)
    return response
  } catch (error) {
    console.log('error en el store',error.response.data.error)
    return error.response
  }
}

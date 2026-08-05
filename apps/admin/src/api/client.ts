import axios from 'axios';
function normalizeApiBaseUrl(raw:string|undefined){const browserOrigin=typeof window!=='undefined'&&window.location?.origin?window.location.origin:'';let value=(raw||browserOrigin||'http://localhost:8080').trim().replace(/\/+$/,'');return value.replace(/\/v1$/i,'');}
export const apiBaseUrl=normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const api=axios.create({baseURL:apiBaseUrl,timeout:60000,withCredentials:true});
api.interceptors.response.use(r=>r,error=>{const status=error?.response?.status;const code=error?.response?.data?.error;const message=error?.response?.data?.message||error?.response?.data?.details||error?.message||'API request failed';const url=error?.config?.url?`${apiBaseUrl}${error.config.url}`:apiBaseUrl;throw new Error(status?`${status} ${code||''} ${message}`.trim():`${message}. Check API URL: ${url}`);});
export async function getApiHealth(){const{data}=await api.get('/health');return data;}
export async function signUpload(file:File,folder:string){const form=new FormData();form.append('file',file);form.append('folder',folder);const{data}=await api.post('/v1/admin/uploads',form,{timeout:180000});return data.upload;}

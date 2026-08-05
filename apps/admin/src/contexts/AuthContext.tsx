import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

type AdminUser = { id: string; email?: string; role?: string };
type AuthContextValue = { session: AdminUser | null; loading: boolean; signIn:(email:string,password:string)=>Promise<void>; signOut:()=>Promise<void> };
const AuthContext=createContext<AuthContextValue|undefined>(undefined);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<AdminUser|null>(null);const[loading,setLoading]=useState(true);
 useEffect(()=>{api.get('/v1/admin/session').then(r=>setSession(r.data.user)).catch(()=>setSession(null)).finally(()=>setLoading(false));},[]);
 const value=useMemo<AuthContextValue>(()=>({session,loading,signIn:async(email,password)=>{const{data}=await api.post('/v1/admin/login',{email,password});setSession(data.user);},signOut:async()=>{await api.post('/v1/admin/logout');setSession(null);}}),[session,loading]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('useAuth must be used inside AuthProvider');return ctx;}

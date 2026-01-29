export interface Paciente {
  id?: number;
  user_id: string; // UUID del usuario de Supabase Auth
  tipo_doc_id?: number;
  nro_documento?: string;
  apellido?: string;
  nombre?: string;
  fecha_nacimiento: string;
  sexo: string;
  email: string;
  telefono: string;
  domicilio: string;
  localidad: number; // ID de v_local_pcia_cp
  pais?: string;
  condicion_iva_id?: number;
  cuit?: string;
  contacto_emergencia: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompletarPerfilData {
  nombre: string;
  apellido: string;
  tipo_doc_id: number;
  nro_documento: string;
  fecha_nacimiento: string;
  sexo: string;
  email: string;
  telefono: string;
  domicilio: string;
  localidad_id: number; // ID de v_local_pcia_cp
  condicion_iva_id?: number; // Opcional para menores de edad
  cuit?: string; // Opcional para menores de edad
  contacto_emergencia: string;
}

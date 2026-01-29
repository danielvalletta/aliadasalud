export interface Provincia {
  id: number;
  nombre: string;
  codigopostal_id: string;
}

export interface Localidad {
  id: number;
  provincia_id: number;
  nombre: string;
  codigopostal: string;
}

export interface LocalidadCompleta {
  id: number;
  localidad: string;
  codigopostal: string;
  provincia: string;
}

export interface BusquedaLocalidadParams {
  texto?: string;
  provinciaId?: number;
  codigoPostal?: string;
  limit?: number;
}

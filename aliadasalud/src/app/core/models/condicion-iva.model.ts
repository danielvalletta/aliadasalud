export interface CondicionIva {
  id: number;
  codigo: string;
  nombre: string;
}

export const OpcionesSexo = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Femenino', value: 'FEMENINO' },
  { label: 'Otro', value: 'OTRO' },
  { label: 'No informado', value: 'NO INFORMADO' }
];

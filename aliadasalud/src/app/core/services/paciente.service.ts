import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Paciente, CompletarPerfilData } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private supabase = inject(SupabaseService);
  getPacienteByUserId(userId: string): Observable<Paciente | null> {
    return new Observable(observer => {
      this.supabase.getByFilter<Paciente>('pacientes', 'user_id', userId)
        .subscribe({
          next: (pacientes) => {
            observer.next(pacientes.length > 0 ? pacientes[0] : null);
            observer.complete();
          },
          error: (error) => observer.error(error)
        });
    });
  }

  guardarPerfil(data: CompletarPerfilData, userId: string): Observable<Paciente> {
    const pacienteData: Record<string, any> = {
      user_id: userId,
      nombre: data.nombre,
      apellido: data.apellido,
      tipo_doc_id: data.tipo_doc_id,
      nro_documento: data.nro_documento,
      fecha_nacimiento: data.fecha_nacimiento,
      sexo: data.sexo,
      email: data.email,
      telefono: data.telefono,
      domicilio: data.domicilio,
      localidad: data.localidad_id,
      contacto_emergencia: data.contacto_emergencia,
      pais: 'Argentina',
      activo: true
    };

    if (data.condicion_iva_id) {
      pacienteData['condicion_iva_id'] = data.condicion_iva_id;
    }
    if (data.cuit) {
      pacienteData['cuit'] = data.cuit;
    }

    return new Observable(observer => {
      this.getPacienteByUserId(userId).subscribe({
        next: (pacienteExistente) => {
          if (pacienteExistente) {
            this.supabase.updateData<Paciente>('pacientes', pacienteExistente.id!.toString(), pacienteData)
              .subscribe({
                next: (result) => {
                  observer.next(result[0]);
                  observer.complete();
                },
                error: (error) => observer.error(error)
              });
          } else {
            this.supabase.insertData<Paciente>('pacientes', pacienteData)
              .subscribe({
                next: (result) => {
                  observer.next(result[0]);
                  observer.complete();
                },
                error: (error) => observer.error(error)
              });
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  actualizarPerfil(id: number, data: Partial<Paciente>): Observable<Paciente> {
    return new Observable(observer => {
      this.supabase.updateData<Paciente>('pacientes', id.toString(), data)
        .subscribe({
          next: (result) => {
            observer.next(result[0]);
            observer.complete();
          },
          error: (error) => observer.error(error)
        });
    });
  }

  tienePerfilCompleto(userId: string): Observable<boolean> {
    return new Observable(observer => {
      this.getPacienteByUserId(userId).subscribe({
        next: (paciente) => {
          if (!paciente) {
            observer.next(false);
            observer.complete();
            return;
          }

          const camposBasicosCompletos = !!(
            paciente.nombre &&
            paciente.apellido &&
            paciente.tipo_doc_id &&
            paciente.nro_documento &&
            paciente.fecha_nacimiento &&
            paciente.sexo &&
            paciente.telefono &&
            paciente.domicilio &&
            paciente.localidad &&
            paciente.contacto_emergencia
          );

          if (!camposBasicosCompletos) {
            observer.next(false);
            observer.complete();
            return;
          }

          const esMayorDeEdad = this.calcularEdad(new Date(paciente.fecha_nacimiento)) >= 18;

          if (esMayorDeEdad) {
            const perfilCompleto = !!(paciente.condicion_iva_id && paciente.cuit);
            observer.next(perfilCompleto);
          } else {
            observer.next(true);
          }

          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  private calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }
}

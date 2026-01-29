import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { AutoComplete } from 'primeng/autocomplete';
import { ButtonDirective } from 'primeng/button';
import { InputMask } from 'primeng/inputmask';

import { LocalidadService } from '../../../core/services/localidad.service';
import { CondicionIvaService } from '../../../core/services/condicion-iva.service';
import { TipoDocumentoService } from '../../../core/services/tipo-documento.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { AuthService } from '../../../core/services/auth.service';
import { LocalidadCompleta } from '../../../core/models/localidad.model';
import { CondicionIva, OpcionesSexo } from '../../../core/models/condicion-iva.model';
import { TipoDocumento } from '../../../core/models/tipo-documento.model';
import { CompletarPerfilData, Paciente } from '../../../core/models/paciente.model';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Select,
    DatePicker,
    AutoComplete,
    ButtonDirective,
    InputMask
  ],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.css'
})
export class CompleteProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private localidadService = inject(LocalidadService);
  private condicionIvaService = inject(CondicionIvaService);
  private tipoDocumentoService = inject(TipoDocumentoService);
  private pacienteService = inject(PacienteService);
  private authService = inject(AuthService);

  profileForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  opcionesSexo = OpcionesSexo;
  tiposDocumento = signal<TipoDocumento[]>([]);
  condicionesIva = signal<CondicionIva[]>([]);
  localidadesSugeridas = signal<LocalidadCompleta[]>([]);
  maxDate = new Date();

  private pacienteExistente: Paciente | null = null;

  esMayorDeEdad = signal(true);

  constructor() {
    this.profileForm = this.fb.group({
      tipoDocumento: [null, Validators.required],
      nroDocumento: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      telefono: ['', Validators.required],
      domicilio: ['', Validators.required],
      localidad: [null, Validators.required],
      condicionIva: [null, Validators.required],
      cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d{1}$/)]],
      contactoEmergencia: ['', Validators.required]
    });

    // Escuchar cambios en fecha de nacimiento para validar CUIT
    this.profileForm.get('fechaNacimiento')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        this.actualizarValidacionCuit(fecha);
      }
    });
  }

  private actualizarValidacionCuit(fechaNacimiento: Date) {
    const edad = this.calcularEdad(fechaNacimiento);
    const esMayor = edad >= 18;
    this.esMayorDeEdad.set(esMayor);

    const cuitControl = this.profileForm.get('cuit');
    const condicionIvaControl = this.profileForm.get('condicionIva');

    if (esMayor) {
      cuitControl?.setValidators([Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d{1}$/)]);
      condicionIvaControl?.setValidators([Validators.required]);
    } else {
      cuitControl?.setValidators([Validators.pattern(/^\d{2}-\d{8}-\d{1}$/)]);
      condicionIvaControl?.clearValidators();
    }

    cuitControl?.updateValueAndValidity();
    condicionIvaControl?.updateValueAndValidity();
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

  ngOnInit() {
    this.cargarTiposDocumento();
    this.cargarCondicionesIva();
    this.cargarDatosPaciente();
  }

  cargarTiposDocumento() {
    this.tipoDocumentoService.getTiposDocumento().subscribe({
      next: tipos => {
        this.tiposDocumento.set(tipos);
        // Si hay paciente existente, precargar tipo de documento
        if (this.pacienteExistente?.tipo_doc_id) {
          const tipo = tipos.find(t => t.id === this.pacienteExistente!.tipo_doc_id);
          if (tipo) {
            this.profileForm.patchValue({ tipoDocumento: tipo });
          }
        }
      },
      error: () => this.errorMessage.set('Error al cargar los tipos de documento')
    });
  }

  cargarCondicionesIva() {
    this.condicionIvaService.getCondicionesIva().subscribe({
      next: condiciones => {
        this.condicionesIva.set(condiciones);
        // Si hay paciente existente, precargar condición IVA
        if (this.pacienteExistente?.condicion_iva_id) {
          const condicion = condiciones.find(c => c.id === this.pacienteExistente!.condicion_iva_id);
          if (condicion) {
            this.profileForm.patchValue({ condicionIva: condicion });
          }
        }
      },
      error: () => this.errorMessage.set('Error al cargar las condiciones de IVA')
    });
  }

  cargarDatosPaciente() {
    const currentUser = this.authService.currentUser();

    if (!currentUser) return;

    this.pacienteService.getPacienteByUserId(currentUser.id).subscribe({
      next: (paciente) => {
        if (!paciente) return;

        // Verificar campos básicos siempre obligatorios
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

        if (camposBasicosCompletos) {
          // Verificar si es mayor de edad
          const esMayor = this.calcularEdad(new Date(paciente.fecha_nacimiento)) >= 18;

          // Para mayores de edad, CUIT y Condición IVA son obligatorios
          const perfilCompleto = !esMayor || (!!paciente.condicion_iva_id && !!paciente.cuit);

          if (perfilCompleto) {
            this.router.navigate(['/dashboard']);
            return;
          }
        }

        // Guardar referencia al paciente existente
        this.pacienteExistente = paciente;

        // Precargar datos existentes en el formulario
        this.precargarFormulario(paciente);
      },
      error: (error) => {
        console.error('Error al cargar datos del paciente:', error);
      }
    });
  }

  private precargarFormulario(paciente: Paciente) {
    // Precargar campos simples (nombre y apellido vienen del user_metadata)
    if (paciente.nro_documento) {
      this.profileForm.patchValue({ nroDocumento: paciente.nro_documento });
    }
    if (paciente.fecha_nacimiento) {
      this.profileForm.patchValue({
        fechaNacimiento: new Date(paciente.fecha_nacimiento)
      });
    }
    if (paciente.sexo) {
      this.profileForm.patchValue({ sexo: paciente.sexo });
    }
    if (paciente.telefono) {
      this.profileForm.patchValue({ telefono: paciente.telefono });
    }
    if (paciente.domicilio) {
      this.profileForm.patchValue({ domicilio: paciente.domicilio });
    }
    if (paciente.cuit) {
      this.profileForm.patchValue({ cuit: this.formatCuit(paciente.cuit) });
    }
    if (paciente.contacto_emergencia) {
      this.profileForm.patchValue({ contactoEmergencia: paciente.contacto_emergencia });
    }

    // Precargar tipo de documento si ya están cargados
    if (paciente.tipo_doc_id && this.tiposDocumento().length > 0) {
      const tipo = this.tiposDocumento().find(t => t.id === paciente.tipo_doc_id);
      if (tipo) {
        this.profileForm.patchValue({ tipoDocumento: tipo });
      }
    }

    // Precargar localidad (necesita obtener el objeto completo)
    if (paciente.localidad) {
      this.localidadService.getLocalidadCompletaById(paciente.localidad).subscribe({
        next: (localidad) => {
          if (localidad) {
            this.profileForm.patchValue({ localidad });
          }
        }
      });
    }

    // Precargar condición IVA si ya están cargadas
    if (paciente.condicion_iva_id && this.condicionesIva().length > 0) {
      const condicion = this.condicionesIva().find(c => c.id === paciente.condicion_iva_id);
      if (condicion) {
        this.profileForm.patchValue({ condicionIva: condicion });
      }
    }
  }

  buscarLocalidades(event: any) {
    const query = event.query;

    if (query.length < 2) {
      this.localidadesSugeridas.set([]);
      return;
    }

    this.localidadService.buscarLocalidadesCompletas(query, 20).subscribe({
      next: localidades => this.localidadesSugeridas.set(localidades),
      error: () => this.localidadesSugeridas.set([])
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const formValue = this.profileForm.value;
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      this.errorMessage.set('No se pudo obtener la información del usuario');
      this.loading.set(false);
      return;
    }

    if (!currentUser.email) {
      this.errorMessage.set('No se pudo obtener el email del usuario');
      this.loading.set(false);
      return;
    }

    // Obtener nombre y apellido del user_metadata
    const userMetadata = currentUser.user_metadata as { firstName?: string; lastName?: string } | undefined;
    const nombre = userMetadata?.firstName || '';
    const apellido = userMetadata?.lastName || '';

    if (!nombre || !apellido) {
      this.errorMessage.set('No se pudo obtener el nombre del usuario');
      this.loading.set(false);
      return;
    }

    const perfilData: CompletarPerfilData = {
      nombre,
      apellido,
      tipo_doc_id: formValue.tipoDocumento.id,
      nro_documento: formValue.nroDocumento,
      fecha_nacimiento: this.formatDate(formValue.fechaNacimiento),
      sexo: formValue.sexo,
      email: currentUser.email,
      telefono: formValue.telefono,
      domicilio: formValue.domicilio,
      localidad_id: formValue.localidad.id,
      condicion_iva_id: formValue.condicionIva?.id,
      cuit: formValue.cuit ? formValue.cuit.replace(/-/g, '') : undefined,
      contacto_emergencia: formValue.contactoEmergencia
    };

    this.pacienteService.guardarPerfil(perfilData, currentUser.id).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set('Error al guardar el perfil. Por favor intenta de nuevo.');
        console.error('Error al crear perfil:', error);
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatCuit(cuit: string): string {
    const digits = cuit.replace(/-/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
    }
    return cuit;
  }

  get tipoDocumento() { return this.profileForm.get('tipoDocumento'); }
  get nroDocumento() { return this.profileForm.get('nroDocumento'); }
  get fechaNacimiento() { return this.profileForm.get('fechaNacimiento'); }
  get sexo() { return this.profileForm.get('sexo'); }
  get telefono() { return this.profileForm.get('telefono'); }
  get domicilio() { return this.profileForm.get('domicilio'); }
  get localidad() { return this.profileForm.get('localidad'); }
  get condicionIva() { return this.profileForm.get('condicionIva'); }
  get cuit() { return this.profileForm.get('cuit'); }
  get contactoEmergencia() { return this.profileForm.get('contactoEmergencia'); }
}

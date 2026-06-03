import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- ===== PANTALLA DE BIENVENIDA ===== -->
    @if (currentView() === 'welcome') {
      <div class="contenedor_bienvenida">
        <div class="card_bienvenida">
          <div class="icono_bienvenida">
            <i class="fas fa-egg"></i>
          </div>
          <h1>¡Bienvenidos a Senavicola!</h1>
          <p>Sistema integral de gestión avícola</p>

          <div class="botones_bienvenida">
            <button class="btn_principal" (click)="currentView.set('login')">
              <i class="fas fa-sign-in-alt"></i>
              Iniciar Sesión
            </button>
            <button class="btn_secundario" (click)="loginAsGuest()">
              <i class="fas fa-eye"></i>
              Iniciar como Invitado
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ===== PANTALLA DE LOGIN ===== -->
    @if (currentView() === 'login') {
      <div class="contenedor_login">
        <button class="btn_volver" (click)="currentView.set('welcome')">
          <i class="fas fa-arrow-left"></i>
          Volver
        </button>

        <div class="card_login">
          <div class="icono_login">
            <i class="fas fa-egg"></i>
          </div>
          <h2>Iniciar Sesión</h2>
          <p class="subtitulo_login">Ingresa tus credenciales para continuar</p>

          @if (error()) {
            <div class="error_alert">
              <i class="fas fa-exclamation-circle"></i>
              {{ error() }}
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form_group">
              <label>
                <i class="fas fa-id-card"></i>
                Número de Documento
              </label>
              <input
                type="text"
                formControlName="documento"
                placeholder="Ingresa tu documento"
                autocomplete="username"
              />
              @if (loginForm.get('documento')?.touched && loginForm.get('documento')?.invalid) {
                <span class="error_text">El documento es requerido</span>
              }
            </div>

            <div class="form_group">
              <label>
                <i class="fas fa-lock"></i>
                Contraseña
              </label>
              <div class="input_password">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="btn_toggle_password"
                  (click)="togglePassword()"
                  tabindex="-1"
                >
                  <i class="fas" [ngClass]="showPassword() ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
                <span class="error_text">La contraseña es requerida (mínimo 6 caracteres)</span>
              }
            </div>

            <button type="submit" class="btn_login" [disabled]="loginForm.invalid || loading()">
              @if (loading()) {
                <span class="spinner_sm"></span> Ingresando...
              } @else {
                <i class="fas fa-sign-in-alt"></i>
                Iniciar Sesión
              }
            </button>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: url('/images/fondo_login.png') center/cover no-repeat,
                  linear-gradient(135deg, #1a472a 0%, #2d8600 50%, #39A900 100%);
      position: relative;
    }

    :host::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 0;
    }

    /* ===== ANIMACIÓN ===== */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===== PANTALLA BIENVENIDA ===== */
    .contenedor_bienvenida {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      position: relative;
      z-index: 1;
    }

    .card_bienvenida {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 5rem 4rem;
      border-radius: 20px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      text-align: center;
      max-width: 500px;
      width: 90%;
      animation: fadeInUp 0.6s ease;
    }

    .icono_bienvenida {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #39A900, #2d8600);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2.5rem;
      font-size: 6rem;
      color: white;
      box-shadow: 0 8px 16px rgba(57, 169, 0, 0.3);
    }

    .card_bienvenida h1 {
      font-size: 3.2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 1rem;
    }

    .card_bienvenida p {
      font-size: 1.6rem;
      color: #666;
      margin-bottom: 3rem;
    }

    .botones_bienvenida {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .btn_principal, .btn_secundario {
      padding: 1.5rem 3rem;
      border: none;
      border-radius: 10px;
      font-size: 1.6rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      transition: all 0.3s ease;
      font-family: 'Work Sans', sans-serif;
    }

    .btn_principal {
      background: linear-gradient(135deg, #39A900, #2d8600);
      color: white;
      box-shadow: 0 4px 12px rgba(57, 169, 0, 0.3);
    }

    .btn_principal:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(57, 169, 0, 0.4);
    }

    .btn_secundario {
      background: white;
      color: #39A900;
      border: 2px solid #39A900;
    }

    .btn_secundario:hover {
      background: #39A900;
      color: white;
      transform: translateY(-2px);
    }

    /* ===== PANTALLA LOGIN ===== */
    .contenedor_login {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      position: relative;
      z-index: 1;
      animation: fadeInUp 0.6s ease;
    }

    .btn_volver {
      position: absolute;
      top: 2rem;
      left: 2rem;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      padding: 1rem 2rem;
      border-radius: 10px;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-family: 'Work Sans', sans-serif;
      z-index: 10;
    }

    .btn_volver:hover {
      background: white;
      transform: translateX(-5px);
    }

    .card_login {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 4rem 3.5rem;
      border-radius: 20px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      max-width: 450px;
      width: 90%;
    }

    .icono_login {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #39A900, #2d8600);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2rem;
      font-size: 5rem;
      color: white;
      box-shadow: 0 8px 16px rgba(57, 169, 0, 0.3);
    }

    .card_login h2 {
      font-size: 2.8rem;
      font-weight: 700;
      color: #333;
      text-align: center;
      margin-bottom: 0.5rem;
    }

    .subtitulo_login {
      font-size: 1.4rem;
      color: #666;
      text-align: center;
      margin-bottom: 3rem;
    }

    /* ===== FORMULARIO ===== */
    .form_group {
      margin-bottom: 2.5rem;
    }

    .form_group label {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.8rem;
    }

    .form_group label i {
      color: #39A900;
      font-size: 1.6rem;
    }

    .form_group input,
    .form_group select {
      width: 100%;
      padding: 1.2rem 1.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1.5rem;
      font-family: 'Work Sans', sans-serif;
      transition: all 0.3s ease;
      background: white;
    }

    .form_group input:focus,
    .form_group select:focus {
      outline: none;
      border-color: #39A900;
      box-shadow: 0 0 0 3px rgba(57, 169, 0, 0.1);
    }

    .input_password {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input_password input {
      padding-right: 5rem;
    }

    .btn_toggle_password {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #666;
      font-size: 1.8rem;
      cursor: pointer;
      padding: 0.5rem;
      transition: color 0.3s ease;
    }

    .btn_toggle_password:hover {
      color: #39A900;
    }

    .btn_login {
      width: 100%;
      padding: 1.5rem;
      background: linear-gradient(135deg, #39A900, #2d8600);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1.6rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      transition: all 0.3s ease;
      margin-top: 2rem;
      box-shadow: 0 4px 12px rgba(57, 169, 0, 0.3);
      font-family: 'Work Sans', sans-serif;
    }

    .btn_login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(57, 169, 0, 0.4);
    }

    .btn_login:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn_login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    /* ===== ERROR ===== */
    .error_alert {
      background: #fdeaea;
      color: #d32f2f;
      padding: 1.5rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.4rem;
      font-weight: 500;
      border-left: 4px solid #d32f2f;
    }

    .error_text {
      color: #d32f2f;
      font-size: 1.2rem;
      margin-top: 0.5rem;
      display: block;
    }

    .spinner_sm {
      width: 1.8rem;
      height: 1.8rem;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .card_bienvenida, .card_login {
        margin: 2rem;
        padding: 3rem 2rem;
      }
      .card_bienvenida h1 { font-size: 2.4rem; }
      .card_login h2 { font-size: 2.2rem; }
      .btn_volver { top: 1rem; left: 1rem; padding: 0.8rem 1.5rem; font-size: 1.4rem; }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentView = signal<'welcome' | 'login'>('welcome');

  loginForm = this.fb.group({
    documento: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  loginAsGuest(): void {
    this.loading.set(true);
    this.error.set(null);
    this.authService.loginAsGuest().subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al iniciar como invitado');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { documento, password } = this.loginForm.value;

    this.authService.login({ documento: documento!, password: password! }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Credenciales inválidas o error de conexión');
        this.loading.set(false);
      }
    });
  }
}

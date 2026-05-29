import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SignupProps {
  onNavigate: (view: string) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("La foto pesa demasiado. El tamaño máximo admitido es de 5MB.");
        return;
      }
      setPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.fullName || !formData.email || !formData.whatsapp || !formData.password || !formData.confirmPassword) {
      setErrorMsg("Por favor completá todos los campos obligatorios (*).");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor verificalas.");
      return;
    }

    try {
      setIsCompressing(true);
      const user = await signUp({
        fullName: formData.fullName,
        nickname: formData.nickname,
        email: formData.email,
        whatsapp: formData.whatsapp,
        photoFile: photoFile,
        password: formData.password
      });
      
      setSuccessMsg("¡Registro exitoso! Guardando tu perfil...");
      setTimeout(() => {
        if (user.paymentStatus === "confirmed") {
          onNavigate('home');
        } else {
          onNavigate('pending-payment');
        }
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error al registrarse. Intentá nuevamente.");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      
      <div className="bg-brand-card retro-border retro-shadow p-6 rounded-lg relative registration-mark">
        <h2 className="font-serif text-2xl font-bold border-b-2 border-brand-ink pb-2 mb-4 text-center">
          📝 Unirme al Prode del Mundial
        </h2>

        {errorMsg && (
          <div className="bg-brand-error/20 border-2 border-brand-error text-brand-error font-mono p-3 rounded mb-4 text-xs">
            ⚠️ <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-brand-win/20 border-2 border-brand-win text-brand-win font-mono p-3 rounded mb-4 text-xs">
            🎉 {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name inputs */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full text-base border-2 border-brand-ink p-2 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
                placeholder="Ej: Lionel Andrés Messi"
              />
              <span className="text-[10px] text-brand-ink-muted leading-tight block mt-1">
                Debe ser tu nombre real completo. El organizador lo usará para autorizar tu transferencia MercadoPago.
              </span>
            </div>

            {/* Public Nickname optionally */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
                Apodo en la Tabla (Opcional)
              </label>
              <input
                type="text"
                name="nickname"
                maxLength={20}
                value={formData.nickname}
                onChange={handleInputChange}
                className="w-full text-base border-2 border-brand-ink p-2 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
                placeholder="Ej: LioM10 (Máx 20 car.)"
              />
              <span className="text-[10px] text-brand-ink-muted leading-tight block mt-1">
                Si lo dejás en blanco, usaremos tu nombre y primer inicial del apellido. Autogenerado.
              </span>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full text-base border-2 border-brand-ink p-2 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
                placeholder="ejemplo@email.com"
              />
            </div>

            {/* Whatsapp */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
                Número de WhatsApp *
              </label>
              <input
                type="text"
                name="whatsapp"
                required
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="w-full text-base border-2 border-brand-ink p-2 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
                placeholder="Ej: +5491123456789"
              />
              <span className="text-[10px] text-brand-ink-muted block mt-1">
                Incluí código de país/área. Felix te contactará si hay problemas con el cobro.
              </span>
            </div>

            {/* Account password simulated */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full text-base border-2 border-brand-ink p-2 pr-20 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold uppercase text-brand-ink/70 hover:text-brand-ink px-2 py-1 bg-brand-bg/50 border border-brand-ink/20 rounded select-none cursor-pointer"
                >
                  {showPassword ? "Ocultar 👁️" : "Mostrar 👁️"}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full text-base border-2 border-brand-ink p-2 pr-20 rounded bg-brand-bg font-sans focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-brand-bg"
                  placeholder="Repetir contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold uppercase text-brand-ink/70 hover:text-brand-ink px-2 py-1 bg-brand-bg/50 border border-brand-ink/20 rounded select-none cursor-pointer"
                >
                  {showConfirmPassword ? "Ocultar 👁️" : "Mostrar 👁️"}
                </button>
              </div>
            </div>
          </div>

          {/* Photo upload block */}
          <div className="pt-2 border-t border-brand-ink/10">
            <label className="block text-xs font-mono font-bold uppercase mb-1 text-brand-ink">
              Foto de Perfil (Opcional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-brand-ink flex items-center justify-center overflow-hidden bg-brand-bg">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono text-2xl text-brand-ink-muted">👤</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="avatar"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar"
                  className="bg-brand-bg text-brand-ink px-4 py-2 rounded border-2 border-brand-ink retro-shadow-sm inline-block cursor-pointer text-xs font-mono font-bold uppercase hover:bg-brand-card transition-colors"
                >
                  Examinar foto de perfil 📁
                </label>
                <div className="text-[10px] text-brand-ink-muted mt-2 space-y-1">
                  <p>Admite JPG, PNG o WEBP. Peso máximo 5MB.</p>
                  <p className="italic text-brand-accent font-medium">⚠️ Al subir aceptás que se muestre en el ranking público. Una vez creado el perfil no podrás cambiarla.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t-2 border-brand-ink">
            <button
              type="button"
              onClick={() => onNavigate('welcome')}
              className="font-mono text-xs font-bold uppercase underline text-brand-ink-muted hover:text-brand-ink"
            >
              ← Volver al inicio
            </button>
            
            <button
              type="submit"
              disabled={isCompressing}
              className="w-full sm:w-auto bg-brand-accent text-brand-bg retro-border retro-shadow px-8 py-3 font-display uppercase tracking-wider text-base cursor-pointer disabled:opacity-50"
            >
              {isCompressing ? "Procesando Imagen... ⏳" : "Completar Registro 🎉"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Signup;

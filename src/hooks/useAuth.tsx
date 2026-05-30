import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  getActiveUsers, 
  saveActiveUsers, 
  getActiveSession, 
  saveActiveSession, 
  getActiveConfig,
  auth,
  db,
  IS_SANDBOX,
  setupRealtimeSync,
  fetchPublicConfig,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  fullName: string;
  nickname: string;
  email: string;
  whatsapp: string;
  photoURL: string | null;
  inviteCode?: string;
  paymentStatus: "pending" | "confirmed" | "rejected";
  paymentConfirmedBy?: string | null;
  paymentConfirmedAt?: string | null;
  createdAt: string;
  isAdmin: boolean;
  totalPoints: number;
  completionPercent: number;
  rank: number | null;
  password?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (params: {
    fullName: string;
    nickname: string;
    email: string;
    whatsapp: string;
    photoFile: File | null;
    password?: string;
  }) => Promise<UserProfile>;
  login: (email: string, password?: string) => Promise<UserProfile>;
  logout: () => void;
  updateLocalUserProfile: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Core Name Validation matching strict anti-troll spec
export function validateFullName(name: string): string | null {
  const cleanName = name.trim();
  if (!cleanName) return "El nombre completo es obligatorio.";
  
  // No numbers or special characters allowed
  const allowedChars = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ'\s-]+$/;
  if (!allowedChars.test(cleanName)) {
    return "El nombre de pila solo puede contener letras, tildes, apóstrofes y guiones.";
  }
  
  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return "Tenés que poner tu nombre y apellido (mínimo 2 palabras).";
  }
  
  // Detect low quality repetitive asdf input
  const wordSet = new Set(words.map(w => w.toLowerCase()));
  if (wordSet.size < words.length) {
    return "Detectamos palabras repetidas en el nombre. Poné tu nombre real, por favor.";
  }
  
  for (const word of words) {
    if (word.length < 2) {
      return "Cada palabra del nombre debe tener al menos 2 letras.";
    }
  }
  
  return null; // OK
}

// Client-side image canvas compressor tool conforming to exact spec
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("La foto seleccionada supera los 5MB de límite."));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Error al renderizar procesador de imágenes."));
          return;
        }

        // Square cropping logic
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 256, 256);
        
        // JPEG 82% quality compression
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Archivo de imagen no válido."));
    };
    reader.onerror = () => reject(new Error("Error al leer archivo de imagen."));
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isSigningUp = useRef(false);

  // Synchronize Firestore data dynamically in real time when authenticated
  useEffect(() => {
    if (user && !IS_SANDBOX) {
      const unsubscribe = setupRealtimeSync(user, () => {
        window.dispatchEvent(new Event('prode_data_updated'));
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    if (IS_SANDBOX) {
      const session = getActiveSession();
      if (session) {
        setUser(session);
      }
      setLoading(false);
    } else {
      fetchPublicConfig();
      const unsubscribe = auth.onAuthStateChanged(async (authUser: any) => {
        if (isSigningUp.current) {
          console.log("onAuthStateChanged: Registro en progreso, omitiendo auto-fetch para evitar condiciones de carrera.");
          return;
        }
        if (authUser) {
          try {
            // Try of fetch user profile from Firestore to ensure freshness
            const userRef = doc(db, "users", authUser.uid);
            let userSnap;
            let retries = 4;
            let delay = 150;
            while (retries > 0) {
              try {
                userSnap = await getDoc(userRef);
                break;
              } catch (err: any) {
                console.warn(`onAuthStateChanged - Attempt to fetch user document failed (${retries} retries left):`, err);
                retries--;
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
              }
            }

            if (userSnap && userSnap.exists()) {
              const profile = userSnap.data() as UserProfile;
              setUser(profile);
              saveActiveSession(profile);
            } else {
              // Auto-bootstrap Admin profile if missing in live database to resolve chicken-and-egg boot locks
              if (authUser.email && (authUser.email.toLowerCase() === "sebahotelmkt@gmail.com" || authUser.email.toLowerCase() === "felixblancovolpe@gmail.com")) {
                const adminProfile: UserProfile = {
                  uid: authUser.uid,
                  fullName: "Felix Blanco",
                  nickname: "Felixwhite",
                  email: authUser.email.toLowerCase(),
                  whatsapp: "+541198765432",
                  photoURL: null,
                  paymentStatus: "confirmed",
                  createdAt: new Date().toISOString(),
                  isAdmin: true,
                  totalPoints: 0,
                  completionPercent: 0,
                  rank: 1
                };
                await setDoc(doc(db, "users", authUser.uid), adminProfile);
                setUser(adminProfile);
                saveActiveSession(adminProfile);
                console.log("Successfully auto-bootstrapped Admin profile document in Firestore.");
              } else {
                // Fallback to active local session if doc not synced yet
                const session = getActiveSession();
                if (session && session.uid === authUser.uid) {
                  setUser(session);
                } else {
                  setUser(null);
                  saveActiveSession(null);
                }
              }
            }
          } catch (err) {
            console.error("Error loading user profile on auth state change:", err);
            const session = getActiveSession();
            if (session) {
              setUser(session);
            }
            // Mandated by Firebase Integration Skill: throw structured error on permission issues
            handleFirestoreError(err, OperationType.GET, `users/${authUser.uid}`);
          }
        } else {
          setUser(null);
          saveActiveSession(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    }
  }, []);

  const login = async (email: string, password?: string): Promise<UserProfile> => {
    setError(null);
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const actualPassword = password?.trim();

      if (!actualPassword) {
        throw new Error("Por favor ingresá tu contraseña.");
      }

      if (IS_SANDBOX) {
        const users = getActiveUsers();
        const match = users.find(u => u.email.toLowerCase() === cleanEmail);

        if (!match) {
          throw new Error("No encontramos ningún usuario con ese email. Verificá los datos o registrate.");
        }

        if (match.password && match.password !== actualPassword) {
          throw new Error("Contraseña incorrecta. Verificá tus datos o usá '¿Olvidaste tu contraseña?'.");
        }

        setUser(match);
        saveActiveSession(match);
        return match;
      } else {
        // Live mode authentication. Admins log in with the same flow as
        // regular users — privileges are granted server-side via the
        // request.auth.token.email check in firestore.rules. There is NO
        // password bypass: any hardcoded credential in client code is
        // public to anyone reading the bundle and can never be trusted.
        let authUser;
        try {
          const credentials = await signInWithEmailAndPassword(auth, cleanEmail, actualPassword);
          authUser = credentials.user;
        } catch (authErr: any) {
          if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
            throw new Error("Contraseña incorrecta. Verificá tus datos o usá '¿Olvidaste tu contraseña?'.");
          } else if (authErr.code === 'auth/user-not-found') {
            throw new Error("No encontramos ningún usuario con ese email. Verificá los datos o registrate.");
          } else {
            throw new Error(authErr.message || String(authErr));
          }
        }

        // Retrieve user document from Firestore with retry to handle propagation latency
        const userRef = doc(db, "users", authUser.uid);
        let userSnap;
        let retries = 4;
        let delay = 150;
        while (retries > 0) {
          try {
            userSnap = await getDoc(userRef);
            break;
          } catch (err: any) {
            console.warn(`Attempt to fetch user document failed during login (${retries} retries left):`, err);
            retries--;
            if (retries === 0) {
              handleFirestoreError(err, OperationType.GET, `users/${authUser.uid}`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        }

        if (!userSnap || !userSnap.exists()) {
          const checkEmail = cleanEmail.toLowerCase();
          const isAdminEmail = checkEmail === "sebahotelmkt@gmail.com" || checkEmail === "felixblancovolpe@gmail.com";
          
          const words = checkEmail.split('@')[0].split(/[\._\-]+/);
          const formattedName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const formattedNick = words[0] || "Usuario";
          
          const newProfile: UserProfile = {
            uid: authUser.uid,
            fullName: isAdminEmail ? "Felix Blanco" : formattedName,
            nickname: isAdminEmail ? "Felixwhite" : formattedNick,
            email: checkEmail,
            whatsapp: isAdminEmail ? "+541198765432" : "",
            photoURL: null,
            paymentStatus: isAdminEmail ? "confirmed" : "pending",
            createdAt: new Date().toISOString(),
            isAdmin: isAdminEmail,
            totalPoints: 0,
            completionPercent: 0,
            rank: 10
          };
          
          await setDoc(doc(db, "users", authUser.uid), newProfile);
          setUser(newProfile);
          saveActiveSession(newProfile);
          return newProfile;
        }

        const profile = userSnap.data() as UserProfile;
        setUser(profile);
        saveActiveSession(profile);
        return profile;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (params: {
    fullName: string;
    nickname: string;
    email: string;
    whatsapp: string;
    photoFile: File | null;
    password?: string;
  }): Promise<UserProfile> => {
    setError(null);
    setLoading(true);
    isSigningUp.current = true;
    try {
      const checkEmail = params.email.trim().toLowerCase();
      const isAdminEmail = checkEmail === "sebahotelmkt@gmail.com" || checkEmail === "felixblancovolpe@gmail.com";

      // 2. Anti-troll Full name checks
      const nameErr = validateFullName(params.fullName);
      if (nameErr) {
        throw new Error(nameErr);
      }

      // 3. Email unique check
      const users = getActiveUsers();
      if (users.some(u => u.email.toLowerCase() === params.email.trim().toLowerCase())) {
        throw new Error("El email ya está registrado. Probá ingresando directamente.");
      }

      // 4. Nickname formatting fallback
      let nick = params.nickname.trim();
      if (!nick) {
        const words = params.fullName.trim().split(/\s+/);
        const firstName = words[0];
        const surnameInitial = words[1] ? words[1][0].toUpperCase() + "." : "";
        nick = `${firstName} ${surnameInitial}`.trim();
      }

      // 5. Image Compression if photo loaded
      let photoURL = null;
      if (params.photoFile) {
        photoURL = await compressImage(params.photoFile);
      }

      // 6. Configured Admin Email matching
      // From prompt spec: admin is defined by uid "admin" or email 'sebahotelmkt@gmail.com' or 'felixblancovolpe@gmail.com'

      let uid = "user_" + Math.random().toString(36).substr(2, 9);
      const actualPassword = params.password?.trim();
      if (!actualPassword) {
        throw new Error("Por favor ingresá una contraseña.");
      }

      if (!IS_SANDBOX) {
        // Live signup
        try {
          const credentials = await createUserWithEmailAndPassword(auth, params.email.trim().toLowerCase(), actualPassword);
          uid = credentials.user.uid;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            try {
              // Automatically sign in to verify that they know the password. If so, overwrite/heal Firestore profile!
              console.log("Existing Firebase Auth account detected. Attempting bypass and Firestore profile auto-heal...");
              const signCredentials = await signInWithEmailAndPassword(auth, params.email.trim().toLowerCase(), actualPassword);
              uid = signCredentials.user.uid;
            } catch (loginErr) {
              throw new Error("El email ya está registrado con otra contraseña. Probá ingresando desde el login o recuperándola.");
            }
          } else {
            throw new Error(authErr.message || String(authErr));
          }
        }
      }

      const newUser: UserProfile = {
        uid,
        fullName: params.fullName.trim(),
        nickname: nick,
        email: params.email.trim().toLowerCase(),
        whatsapp: params.whatsapp.trim(),
        photoURL,
        paymentStatus: isAdminEmail ? "confirmed" : "pending",
        createdAt: new Date().toISOString(),
        isAdmin: isAdminEmail,
        totalPoints: 0,
        completionPercent: 0,
        rank: users.length + 1
        // Note: password is intentionally NOT stored in the user profile.
        // Firebase Auth handles credentials; storing the password in
        // Firestore would expose it to anyone with read access.
      };

      if (IS_SANDBOX) {
        users.push(newUser);
        saveActiveUsers(users);
        setUser(newUser);
        saveActiveSession(newUser);
      } else {
        // Save to Firestore users collection with retry and small delay to avoid auth token propagation race conditions
        let retries = 4;
        let delay = 150;
        while (retries > 0) {
          try {
            await setDoc(doc(db, "users", uid), newUser);
            break;
          } catch (err: any) {
            console.warn(`Attempt to save user document failed (${retries} retries left):`, err);
            retries--;
            if (retries === 0) {
              handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
          }
        }
        
        // Also keep local list updated
        users.push(newUser);
        localStorage.setItem('prode_sandbox_users', JSON.stringify(users));
        setUser(newUser);
        saveActiveSession(newUser);
      }
      
      return newUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      isSigningUp.current = false;
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    saveActiveSession(null);
    if (!IS_SANDBOX) {
      signOut(auth).catch(err => console.error("Error signing out:", err));
    }
  };

  const updateLocalUserProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const nextUser = { ...user, ...updated };
    setUser(nextUser);
    saveActiveSession(nextUser);

    const users = getActiveUsers();
    const index = users.findIndex(u => u.uid === user.uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...updated };
      saveActiveUsers(users);
    } else {
      if (!IS_SANDBOX && db) {
        setDoc(doc(db, "users", user.uid), nextUser).catch(err => {
          console.error("Error updating user profile in Firestore:", err);
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, login, logout, updateLocalUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};

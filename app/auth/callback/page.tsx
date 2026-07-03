"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Cancelaste el acceso con Google.",
  missing_code: "Google no devolvió el código de autorización.",
  invalid_state: "La sesión de autenticación expiró. Probá de nuevo.",
  email_not_verified: "Tu email de Google no está verificado.",
  google_auth_failed: "No pudimos autenticarte con Google. Probá de nuevo.",
};

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const errParam = query.get("error");
    if (errParam) { setError(ERROR_MESSAGES[errParam] ?? "No se pudo iniciar sesión con Google."); return; }

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hash.get("token");
    if (!token) { setError("No recibimos el token de autenticación."); return; }

    (async () => {
      try {
        localStorage.setItem("token", token);
        const { user } = await authService.me(token);
        localStorage.setItem("user", JSON.stringify(user));
        window.history.replaceState(null, "", "/auth/callback"); // saca el token del historial
        router.replace("/dashboard");
      } catch {
        localStorage.removeItem("token");
        setError("No pudimos completar el inicio de sesión. Probá de nuevo.");
      }
    })();
  }, [router]);

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#f0f6ff 0%,#f1f5f9 60%,#fdf4ff 100%)",padding:"24px 16px",textAlign:"center"}}>
      <div style={{width:"100%",maxWidth:420,background:"white",borderRadius:24,padding:"36px 32px",boxShadow:"0 8px 40px rgba(0,0,0,.1)"}}>
        {error ? (
          <>
            <p style={{fontSize:14,color:"#ef4444",fontWeight:700,margin:"0 0 18px"}}>⚠ {error}</p>
            <button onClick={()=>router.replace("/login")} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Volver al login</button>
          </>
        ) : (
          <p style={{fontSize:15,color:"#64748b",fontWeight:600,margin:0}}>Conectando con Google…</p>
        )}
      </div>
    </div>
  );
}

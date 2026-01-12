import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, BookOpen, Mail } from "lucide-react";
import { toast } from "sonner";
import { ES } from "@/constants/es";

/**
 * Login page - Email-only authentication with verification code
 */
export default function Login() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const sendCodeMutation = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      toast.success("Código enviado a tu correo");
      setStep("code");
    },
    onError: (error) => {
      toast.error(error.message || "Error al enviar el código");
    },
  });

  const verifyCodeMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("¡Bienvenido!");
      // Redirect to home after successful login
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message || "Código inválido o expirado");
    },
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Por favor ingresa tu correo");
      return;
    }

    try {
      await sendCodeMutation.mutateAsync({ email: email.trim() });
    } catch (error) {
      console.error("Error sending code:", error);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Por favor ingresa el código");
      return;
    }

    try {
      await verifyCodeMutation.mutateAsync({
        email: email.trim(),
        code: code.trim(),
      });
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/logo-absa.png" alt="ABSA" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">{ES.appName}</CardTitle>
            <CardDescription>{ES.appDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sendCodeMutation.isPending}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold mb-1">Para Testing:</p>
                  <p>Usa: <code className="bg-white px-2 py-1 rounded">estudiante@absa.edu</code></p>
                  <p>Código: <code className="bg-white px-2 py-1 rounded">123456</code></p>
                </div>

                <Button
                  type="submit"
                  disabled={sendCodeMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {sendCodeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Código"
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Recibirás un código de 6 dígitos en tu correo
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <Label htmlFor="email-display">Correo</Label>
                  <Input
                    id="email-display"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="code">Código de Verificación</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={verifyCodeMutation.isPending}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold mb-1">Código de Prueba:</p>
                  <p><code className="bg-white px-2 py-1 rounded">123456</code></p>
                </div>

                <Button
                  type="submit"
                  disabled={verifyCodeMutation.isPending || code.length !== 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {verifyCodeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Código"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  className="w-full"
                >
                  Usar otro correo
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
          Plataforma de Aprendizaje en Línea de ABSA
        </p>
      </div>
    </div>
  );
}

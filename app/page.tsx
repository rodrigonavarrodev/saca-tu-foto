"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Loader2, Camera, AlertCircle } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<
    | "initial"
    | "requesting"
    | "camera"
    | "preview"
    | "uploading"
    | "success"
    | "error"
  >("initial");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [serverResponse, setServerResponse] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function to stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Track stopped:", track.kind);
      });
      streamRef.current = null;
    }
  };

  // Check if device supports camera
  const checkCameraSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Tu navegador no soporta acceso a la cámara");
      return false;
    }
    return true;
  };

  // Initialize camera with multiple fallback strategies
  const initializeCamera = async () => {
    if (!checkCameraSupport()) return;

    setStep("requesting");
    setDebugInfo("Solicitando permisos de cámara...");

    try {
      // Strategy 1: Try with environment camera (back camera)
      let constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      };

      setDebugInfo("Intentando cámara trasera...");
      let stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!stream) {
        throw new Error("No se pudo obtener stream de cámara trasera");
      }

      // If back camera fails, try any available camera
      if (!stream.getVideoTracks().length) {
        setDebugInfo(
          "Cámara trasera no disponible, intentando cualquier cámara..."
        );
        constraints = {
          video: {
            facingMode: "user",
            width: { ideal: 300, max: 640 },
            height: { ideal: 400, max: 480 },
          },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      streamRef.current = stream;
      setDebugInfo("Stream obtenido exitosamente");

      // Cambiar al paso de cámara PRIMERO, luego asignar el stream
      setStep("camera");

      // Esperar un poco para que el elemento video se renderice
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          setDebugInfo("Asignando stream al video");
          videoRef.current.srcObject = streamRef.current;

          // Intentar reproducir el video
          videoRef.current.play().catch((error) => {
            console.log("Play error (normal en iOS):", error);
          });

          setDebugInfo("Cámara lista");
        } else {
          setDebugInfo("Error: elemento video no encontrado");
        }
      }, 100);
    } catch (error: any) {
      console.error("Camera initialization error:", error);
      stopCamera();

      let userMessage = "Error al acceder a la cámara";
      if (error.name === "NotAllowedError") {
        userMessage =
          "Permisos de cámara denegados. Por favor, permite el acceso a la cámara.";
      } else if (error.name === "NotFoundError") {
        userMessage = "No se encontró cámara en el dispositivo.";
      } else if (error.name === "NotReadableError") {
        userMessage = "La cámara está siendo usada por otra aplicación.";
      } else if (error.name === "OverconstrainedError") {
        userMessage = "La cámara no cumple con los requisitos solicitados.";
      }

      setErrorMessage(userMessage);
      setDebugInfo(`Error: ${error.message}`);
      setStep("error");
    }
  };

  // Capture photo function
  const capturePhoto = async () => {
    if (!videoRef.current || !streamRef.current) {
      setErrorMessage("Video no disponible para captura");
      return;
    }

    try {
      // Verificar que el video esté reproduciendo
      if (videoRef.current.readyState < 2) {
        setErrorMessage("El video aún no está listo. Espera un momento.");
        return;
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("No se pudo crear contexto de canvas");
      }

      // Obtener las dimensiones reales del video
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;

      console.log("Video dimensions:", videoWidth, "x", videoHeight);

      // Configurar el canvas con mejor resolución
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Dibujar el frame actual del video
      context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

      // Convertir a imagen con mejor calidad
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setCapturedImage(imageDataUrl);

      // Convertir canvas a blob para enviar después
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedBlob(blob);
          }
        },
        "image/jpeg",
        0.95
      );

      // Stop camera
      stopCamera();
      setStep("preview");
    } catch (error) {
      console.error("Capture error:", error);
      setErrorMessage("Error al capturar la foto");
    }
  };

  // Upload image function
  const uploadImage = async () => {
    console.log("[CLIENT] Iniciando subida de imagen...");
    console.log("[CLIENT] Estado del blob:", capturedBlob ? "Disponible" : "No disponible");
    
    if (!capturedBlob) {
      console.log("[CLIENT] Error: No hay imagen para enviar");
      setErrorMessage("No hay imagen para enviar");
      return;
    }

    setStep("uploading");
    console.log("[CLIENT] Estado cambiado a 'uploading'");

    try {
      // Crear un archivo a partir del blob
      const file = new File([capturedBlob], "factura.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      
      console.log("[CLIENT] Archivo creado y agregado a FormData");
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        body: formData
      });

      console.log("[CLIENT] Respuesta recibida:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("[CLIENT] Subida exitosa:", data);
        setServerResponse(data);
        setStep("success");
      } else {
        const errorData = await response.json();
        console.log("[CLIENT] Error del servidor:", errorData);
        setErrorMessage(errorData.error || "Error del servidor al procesar la imagen");
        setStep("error");
      }
    } catch (error) {
      console.log("[CLIENT] Error de conexión:", error);
      setErrorMessage("Error de conexión al enviar la imagen");
      setStep("error");
    }
  };

  // Retry function
  const handleRetry = () => {
    stopCamera();
    setCapturedImage(null);
    setCapturedBlob(null);
    setErrorMessage("");
    setDebugInfo("");
    setServerResponse(null);
    setStep("initial");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Saca Tu Foto</h1>

        {/* Debug info - remove in production */}
        {debugInfo && (
          <div className="text-xs text-gray-500 text-center p-2 bg-gray-100 rounded">
            Debug: {debugInfo}
          </div>
        )}

        {/* STEP 1: Initial state */}
        {step === "initial" && (
          <div className="flex flex-col items-center space-y-4">
            <Camera className="h-16 w-16 text-gray-400" />
            <Button
              onClick={initializeCamera}
              size="lg"
              className="w-full py-8 text-lg"
            >
              Abrir cámara
            </Button>
          </div>
        )}

        {/* STEP 2: Requesting camera access */}
        {step === "requesting" && (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Iniciando cámara...</span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Si es la primera vez, acepta los permisos cuando aparezcan
            </p>
            <Button onClick={handleRetry} variant="outline" size="sm">
              Cancelar
            </Button>
          </div>
        )}

        {/* STEP 3: Camera active */}
        {step === "camera" && (
          <div className="flex flex-col items-center space-y-4">
            <Card className="overflow-hidden border-2 border-green-500">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-[300px] h-[400px] object-cover rounded-md"
              />
            </Card>
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Cámara activa</span>
            </div>
            <Button
              onClick={capturePhoto}
              variant="default"
              size="lg"
              className="w-full"
            >
              Escanear factura
            </Button>
            <Button onClick={handleRetry} variant="outline" size="sm">
              Cerrar cámara
            </Button>
          </div>
        )}

        {/* STEP 4: Photo preview - Usuario decide si enviar o no */}
        {step === "preview" && capturedImage && (
          <div className="flex flex-col items-center space-y-4">
            <Card className="overflow-hidden">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Factura capturada"
                className="w-[300px] h-[400px] object-cover rounded-md"
              />
            </Card>
            <p className="text-center text-gray-700 font-medium">
              ¿Te gusta cómo salió la foto?
            </p>
            <div className="flex gap-3 w-full">
              <Button
                onClick={uploadImage}
                variant="default"
                size="lg"
                className="flex-1"
              >
                Enviar factura
              </Button>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Volver a sacar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Uploading */}
        {step === "uploading" && (
          <div className="flex flex-col items-center space-y-4">
            <Card className="overflow-hidden">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Factura capturada"
                className="w-[300px] h-[400px] object-cover rounded-md opacity-75"
              />
            </Card>
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enviando factura...</span>
            </div>
          </div>
        )}

        {/* STEP 6: Success */}
        {step === "success" && serverResponse && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-green-600 mb-2">
                ¡Factura analizada!
              </h3>
              <div className="text-left space-y-2 bg-white p-4 rounded-lg shadow-sm border">
                <p className="text-sm">
                  <span className="font-medium">Compañía:</span> {serverResponse.data.company}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Categoría:</span> {serverResponse.data.category}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Monto:</span> ${serverResponse.data.totalAmount}
                </p>
                {serverResponse.data.date && (
                  <p className="text-sm">
                    <span className="font-medium">Fecha:</span> {serverResponse.data.date}
                  </p>
                )}
                {serverResponse.data.clientName && (
                  <p className="text-sm">
                    <span className="font-medium">Cliente:</span> {serverResponse.data.clientName}
                  </p>
                )}
                <div className="mt-4">
                  <p className="font-medium text-sm mb-2">Modalidades disponibles:</p>
                  <div className="space-y-2">
                    {serverResponse.data.modalities.map((modality: any, index: number) => (
                      <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                        <p className="font-medium">{modality.modalityTitle}</p>
                        {Object.entries(modality.identifiersEncontrados).map(([key, value]: [string, any]) => (
                          value && (
                            <p key={key} className="text-xs text-gray-600">
                              {key}: {value}
                            </p>
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={handleRetry}
              variant="default"
              size="lg"
              className="w-full"
            >
              Escanear otra factura
            </Button>
          </div>
        )}

        {/* ERROR state */}
        {step === "error" && (
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="text-center">
              <h3 className="font-semibold text-red-600 mb-2">Error</h3>
              <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
            </div>
            <Button
              onClick={handleRetry}
              variant="default"
              size="lg"
              className="w-full"
            >
              Intentar de nuevo
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

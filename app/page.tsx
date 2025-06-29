"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, Camera, AlertCircle, CheckCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface PredictionResult {
  [key: string]: any // Permitir cualquier estructura
}

// Clases exactas de tu modelo (las que me diste originalmente)
const FRUIT_CLASSES = {
  freshapples: { name: "Manzanas Frescas", emoji: "🍎", status: "good" },
  freshbanana: { name: "Plátano Fresco", emoji: "🍌", status: "good" },
  freshoranges: { name: "Naranjas Frescas", emoji: "🍊", status: "good" },
  rottenapples: { name: "Manzanas Podridas", emoji: "🍎", status: "bad" },
  rottenbanana: { name: "Plátano Podrido", emoji: "🍌", status: "bad" },
  rottenoranges: { name: "Naranjas Podridas", emoji: "🍊", status: "bad" },
}

export default function FruitDetectionApp() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [rawResponse, setRawResponse] = useState<string>("")

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 10MB")
      return
    }

    setSelectedFile(file)
    setError(null)
    setResult(null)
    setRawResponse("")

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const analyzeImage = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("https://backend-fast-api-deteccionfrutas.onrender.com/predict", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      const data = await response.json()
      console.log("Respuesta del backend:", data)

      // Usar directamente los campos que devuelve el backend
      setResult({
        predicted_class: data.class, // El backend devuelve "class"
        confidence: data.confidence,
        probabilities: data.probabilities || null,
      })
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error al analizar la imagen")
    } finally {
      setIsLoading(false)
    }
  }

  const resetApp = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setRawResponse("")
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  const getStatusColor = (status: string) => {
    return status === "good" ? "text-green-600" : "text-red-600"
  }

  const getStatusBg = (status: string) => {
    return status === "good" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
  }

  const getClassInfo = (className: string) => {
    if (!className) return { name: "Sin clasificar", emoji: "❓", status: "unknown" }

    // Buscar coincidencia exacta primero
    let classInfo = FRUIT_CLASSES[className as keyof typeof FRUIT_CLASSES]

    // Si no encuentra coincidencia exacta, buscar variaciones
    if (!classInfo) {
      // Mapear variaciones comunes
      const classMap: Record<string, string> = {
        freshapple: "freshapples",
        freshorange: "freshoranges",
        rottenapple: "rottenapples",
        rottenorange: "rottenoranges",
      }

      const mappedClass = classMap[className]
      if (mappedClass) {
        classInfo = FRUIT_CLASSES[mappedClass as keyof typeof FRUIT_CLASSES]
      }
    }

    if (classInfo) {
      return classInfo
    }

    return {
      name: `Clase: ${className}`,
      emoji: "❓",
      status: "unknown",
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🍎 Detección de Calidad en Frutas</h1>
          <p className="text-gray-600 text-lg">
            Detecta el estado de manzanas, plátanos y naranjas usando Inteligencia Artificial
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Subir Imagen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors relative ${
                    isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="w-16 h-16 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">Arrastra una imagen aquí</p>
                        <p className="text-sm text-gray-500">o haz clic para seleccionar</p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                {rawResponse && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <details>
                        <summary className="cursor-pointer font-medium">🔍 Ver respuesta RAW del backend</summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                          {rawResponse}
                        </pre>
                      </details>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={analyzeImage} disabled={!selectedFile || isLoading} className="flex-1">
                    {isLoading ? "Analizando..." : "Analizar Imagen"}
                  </Button>
                  <Button onClick={resetApp} variant="outline" disabled={isLoading}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {isLoading && (
                  <div>
                    <Progress value={undefined} className="w-full" />
                    <p className="text-sm text-gray-600 mt-2 text-center">Procesando imagen con IA...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resultados del Análisis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border-2 ${getStatusBg(getClassInfo(result.predicted_class).status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getClassInfo(result.predicted_class).emoji}</span>
                        <span className="font-semibold text-lg">{getClassInfo(result.predicted_class).name}</span>
                      </div>
                      <span
                        className={`font-bold text-lg ${getStatusColor(getClassInfo(result.predicted_class).status)}`}
                      >
                        {getClassInfo(result.predicted_class).status === "good" ? "FRESCA" : "PODRIDA"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Confianza: {(result.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Sube una imagen para ver los resultados del análisis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="font-semibold mb-2">🍎 Manzanas</h3>
                <p className="text-sm text-gray-600">Detecta manzanas frescas y podridas</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🍌 Plátanos</h3>
                <p className="text-sm text-gray-600">Identifica plátanos en buen y mal estado</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🍊 Naranjas</h3>
                <p className="text-sm text-gray-600">Analiza naranjas frescas y deterioradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

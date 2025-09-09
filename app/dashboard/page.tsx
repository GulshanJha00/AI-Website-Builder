"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, LogOut, Plus, Send, History, Code, Eye, Download, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { useRouter } from "next/navigation"

interface GeneratedWebsite {
  id: string
  prompt: string
  title: string
  createdAt: string
  code: string
  preview?: string
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedWebsites, setGeneratedWebsites] = useState<GeneratedWebsite[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<GeneratedWebsite | null>(null)
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate")
  const [error, setError] = useState("")

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError("")

    try {
      const response = await fetch("/api/generate-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate website")
      }

      const newWebsite: GeneratedWebsite = {
        id: Date.now().toString(),
        prompt: prompt,
        title: data.title || `Website ${generatedWebsites.length + 1}`,
        createdAt: new Date().toISOString(),
        code: data.code,
      }

      setGeneratedWebsites((prev) => [newWebsite, ...prev])
      setSelectedWebsite(newWebsite)
      setPrompt("")

      // Save to localStorage for persistence
      const savedWebsites = JSON.parse(localStorage.getItem("generated-websites") || "[]")
      savedWebsites.unshift(newWebsite)
      localStorage.setItem("generated-websites", JSON.stringify(savedWebsites.slice(0, 50))) // Keep only last 50
    } catch (err) {
      console.error("Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate website")
    } finally {
      setIsGenerating(false)
    }
  }

  useState(() => {
    const savedWebsites = JSON.parse(localStorage.getItem("generated-websites") || "[]")
    setGeneratedWebsites(savedWebsites)
  })

  const downloadWebsite = (website: GeneratedWebsite) => {
    const blob = new Blob([website.code], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${website.title.toLowerCase().replace(/\s+/g, "-")}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">WebCraft AI</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">AI Website Builder</h1>
              <p className="text-muted-foreground">Describe your website and watch AI bring it to life</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={activeTab === "generate" ? "default" : "ghost"}
                onClick={() => setActiveTab("generate")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Generate
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "ghost"}
                onClick={() => setActiveTab("history")}
                className="flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                History ({generatedWebsites.length})
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel */}
              <div className="space-y-6">
                {activeTab === "generate" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Describe Your Website
                      </CardTitle>
                      <CardDescription>
                        Tell our AI what kind of website you want to create. Be as detailed as possible for better
                        results.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Textarea
                        placeholder="Example: Create a modern landing page for a fitness app with a hero section, features, testimonials, and pricing. Use a blue and white color scheme with clean typography..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                        className="resize-none"
                        disabled={isGenerating}
                      />
                      <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Website...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Generate Website
                          </>
                        )}
                      </Button>

                      {/* Example Prompts */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Try these examples:</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() =>
                              setPrompt(
                                "Create a modern portfolio website for a web developer with dark theme, project showcase, and contact form",
                              )
                            }
                          >
                            Portfolio Site
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() =>
                              setPrompt(
                                "Build a landing page for a SaaS product with hero section, pricing tiers, testimonials, and call-to-action buttons",
                              )
                            }
                          >
                            SaaS Landing
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() =>
                              setPrompt(
                                "Design a restaurant website with menu, location map, reservation form, and photo gallery",
                              )
                            }
                          >
                            Restaurant Site
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === "history" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Generated Websites</CardTitle>
                      <CardDescription>Your previously generated websites</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {generatedWebsites.length === 0 ? (
                        <div className="text-center py-8">
                          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No websites generated yet</p>
                          <Button variant="ghost" onClick={() => setActiveTab("generate")} className="mt-2">
                            Create your first website
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {generatedWebsites.map((website) => (
                            <div
                              key={website.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedWebsite?.id === website.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => setSelectedWebsite(website)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium">{website.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{website.prompt}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(website.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Panel - Preview */}
              <div className="space-y-6">
                {selectedWebsite ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Preview: {selectedWebsite.title}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedWebsite.code)
                              // You could add a toast notification here
                            }}
                          >
                            <Code className="w-4 h-4 mr-2" />
                            Copy Code
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => downloadWebsite(selectedWebsite)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <CardDescription>Generated from: "{selectedWebsite.prompt}"</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <iframe
                          srcDoc={selectedWebsite.code}
                          className="w-full h-96 border-0"
                          title="Website Preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Website Selected</h3>
                        <p className="text-muted-foreground">
                          Generate a new website or select one from your history to see the preview
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

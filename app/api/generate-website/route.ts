import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const enhancedPrompt = `
You are an expert web developer. Create a complete, modern, and responsive HTML website based on the following description: "${prompt}"

Requirements:
1. Generate a complete HTML document with DOCTYPE, head, and body
2. Include inline CSS for styling (no external stylesheets)
3. Make it responsive and mobile-friendly
4. Use modern CSS techniques (flexbox, grid where appropriate)
5. Include semantic HTML elements
6. Add some interactive elements if relevant (hover effects, etc.)
7. Use a professional color scheme and typography
8. Make it visually appealing and functional
9. Include placeholder content that matches the theme
10. Ensure good contrast and accessibility

Return ONLY the HTML code, no explanations or markdown formatting.
`

    const result = await model.generateContent(enhancedPrompt)
    const response = await result.response
    const generatedCode = response.text()

    // Clean up the response to ensure it's valid HTML
    const cleanedCode = generatedCode
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .trim()

    return NextResponse.json({
      success: true,
      code: cleanedCode,
      title: extractTitleFromPrompt(prompt),
    })
  } catch (error) {
    console.error("Error generating website:", error)
    return NextResponse.json({ error: "Failed to generate website. Please try again." }, { status: 500 })
  }
}

function extractTitleFromPrompt(prompt: string): string {
  // Simple title extraction logic
  const words = prompt.toLowerCase().split(" ")

  if (words.includes("portfolio")) return "Portfolio Website"
  if (words.includes("restaurant")) return "Restaurant Website"
  if (words.includes("blog")) return "Blog Website"
  if (words.includes("ecommerce") || words.includes("shop")) return "E-commerce Website"
  if (words.includes("landing")) return "Landing Page"
  if (words.includes("saas")) return "SaaS Website"
  if (words.includes("business")) return "Business Website"

  return "Generated Website"
}

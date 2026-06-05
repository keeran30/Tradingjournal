// /app/api/search/route.ts
import { NextResponse } from "next/server"
import { searchAssets } from "@/app/data/assets"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""
    
    console.log("Searching for:", query)
    
    const results = searchAssets(query)
    
    // Ensure results is always an array
    if (!results || !Array.isArray(results)) {
      console.log("Results is not an array, returning empty array")
      return NextResponse.json([])
    }
    
    console.log(`Found ${results.length} results`)
    return NextResponse.json(results)
    
  } catch (error) {
    console.error("Search API error:", error)
    // Always return an empty array on error
    return NextResponse.json([])
  }
}
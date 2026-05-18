// Supabase Edge Function to proxy BPS API requests
// This bypasses CORS and WAF issues by making requests from server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BPS_API_BASE = "https://webapi.bps.go.id";
const BPS_API_KEY = Deno.env.get("BPS_API_KEY") || "";

// Simple in-memory cache (will reset on function cold start)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // prov, kabbyprov, etc.
    const prov = url.searchParams.get("prov"); // province code for regencies
    
    if (!type) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' parameter" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Build cache key
    const cacheKey = `${type}-${prov || "all"}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Cache": "HIT"
        },
      });
    }

    // Build BPS API URL
    let bpsUrl = `${BPS_API_BASE}/v1/api/domain?type=${type}&key=${BPS_API_KEY}`;
    if (prov) {
      bpsUrl += `&prov=${prov}`;
    }

    console.log(`🔍 Fetching from BPS API: ${type}${prov ? ` (prov: ${prov})` : ''}`);

    // Fetch from BPS API with custom headers to avoid WAF
    const response = await fetch(bpsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://webapi.bps.go.id/",
      },
    });

    if (!response.ok) {
      console.error(`❌ BPS API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: "BPS API error", 
          status: response.status,
          message: response.statusText 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const data = await response.json();

    // Cache the result
    cache.set(cacheKey, { data, timestamp: Date.now() });
    console.log(`✅ Cached ${cacheKey} - ${data.data?.[1]?.length || 0} items`);

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cache": "MISS"
      },
    });

  } catch (error) {
    console.error("❌ Error in BPS proxy:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

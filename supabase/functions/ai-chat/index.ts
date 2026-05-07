import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: any[]
  tool_call_id?: string
}

interface ChatRequest {
  message: string
  history?: ChatMessage[]
}

// Define available tools for AI
const AVAILABLE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_employee_by_name',
      description: 'Search for employees by name. Use this when user asks about a specific person by name.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name to search for (can be partial name)'
          }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_statistics',
      description: 'Get comprehensive employee statistics including total, PNS, CPNS, PPPK, distributions. Use this for questions about "berapa jumlah", "total", "statistik".',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            description: 'Optional department name to filter statistics. Use null for all departments.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'count_employees_by_position_and_department',
      description: 'Count employees by specific position name in a department. Use this for questions like "berapa orang Instruktur di BBPVP Bekasi".',
      parameters: {
        type: 'object',
        properties: {
          position_name: {
            type: 'string',
            description: 'Position name to search for (e.g., "Instruktur Ahli Pertama")'
          },
          department: {
            type: 'string',
            description: 'Department name (e.g., "BBPVP Bekasi")'
          }
        },
        required: ['position_name', 'department']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_employees_by_position_and_department',
      description: 'Get list of employees by position in a department. Use this for "siapa saja Instruktur di BBPVP Bekasi".',
      parameters: {
        type: 'object',
        properties: {
          position_name: {
            type: 'string',
            description: 'Position name'
          },
          department: {
            type: 'string',
            description: 'Department name'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default 50)'
          }
        },
        required: ['position_name', 'department']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_position_breakdown_by_department',
      description: 'Get detailed position breakdown for a department. Use for "distribusi jabatan di X".',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            description: 'Department name'
          }
        },
        required: ['department']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_employees_by_department',
      description: 'Get list of employees in a department.',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            description: 'Department name'
          },
          limit: {
            type: 'number',
            description: 'Maximum results (default 50)'
          }
        },
        required: ['department']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_retirement_forecast',
      description: 'Get retirement forecast for next N years. Use for questions about "pegawai yang akan pensiun".',
      parameters: {
        type: 'object',
        properties: {
          years_ahead: {
            type: 'number',
            description: 'Number of years to forecast (default 5)'
          },
          department: {
            type: 'string',
            description: 'Optional department filter'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_newest_employees',
      description: 'Get newest employees by join date.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of employees (default 10)'
          },
          department: {
            type: 'string',
            description: 'Optional department filter'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_senior_employees',
      description: 'Get most senior employees by join date.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of employees (default 10)'
          },
          department: {
            type: 'string',
            description: 'Optional department filter'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'compare_departments',
      description: 'Compare statistics between two departments.',
      parameters: {
        type: 'object',
        properties: {
          department1: {
            type: 'string',
            description: 'First department name'
          },
          department2: {
            type: 'string',
            description: 'Second department name'
          }
        },
        required: ['department1', 'department2']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_all_departments',
      description: 'Get list of all departments with employee count.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_summary',
      description: 'Get comprehensive summary for a specific employee by name or NIP.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Name or NIP to search'
          }
        },
        required: ['search']
      }
    }
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError) {
      throw new Error('User role not found')
    }

    const userRole = roleData?.role
    const userDepartment = profile.department
    const { message, history = [] }: ChatRequest = await req.json()

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured')
    }

    const isAdminPusat = userRole === 'admin_pusat'
    const canViewAll = isAdminPusat || (userRole === 'admin_pimpinan' && userDepartment === 'Pusat')

    // Build system prompt
    const systemPrompt = buildSystemPrompt(profile, canViewAll, userRole)

    // Prepare messages
    let messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ]

    console.log('Starting AI conversation with tools')
    
    // Call DeepSeek with tools (may need multiple iterations)
    let iterations = 0
    const maxIterations = 5
    
    while (iterations < maxIterations) {
      iterations++
      console.log(`Iteration ${iterations}`)
      
      const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          tools: AVAILABLE_TOOLS,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!deepseekResponse.ok) {
        const errorText = await deepseekResponse.text()
        console.error('DeepSeek API error:', errorText)
        throw new Error(`DeepSeek API error: ${deepseekResponse.status}`)
      }

      const deepseekData = await deepseekResponse.json()
      const assistantMessage = deepseekData.choices[0].message

      // Check if AI wants to call a tool
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('AI wants to call tools:', assistantMessage.tool_calls.length)
        
        // Add assistant message with tool calls
        messages.push(assistantMessage)
        
        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          
          console.log(`Calling function: ${functionName}`, functionArgs)
          
          try {
            const result = await executeFunction(supabase, functionName, functionArgs, canViewAll, userDepartment)
            
            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            })
            
            console.log(`Function ${functionName} executed successfully`)
          } catch (error) {
            console.error(`Error executing function ${functionName}:`, error)
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: error.message })
            })
          }
        }
        
        // Continue loop to get AI's response with the tool results
        continue
      }
      
      // No more tool calls, return final response
      return new Response(
        JSON.stringify({
          message: assistantMessage.content,
          usage: deepseekData.usage
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }
    
    // Max iterations reached
    throw new Error('Max iterations reached')
    
  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function executeFunction(
  supabase: any,
  functionName: string,
  args: any,
  canViewAll: boolean,
  userDepartment: string
) {
  // Map function names to RPC calls
  const functionMap: Record<string, string> = {
    'search_employee_by_name': 'ai_search_employee_by_name',
    'get_employee_statistics': 'ai_get_employee_statistics',
    'count_employees_by_position_and_department': 'ai_count_employees_by_position_and_department',
    'get_employees_by_position_and_department': 'ai_get_employees_by_position_and_department',
    'get_position_breakdown_by_department': 'ai_get_position_breakdown_by_department',
    'get_employees_by_department': 'ai_get_employees_by_department',
    'get_retirement_forecast': 'ai_get_retirement_forecast',
    'get_newest_employees': 'ai_get_newest_employees',
    'get_senior_employees': 'ai_get_senior_employees',
    'compare_departments': 'ai_compare_departments',
    'get_all_departments': 'ai_get_all_departments',
    'get_employee_summary': 'ai_get_employee_summary'
  }
  
  const rpcName = functionMap[functionName]
  if (!rpcName) {
    throw new Error(`Unknown function: ${functionName}`)
  }
  
  // Map arguments to RPC parameters
  const rpcParams: Record<string, any> = {}
  
  switch (functionName) {
    case 'search_employee_by_name':
      rpcParams.p_search_name = args.name
      rpcParams.p_limit = args.limit || 10
      break
    case 'get_employee_statistics':
      rpcParams.p_department = canViewAll ? (args.department || null) : userDepartment
      break
    case 'count_employees_by_position_and_department':
      rpcParams.p_position_name = args.position_name
      rpcParams.p_department = args.department
      break
    case 'get_employees_by_position_and_department':
      rpcParams.p_position_name = args.position_name
      rpcParams.p_department = args.department
      rpcParams.p_limit = args.limit || 50
      break
    case 'get_position_breakdown_by_department':
      rpcParams.p_department = args.department
      break
    case 'get_employees_by_department':
      rpcParams.p_department = args.department
      rpcParams.p_limit = args.limit || 50
      break
    case 'get_retirement_forecast':
      rpcParams.p_years_ahead = args.years_ahead || 5
      rpcParams.p_department = canViewAll ? (args.department || null) : userDepartment
      break
    case 'get_newest_employees':
      rpcParams.p_limit = args.limit || 10
      rpcParams.p_department = canViewAll ? (args.department || null) : userDepartment
      break
    case 'get_senior_employees':
      rpcParams.p_limit = args.limit || 10
      rpcParams.p_department = canViewAll ? (args.department || null) : userDepartment
      break
    case 'compare_departments':
      rpcParams.p_department1 = args.department1
      rpcParams.p_department2 = args.department2
      break
    case 'get_employee_summary':
      rpcParams.p_search = args.search
      break
  }
  
  const { data, error } = await supabase.rpc(rpcName, rpcParams)
  
  if (error) {
    throw new Error(`RPC error: ${error.message}`)
  }
  
  return data
}

function buildSystemPrompt(profile: any, canViewAll: boolean, userRole: string) {
  const department = profile.department
  const fullName = profile.full_name

  return `Anda adalah AI Assistant untuk Sistem Manajemen Pegawai Lavotas (SIMPEL).

INFORMASI USER:
- Nama: ${fullName}
- Role: ${userRole === 'admin_pusat' ? 'Admin Pusat' : userRole === 'admin_unit' ? 'Admin Unit' : 'Admin Pimpinan'}
- Unit Kerja: ${department}
- Akses Data: ${canViewAll ? 'Semua unit kerja' : `Hanya unit ${department}`}

KEMAMPUAN ANDA:
Anda memiliki akses ke berbagai function untuk mengambil data pegawai:
1. search_employee_by_name - Cari pegawai berdasarkan nama
2. get_employee_statistics - Dapatkan statistik lengkap pegawai
3. count_employees_by_position_and_department - Hitung pegawai per jabatan & unit
4. get_employees_by_position_and_department - List pegawai per jabatan & unit
5. get_position_breakdown_by_department - Breakdown detail jabatan per unit
6. get_employees_by_department - List pegawai per unit
7. get_retirement_forecast - Proyeksi pensiun
8. get_newest_employees - Pegawai terbaru
9. get_senior_employees - Pegawai paling senior
10. compare_departments - Bandingkan 2 unit kerja
11. get_all_departments - List semua unit kerja
12. get_employee_summary - Ringkasan lengkap pegawai

INSTRUKSI PENTING:
1. **Gunakan function tools** untuk mendapatkan data yang akurat
2. **Jangan mengarang data** - selalu gunakan hasil dari function calls
3. **Pilih function yang tepat** berdasarkan pertanyaan user
4. **Format jawaban dengan rapi** menggunakan tabel, bullet points, atau numbering
5. **Gunakan emoji** untuk membuat jawaban lebih menarik (📊 📈 👥 🎖️ 💼)
6. **Berikan insight** dari data yang didapat
7. **Gunakan bahasa Indonesia** yang profesional dan ramah

CONTOH PENGGUNAAN:
Q: "Berapa orang Instruktur Ahli Pertama di BBPVP Bekasi?"
A: Gunakan count_employees_by_position_and_department dengan position_name="Instruktur Ahli Pertama" dan department="BBPVP Bekasi"

Q: "Siapa saja pegawai yang akan pensiun 3 tahun ke depan?"
A: Gunakan get_retirement_forecast dengan years_ahead=3

Q: "Bandingkan BBPVP Bekasi dengan BBPVP Bandung"
A: Gunakan compare_departments dengan department1="BBPVP Bekasi" dan department2="BBPVP Bandung"

Jawab pertanyaan user dengan profesional, akurat, dan informatif! 🚀`
}

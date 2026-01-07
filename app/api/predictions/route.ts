import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'
import type { VariantAnalysisResult } from '@/lib/types'

async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error) {
    console.error('Error validating prediction token', error)
    return null
  }
  return data.user ?? null
}

async function ensureSessionOwned(sessionId: string, userId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const position = searchParams.get('position')
    const chromosome = searchParams.get('chromosome')
    const reference = searchParams.get('reference')
    const alternative = searchParams.get('alternative')

    if (position && chromosome && reference && alternative !== null) {
      const normalizedAlt = alternative === "" || alternative === "-" ? "" : alternative.toUpperCase()
      
      // If session_id is provided, check session-specific cache first
      if (sessionId) {
        const owned = await ensureSessionOwned(sessionId, user.id)
        if (owned) {
          const { data: sessionPrediction, error: sessionError } = await supabase
            .from('predictions')
            .select('*')
            .eq('session_id', sessionId)
            .eq('position', parseInt(position))
            .eq('chromosome', chromosome)
            .eq('reference', reference.toUpperCase())
            .eq('alternative', normalizedAlt)
            .maybeSingle()

          if (sessionError && sessionError.code !== 'PGRST116') throw sessionError
          if (sessionPrediction) {
            return NextResponse.json({ prediction: sessionPrediction })
          }
        }
      }
      
      // Fallback to global cache (any prediction with these parameters)
      // This allows sharing predictions across users for the same variant
      const { data: prediction, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('position', parseInt(position))
        .eq('chromosome', chromosome)
        .eq('reference', reference.toUpperCase())
        .eq('alternative', normalizedAlt)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      return NextResponse.json({ prediction: prediction || null })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const owned = await ensureSessionOwned(sessionId, user.id)
    if (!owned) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch predictions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const body = await request.json()
    const { session_id, result } = body as { session_id: string; result: VariantAnalysisResult }

    if (!session_id || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, result' },
        { status: 400 }
      )
    }

    const owned = await ensureSessionOwned(session_id, user.id)
    if (!owned) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Normalize reference/alternative so cache lookups are consistent across callers
    const normalizedRef = (result.reference || "").toUpperCase()
    let normalizedAlt = (result.alternative || "").toUpperCase()
    // Treat deletions as empty-string alternative in storage
    const mutationType = (result as any).mutationType as string | undefined
    if (mutationType === 'DELETION' || normalizedAlt === '-') {
      normalizedAlt = ''
    }

    const { data: prediction, error } = await supabase
      .from('predictions')
      .insert({
        session_id,
        position: result.position,
        chromosome: result.chromosome,
        reference: normalizedRef,
        alternative: normalizedAlt,
        delta_score: result.deltaScore,
        prediction: result.prediction,
        confidence: result.confidence,
        gene_symbol: result.geneSymbol || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ prediction })
  } catch (error) {
    console.error('Error saving prediction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save prediction' },
      { status: 500 }
    )
  }
}


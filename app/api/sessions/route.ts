import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'

async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error) {
    console.error('Error validating user token:', error)
    return null
  }
  return data.user ?? null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (sessionId) {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*, predictions(*)')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return NextResponse.json({ session })
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, name, genome_assembly, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
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
    const { name, genome_assembly, selected_gene } = body

    if (!name || !genome_assembly) {
      return NextResponse.json(
        { error: 'Missing required fields: name, genome_assembly' },
        { status: 400 }
      )
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        name,
        genome_assembly,
        selected_gene: selected_gene || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const body = await request.json()
    const { id, name, genome_assembly, selected_gene } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    }

    const { data: sessionOwner } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sessionOwner) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name
    if (genome_assembly !== undefined) updateData.genome_assembly = genome_assembly
    if (selected_gene !== undefined) updateData.selected_gene = selected_gene

    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    }

    const { data: sessionOwner } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sessionOwner) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    await supabase.from('predictions').delete().eq('session_id', sessionId)

    const { error } = await supabase.from('sessions').delete().eq('id', sessionId).eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete session' },
      { status: 500 }
    )
  }
}


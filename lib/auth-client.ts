"use client"

import { supabase } from "./supabase"

export async function getSessionToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Failed to get session", error)
    return null
  }
  return data.session?.access_token ?? null
}

export async function buildAuthHeaders(base?: HeadersInit) {
  const token = await getSessionToken()
  const headers = new Headers(base)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return headers
}

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
  const headers = await buildAuthHeaders(init?.headers)
  return fetch(input, { ...init, headers })
}

export async function requireUserSession() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}


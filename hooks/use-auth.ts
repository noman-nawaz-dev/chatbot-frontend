"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"

export interface AuthUserProfile {
  id: string
  email: string | null
  first_name?: string | null
  last_name?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const ensuredUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const getSession = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (isMounted) {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
            first_name: (session.user.user_metadata as any)?.first_name ?? null,
            last_name: (session.user.user_metadata as any)?.last_name ?? null,
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    }

    getSession()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
          first_name: (session.user.user_metadata as any)?.first_name ?? null,
          last_name: (session.user.user_metadata as any)?.last_name ?? null,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Ensure a corresponding row exists in public.users when a user logs in the first time
  useEffect(() => {
    const ensureUserRow = async () => {
      if (!user) return
      if (ensuredUserIdRef.current === user.id) return
      try {
        const firstName: string | null = user.first_name ?? ((user as any)?.user_metadata?.given_name ?? null)
        const lastName: string | null = user.last_name ?? ((user as any)?.user_metadata?.family_name ?? null)

        await supabase
          .from("users")
          .upsert(
            [
              {
                id: user.id,
                email: user.email ?? null,
                first_name: firstName,
                last_name: lastName,
              },
            ],
            { onConflict: "id" },
          )
        ensuredUserIdRef.current = user.id
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to upsert user profile:", err)
      }
    }

    ensureUserRow()
  }, [user])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { user, loading, signOut }
}


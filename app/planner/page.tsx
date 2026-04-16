'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PlannerPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/planner/day')
  }, [router])

  return null
}

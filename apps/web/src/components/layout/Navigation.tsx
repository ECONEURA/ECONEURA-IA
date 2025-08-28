import Link from 'next/link'
import React from 'react'

export function Navigation() {
  return (
    <nav className="w-64 fixed left-0 top-0 bottom-0 bg-white/90 p-4 shadow-md">
      <div className="mb-6 font-bold">EcoNeura</div>
      <ul className="space-y-2">
        <li>
          <Link href="/crm">CRM</Link>
        </li>
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
      </ul>
    </nav>
  )
}

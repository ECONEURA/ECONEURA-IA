import React from 'react'
import Link from 'next/link'

export default function CRMPage() {
	return (
		<main className="p-8">
			<h1 className="text-3xl font-bold mb-4">CRM</h1>
			<p className="mb-6">Bienvenido al panel CRM. Usa los enlaces para crear recursos:</p>
			<ul className="space-y-2">
				<li>
					<Link className="text-blue-600 underline" href="/crm/contacts/new">Nuevo contacto</Link>
				</li>
				<li>
					<Link className="text-blue-600 underline" href="/crm/companies/new">Nueva empresa</Link>
				</li>
				<li>
					<Link className="text-blue-600 underline" href="/crm/deals/new">Nuevo trato</Link>
				</li>
				<li>
					<Link className="text-blue-600 underline" href="/crm/meetings/new">Nueva reunión</Link>
				</li>
			</ul>
		</main>
	)
}

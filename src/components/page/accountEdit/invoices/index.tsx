import React from 'react'
import { format } from 'date-fns'

import Link from '@/components/shared/link'
import { gql, useQuery } from '@/components/api'
import Loading from '@/components/shared/loader'
import MessageError from '@/components/shared/messageError'

export default function Invoices() {
	let {
		data: invoices,
		loading: loadingInvoices,
		error: errorInvoices,
	} = useQuery(gql`
		query getInvoices {
			invoices {
				url
				date
				total
				currency
			}
		}
	`)

	if (errorInvoices) {
		return <MessageError error={errorInvoices} />
	}

	if (loadingInvoices) {
		return <Loading />
	}

	return (
		<div>
			{invoices?.invoices?.length > 0 && (
				<div style={{ margin: '10px 0' }}>
					<h3>Invoices</h3>
					<table>
						<thead style={{ fontSize: 10 }}>
							<tr>
								<td style={{ width: 200 }}>Date</td>
								<td style={{ minWidth: 100 }}>Price</td>
							</tr>
						</thead>
						<tbody>
							{invoices.invoices.map((invoice) => {
								const formatter = new Intl.NumberFormat('en-US', {
									style: 'currency',
									currency: invoice.currency,

									// These options are needed to round to whole numbers if that's what you want.
									//minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
									//maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
								})

								return (
									<tr key={invoice.url}>
										<td>
											{format(new Date(invoice.date), 'dd MMMM yyyy, hh:mm')}
										</td>
										<td>{formatter.format(invoice.total / 100)}</td>
										<td>
											<Link href={invoice.url}>PDF</Link>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

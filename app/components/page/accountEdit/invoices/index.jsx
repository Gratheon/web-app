"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const date_fns_1 = require("date-fns");
const link_1 = __importDefault(require("../../../shared/link"));
const api_1 = require("../../../api");
const loader_1 = __importDefault(require("../../../shared/loader"));
const messageError_1 = __importDefault(require("../../../shared/messageError"));
function Invoices() {
    let { data: invoices, loading: loadingInvoices, error: errorInvoices, } = (0, api_1.useQuery)((0, api_1.gql) `
		query getInvoices {
			invoices {
				url
				date
				total
				currency
			}
		}
	`);
    if (errorInvoices) {
        return <messageError_1.default error={errorInvoices}/>;
    }
    if (loadingInvoices) {
        return <loader_1.default />;
    }
    return (<div>
			{invoices?.invoices?.length > 0 && (<div style={{ margin: '10px 0' }}>
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
                });
                return (<tr key={invoice.url}>
										<td>
											{(0, date_fns_1.format)(new Date(invoice.date), 'dd MMMM yyyy, hh:mm')}
										</td>
										<td>{formatter.format(invoice.total / 100)}</td>
										<td>
											<link_1.default href={invoice.url}>PDF</link_1.default>
										</td>
									</tr>);
            })}
						</tbody>
					</table>
				</div>)}
		</div>);
}
exports.default = Invoices;

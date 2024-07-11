const moment = require("moment/moment");
const prisma = require("../../prisma/prisma");

const { listInvoices } = require("../../utils/stripe");

const fetchFromStripe = async (req, res, next) => {
	try {
		let hasMore = true;
		let startingAfter = null;
		while (hasMore) {
			const invoices = await listInvoices(startingAfter);
			for (const invoice of invoices.data) {
				const customerId = invoice.customer;
				const subscriptionId = invoice.subscription;

				const user = await prisma.users.findFirst({
					select: {
						id: true,
					},
					where: {
						stripe_customer_id: customerId,
					},
				});

				if (user) {
					await prisma.invoices.upsert({
						where: {
							stripe_invoice_id: invoice.id,
						},
						update: {
							amount_paid: invoice.amount_paid / 100.0,
							hosted_url: invoice.hosted_invoice_url,
							pdf_url: invoice.invoice_pdf,
							paid_at: moment(invoice.status_transitions.paid_at * 1000).toISOString(),
							user_id: user.id,
							stripe_subscription_id: subscriptionId,
							stripe_invoice_id: invoice.id,
						},
						create: {
							amount_paid: invoice.amount_paid / 100.0,
							hosted_url: invoice.hosted_invoice_url,
							pdf_url: invoice.invoice_pdf,
							paid_at: moment(invoice.status_transitions.paid_at * 1000).toISOString(),
							user_id: user.id,
							stripe_subscription_id: subscriptionId,
							stripe_invoice_id: invoice.id,
						},
					});
				}

				startingAfter = invoice.id;
			}

			hasMore = invoices.has_more;
		}

		sendSuccessResponse(res, 200, "Transactions fetched from stripe successfully");
	} catch (error) {
		next(error);
	}
};

module.exports = { index, fetchFromStripe };

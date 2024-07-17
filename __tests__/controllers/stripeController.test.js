process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../../server");

describe("testing stripeController", () => {
	test("testing /stripe/success api endpoint", (done) => {
		request(app)
			.get("/stripe/success")
			.end((err, res) => {
				if (err) return done(err);
				expect(res.status).toBe(200);
				expect(res.body.success).toBe(true);
				expect(res.body.message).toBe("OK");
				expect(res.body.data).toBe(null);
				done();
			});
	});

	describe("testing /stripe/webhooks api endpoint", () => {
		test("with invalid signature", (done) => {
			request(app)
				.post("/stripe/webhooks")
				.set("stripe-signature", "")
				.end((err, res) => {
					if (err) return done(err);
					expect(res.status).toBe(403);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toBe("Access Denied.");
					expect(res.body.data.type).toBe("StripeSignatureVerificationError");
					done();
				});
		});

		test("with a customer.subscription.created event", (done) => {
			request(app)
				.post("/stripe/webhooks")
				.set("stripe-signature", "test-signature") // this signature bypasses signature validation for test environment
				.send({
					event: {
						type: "customer.subscription.created",
						data: {
							object: {
								id: "test_stripe_subscription_id_2",
								customer: "test_stripe_customer_id",
							},
						},
					},
				})
				.end((err, res) => {
					if (err) return done(err);
					expect(res.status).toBe(200);
					expect(res.body.success).toBe(true);
					expect(res.body.message).toBe("OK");
					done();
				});
		});

		test("with a customer.subscription.updated event", (done) => {
			request(app)
				.post("/stripe/webhooks")
				.set("stripe-signature", "test-signature") // this signature bypasses signature validation for test environment
				.send({
					event: {
						type: "customer.subscription.updated",
						data: {
							object: {
								id: "test_stripe_subscription_id_2",
								customer: "test_stripe_customer_id",
							},
						},
					},
				})
				.end((err, res) => {
					if (err) return done(err);
					expect(res.status).toBe(200);
					expect(res.body.success).toBe(true);
					expect(res.body.message).toBe("OK");
					done();
				});
		});

		test("with a customer.subscription.deleted event", (done) => {
			request(app)
				.post("/stripe/webhooks")
				.set("stripe-signature", "test-signature") // this signature bypasses signature validation for test environment
				.send({
					event: {
						type: "customer.subscription.deleted",
						data: {
							object: {
								id: "test_stripe_subscription_id_2",
								customer: "test_stripe_customer_id",
							},
						},
					},
				})
				.end((err, res) => {
					if (err) return done(err);
					expect(res.status).toBe(200);
					expect(res.body.success).toBe(true);
					expect(res.body.message).toBe("OK");
					done();
				});
		});

		test("with a payment_method.attached event", (done) => {
			request(app)
				.post("/stripe/webhooks")
				.set("stripe-signature", "test-signature") // this signature bypasses signature validation for test environment
				.send({
					event: {
						type: "payment_method.attached",
						data: {
							object: {
								id: "test_stripe_payment_method_id",
								customer: "test_stripe_customer_id",
							},
						},
					},
				})
				.end((err, res) => {
					if (err) return done(err);
					expect(res.status).toBe(200);
					expect(res.body.success).toBe(true);
					expect(res.body.message).toBe("OK");
					done();
				});
		});

		test("with a payment_method.detached event", (done) => {
			request(app)
				.post("/stripe/webhooks")
				.set("stripe-signature", "test-signature") // this signature bypasses signature validation for test environment
				.send({
					event: {
						type: "payment_method.detached",
						data: {
							object: {
								id: "test_stripe_payment_method_id",
								customer: "test_stripe_customer_id",
							},
						},
					},
				})
				.end((err, res) => {
					if (err) return done(err);
					expect(res.status).toBe(200);
					expect(res.body.success).toBe(true);
					expect(res.body.message).toBe("OK");
					done();
				});
		});

		test("with a invoice.paid event", (done) => {
			request(app)
				.post("/stripe/webhooks")
				.set("stripe-signature", "test-signature") // this signature bypasses signature validation for test environment
				.send({
					event: {
						type: "invoice.paid",
						data: {
							object: {
								id: "test_stripe_invoice_id",
								customer: "test_stripe_customer_id",
							},
						},
					},
				})
				.end((err, res) => {
					if (err) return done(err);
					expect(res.status).toBe(200);
					expect(res.body.success).toBe(true);
					expect(res.body.message).toBe("OK");
					done();
				});
		});
	});
});

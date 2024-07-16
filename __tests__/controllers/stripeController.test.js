const request = require("supertest");
const app = require("../../test-server");

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

test("testing /stripe/webhooks api endpoint with invalid signature", (done) => {
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

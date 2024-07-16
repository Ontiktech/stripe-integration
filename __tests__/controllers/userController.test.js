const request = require("supertest");
const app = require("../../test-server");

test("testing /users/:id api endpoint with valid user id", (done) => {
	request(app)
		.get("/users/1")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("OK");
			expect(res.body.data.id).toBe(1);
			done();
		});
});

test("testing /users/:id api endpoint with invalid user id", (done) => {
	request(app)
		.get("/users/0")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("User does not exist.");
			expect(res.body.data).toBe(null);
			done();
		});
});

test("testing /users/:id/portal api endpoint for invalid user", (done) => {
	request(app)
		.get("/users/0/portal")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("User does not exist.");
			expect(res.body.data).toBe(null);
			done();
		});
});

test("testing /users/:id/portal api endpoint for unsubscribed user", (done) => {
	request(app)
		.get("/users/2/portal")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(303);
			done();
		});
});

test("testing /users/:id/portal api endpoint for subscribed user", (done) => {
	request(app)
		.get("/users/3/portal")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(303);
			done();
		});
});

test("testing /users/:id/subscription api endpoint for invalid user", (done) => {
	request(app)
		.get("/users/0/subscription")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("User does not exist.");
			expect(res.body.data).toBe(null);
			done();
		});
});

test("testing /users/:id/subscription api endpoint for unsubscribed user", (done) => {
	request(app)
		.get("/users/1/subscription")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("User is not subscribed.");
			expect(res.body.data).toBe(null);
			done();
		});
});

test("testing /users/:id/subscription api endpoint for user with fake subscription id", (done) => {
	request(app)
		.get("/users/3/subscription")
		.end((err, res) => {
			if (err) return done(err);
			/**
			 * this user has a fake subscription id, so it will return an error response
			 * in production it should return a success response
			 */
			expect(res.status).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("Internal server error");
			done();
		});
});

test("testing /users/:id/invoices api endpoint for invalid user", (done) => {
	request(app)
		.get("/users/0/invoices")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("User does not exist.");
			expect(res.body.data).toBe(null);
			done();
		});
});

test("testing /users/:id/invoices api endpoint for user who is not a customer in stripe", (done) => {
	request(app)
		.get("/users/1/invoices")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("OK");
			expect(res.body.data.data).toStrictEqual([]);
			done();
		});
});

test("testing /users/:id/invoices api endpoint for user who is a customer in stripe", (done) => {
	request(app)
		.get("/users/2/invoices")
		.end((err, res) => {
			if (err) return done(err);
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("OK");
			expect(res.body.data.data).toStrictEqual([]); // this user has no invoices
			done();
		});
});

// MongoDB initialization script
db = db.getSiblingDB("tasks_cash");

db.createUser({
  user: "tasks_cash",
  pwd: "tasks_cash_secret",
  roles: [{ role: "readWrite", db: "tasks_cash" }],
});

print("[MongoDB Init] tasks_cash database and user created");

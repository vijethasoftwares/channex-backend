const UserRoles = Object.freeze({
  ADMIN: "Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  USER: "User",
  ACCOUNTANT: "Accountant",
  SALESMANAGER: "SalesManager",
  SUPERVISOR: "Supervisor",
  CHEF: "Chef",
});

const paymentStatus = Object.freeze({
  PAID: "Paid",
  NOTPAID: "Not Paid",
});

module.exports = { UserRoles, paymentStatus };

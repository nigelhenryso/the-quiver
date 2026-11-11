// dummy data for the org dashboard
// NOTE: replace this with real data

export type Order = {
  id: number;
  customerName: string;
  productName: string;
  timeAgo: string; // ex: "10 min ago"
  variant: string; // leave as "" if there is no variant
  quantity: number;
  status: string;
  total: number;
};

// total sales for each choice in the "Monthly" dropdown
export type SalesPeriod = "Monthly" | "Weekly" | "Yearly";
export type SalesByPeriod = Record<SalesPeriod, number>;

// adds the peso sign and commas, ex: 12201 -> ₱12,201
export function formatPeso(amount: number) {
  return "₱" + amount.toLocaleString("en-PH");
}

// same thing but always 2 decimals, ex: 350 -> ₱350.00
export function formatPesoDecimals(amount: number) {
  return (
    "₱" +
    amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function getDashboardData() {
  const orgName = "Org Name";

  const stats = {
    pendingPaymentVerification: 48,
    pendingClaim: 21,
    completedThisMonth: 84,
    totalOrdersThisMonth: 132,
  };

  const salesByPeriod: SalesByPeriod = {
    Monthly: 32455,
    Weekly: 7820,
    Yearly: 389460,
  };

  const recentOrders: Order[] = [
    {
      id: 1,
      customerName: "Customer Name",
      productName: "Ordered Product",
      timeAgo: "10 min ago",
      variant: "Variant here, if there is any",
      quantity: 1,
      status: "Pending Payment",
      total: 350,
    },
    {
      id: 2,
      customerName: "Customer Name",
      productName: "Ordered Product",
      timeAgo: "25 min ago",
      variant: "Variant here, if there is any",
      quantity: 2,
      status: "Processing",
      total: 700,
    },
    {
      id: 3,
      customerName: "Customer Name",
      productName: "Ordered Product",
      timeAgo: "1 hr ago",
      variant: "",
      quantity: 1,
      status: "Ready for Pickup",
      total: 150,
    },
    {
      id: 4,
      customerName: "Customer Name",
      productName: "Ordered Product",
      timeAgo: "3 hrs ago",
      variant: "Variant here, if there is any",
      quantity: 3,
      status: "Pending Claim",
      total: 1050,
    },
    {
      id: 5,
      customerName: "Customer Name",
      productName: "Ordered Product",
      timeAgo: "Yesterday",
      variant: "Variant here, if there is any",
      quantity: 1,
      status: "Completed",
      total: 250,
    },
  ];

  return { orgName, stats, salesByPeriod, recentOrders };
}
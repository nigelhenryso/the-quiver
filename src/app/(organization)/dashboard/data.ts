// dummy data for the org dashboard
// NOTE: replace this with real data

export type PaymentMode = "FTF" | "Online";

export type OrderItem = {
  name: string; // ex: "LSCS Shirt"
  variant: string; // leave as "" if there is no variant
  quantity: number;
};

export type Order = {
  orderId: string; // ex: "XX01"
  customerName: string;
  timeAgo: string; // ex: "10 min ago"
  items: OrderItem[];
  paymentMode: PaymentMode;
  status: string;
  total: number;
  imageUrl?: string; // product image, falls back to a placeholder box
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

export type DashboardStats = {
  pendingPaymentVerification: number;
  pendingClaim: number;
  completedThisMonth: number;
  totalOrdersThisMonth: number;
};

export function getDashboardData() {
  const orgName = "Org Name";

  const stats: DashboardStats = {
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
      orderId: "XX01",
      customerName: "Customer Name",
      timeAgo: "10 min ago",
      items: [
        { name: "LSCS Shirt", variant: "White", quantity: 1 },
        { name: "LSCS Lanyard", variant: "Blue", quantity: 2 },
      ],
      paymentMode: "Online",
      status: "Pending Payment",
      total: 350,
    },
    {
      orderId: "XX02",
      customerName: "Customer Name",
      timeAgo: "25 min ago",
      items: [
        { name: "LSCS Shirt", variant: "White", quantity: 1 },
        { name: "LSCS Lanyard", variant: "Blue", quantity: 2 },
      ],
      paymentMode: "FTF",
      status: "Processing",
      total: 700,
    },
    {
      orderId: "XX03",
      customerName: "Customer Name",
      timeAgo: "1 hr ago",
      items: [
        { name: "LSCS Shirt", variant: "White", quantity: 1 },
        { name: "LSCS Lanyard", variant: "Blue", quantity: 2 },
      ],
      paymentMode: "Online",
      status: "Ready for Pickup",
      total: 150,
    },
    {
      orderId: "XX04",
      customerName: "Customer Name",
      timeAgo: "3 hrs ago",
      items: [
        { name: "LSCS Shirt", variant: "White", quantity: 1 },
        { name: "LSCS Lanyard", variant: "Blue", quantity: 2 },
      ],
      paymentMode: "FTF",
      status: "Pending Claim",
      total: 1050,
    },
    {
      orderId: "XX05",
      customerName: "Customer Name",
      timeAgo: "Yesterday",
      items: [
        { name: "LSCS Shirt", variant: "White", quantity: 1 },
        { name: "LSCS Lanyard", variant: "Blue", quantity: 2 },
      ],
      paymentMode: "Online",
      status: "Completed",
      total: 250,
    },
  ];

  return { orgName, stats, salesByPeriod, recentOrders };
}
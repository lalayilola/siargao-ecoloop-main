export type Role = "farmer" | "restaurant" | "resident" | "lgu_admin";

export const roleMeta: Record<Role, { label: string; color: string }> = {
  farmer: { label: "Farmer", color: "bg-primary/10 text-primary border-primary/20" },
  restaurant: { label: "Restaurant", color: "bg-accent/15 text-accent-foreground border-accent/30" },
  resident: { label: "Resident", color: "bg-ocean/15 text-ocean border-ocean/30" },
  lgu_admin: { label: "LGU", color: "bg-foreground/10 text-foreground border-foreground/20" },
};

export type FeedPost = {
  id: string;
  role: Role;
  author: string;
  barangay: string;
  time: string;
  body: string;
  image?: string;
  kg?: number;
  price?: string;
  date?: string;
};

export const feedPosts: FeedPost[] = [
  {
    id: "1",
    role: "farmer",
    author: "Mang Tonyo's Farm",
    barangay: "General Luna",
    time: "2h ago",
    body: "Fresh harvest today — vine-ripened tomatoes and basil from our highland plot. Can trade for kitchen scraps for our compost pile.",
    image: "produce",
    kg: 35,
    price: "₱80/kg",
    date: "Available now",
  },
  {
    id: "2",
    role: "restaurant",
    author: "Kawayan Kitchen",
    barangay: "Cloud 9",
    time: "5h ago",
    body: "We have ~20kg of vegetable trimmings and fruit peels available daily after lunch service. Pickup window 3–5pm.",
    image: "compost",
    kg: 20,
    date: "Daily",
  },
  {
    id: "3",
    role: "resident",
    author: "Ate Marites",
    barangay: "Catangnan",
    time: "Yesterday",
    body: "Looking to barter coconut husks and banana peels for a kilo of fresh kangkong or pechay this weekend. 🌱",
    kg: 6,
  },
  {
    id: "4",
    role: "farmer",
    author: "Siargao Greens Coop",
    barangay: "Dapa",
    time: "1d ago",
    body: "Harvest schedule: lettuce + arugula ready next Friday. Reserve your order now — first come, first served.",
    image: "produce",
    price: "₱120/kg",
    date: "Fri, Jun 26",
  },
  {
    id: "5",
    role: "restaurant",
    author: "Bravo Beach Resort",
    barangay: "General Luna",
    time: "2d ago",
    body: "Promo: buy any 2 mains, get a free mango shake. We also welcome compost partnerships with local farms.",
    image: "restaurant",
    price: "Promo",
  },
  {
    id: "6",
    role: "resident",
    author: "Kuya Jojo",
    barangay: "Pilar",
    time: "3d ago",
    body: "Household food waste ~8kg/week — happy to drop off at the nearest barangay collection point.",
    kg: 8,
  },
];

export type Listing = {
  id: string;
  title: string;
  kind: "waste" | "produce";
  seller: string;
  role: Role;
  barangay: string;
  kg: number;
  price?: string;
  date: string;
  image: "produce" | "compost" | "restaurant";
};

export const listings: Listing[] = [
  { id: "p1", title: "Heirloom Tomatoes", kind: "produce", seller: "Mang Tonyo's Farm", role: "farmer", barangay: "General Luna", kg: 35, price: "₱80/kg", date: "Today", image: "produce" },
  { id: "p2", title: "Mixed Salad Greens", kind: "produce", seller: "Siargao Greens Coop", role: "farmer", barangay: "Dapa", kg: 18, price: "₱120/kg", date: "Fri, Jun 26", image: "produce" },
  { id: "p3", title: "Organic Herbs Bundle", kind: "produce", seller: "Highland Roots", role: "farmer", barangay: "Pilar", kg: 4, price: "₱60/bundle", date: "Tomorrow", image: "produce" },
  { id: "p4", title: "Sweet Bananas", kind: "produce", seller: "Ate Lina's Plot", role: "farmer", barangay: "Burgos", kg: 25, price: "₱45/kg", date: "Today", image: "produce" },
  { id: "w1", title: "Vegetable Trimmings", kind: "waste", seller: "Kawayan Kitchen", role: "restaurant", barangay: "Cloud 9", kg: 20, date: "Daily 3–5pm", image: "compost" },
  { id: "w2", title: "Fruit Peels & Pulp", kind: "waste", seller: "Bravo Beach Resort", role: "restaurant", barangay: "General Luna", kg: 30, date: "Mon/Wed/Fri", image: "compost" },
  { id: "w3", title: "Household Scraps", kind: "waste", seller: "Ate Marites", role: "resident", barangay: "Catangnan", kg: 6, date: "Weekends", image: "compost" },
  { id: "w4", title: "Coffee Grounds", kind: "waste", seller: "Tide Cafe", role: "restaurant", barangay: "Cloud 9", kg: 5, date: "Daily", image: "compost" },
];

export type PlanningEntry = {
  id: string;
  role: Role;
  author: string;
  need: string;
  when: string;
  kg?: number;
};

export const planning: PlanningEntry[] = [
  { id: "n1", role: "farmer", author: "Mang Tonyo's Farm", need: "Need food waste for compost production", when: "Next month", kg: 50 },
  { id: "n2", role: "restaurant", author: "Kawayan Kitchen", need: "Expected vegetable scraps available weekly", when: "Starting July", kg: 30 },
  { id: "n3", role: "resident", author: "Tita Cora", need: "Looking to buy organic tomatoes", when: "Next month", kg: 5 },
  { id: "n4", role: "farmer", author: "Siargao Greens Coop", need: "Pre-orders open for August lettuce harvest", when: "August", kg: 200 },
  { id: "n5", role: "restaurant", author: "Bravo Beach Resort", need: "Sourcing organic herbs for new menu", when: "July 15", kg: 12 },
];

export type Trade = {
  id: string;
  from: { name: string; role: Role; gives: string };
  to: { name: string; role: Role; gives: string };
  status: "pending" | "approved" | "completed";
  date: string;
};

export const trades: Trade[] = [
  { id: "t1", from: { name: "Kawayan Kitchen", role: "restaurant", gives: "20kg vegetable scraps" }, to: { name: "Mang Tonyo's Farm", role: "farmer", gives: "10kg fresh tomatoes" }, status: "completed", date: "Jun 12" },
  { id: "t2", from: { name: "Ate Marites", role: "resident", gives: "6kg coconut husks" }, to: { name: "Highland Roots", role: "farmer", gives: "2kg kangkong" }, status: "approved", date: "Jun 14" },
  { id: "t3", from: { name: "Siargao Greens Coop", role: "farmer", gives: "15kg salad greens" }, to: { name: "Bravo Beach Resort", role: "restaurant", gives: "Catered staff meal" }, status: "pending", date: "Jun 16" },
  { id: "t4", from: { name: "Tide Cafe", role: "restaurant", gives: "5kg coffee grounds" }, to: { name: "Mang Tonyo's Farm", role: "farmer", gives: "Free herb basket" }, status: "completed", date: "Jun 10" },
];

export const kpis = {
  wasteCollected: 4820,
  wasteDiverted: 3960,
  activeUsers: 612,
  successfulTrades: 187,
};

export const monthlyWaste = [
  { month: "Jan", collected: 320, diverted: 240 },
  { month: "Feb", collected: 380, diverted: 290 },
  { month: "Mar", collected: 460, diverted: 360 },
  { month: "Apr", collected: 540, diverted: 430 },
  { month: "May", collected: 620, diverted: 510 },
  { month: "Jun", collected: 740, diverted: 620 },
];

export const participation = [
  { name: "Farmers", value: 184 },
  { name: "Restaurants", value: 96 },
  { name: "Residents", value: 312 },
  { name: "LGU staff", value: 20 },
];

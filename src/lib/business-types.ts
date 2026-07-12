export interface BusinessTypeExtraField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
}

export interface BusinessTypeConfig {
  id: string;
  label: string;
  defaultCategories: string[];
  extraFields: BusinessTypeExtraField[];
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    id: "spare_parts",
    label: "Bike Spare Parts",
    defaultCategories: ["Engine", "Brakes", "Electrical", "Body", "Suspension", "Tyres"],
    extraFields: [
      { key: "partNumber", label: "Part Number", type: "text" },
      { key: "compatibleModels", label: "Compatible Models", type: "text" },
    ],
  },
  {
    id: "garments",
    label: "Garments & Textiles",
    defaultCategories: ["Men", "Women", "Kids", "Unstitched", "Accessories"],
    extraFields: [
      { key: "size", label: "Size", type: "text" },
      { key: "color", label: "Color", type: "text" },
      { key: "fabric", label: "Fabric", type: "text" },
    ],
  },
  {
    id: "hardware",
    label: "Hardware & Tools",
    defaultCategories: ["Hand Tools", "Power Tools", "Fasteners", "Plumbing", "Electrical"],
    extraFields: [
      { key: "warrantyMonths", label: "Warranty (months)", type: "number" },
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    defaultCategories: ["Mobiles", "Accessories", "Appliances", "Computers", "Cables"],
    extraFields: [
      { key: "warrantyMonths", label: "Warranty (months)", type: "number" },
      { key: "serialNumber", label: "Serial Number", type: "text" },
    ],
  },
  {
    id: "grocery",
    label: "Grocery / Food",
    defaultCategories: ["Packaged Food", "Beverages", "Produce", "Dairy", "Bakery"],
    extraFields: [
      { key: "expiryDate", label: "Expiry Date", type: "date" },
      { key: "batchNo", label: "Batch No.", type: "text" },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy / Medical",
    defaultCategories: ["Medicines", "Supplements", "Medical Devices", "Personal Care"],
    extraFields: [
      { key: "expiryDate", label: "Expiry Date", type: "date" },
      { key: "batchNo", label: "Batch No.", type: "text" },
      { key: "requiresPrescription", label: "Requires Prescription", type: "text" },
    ],
  },
  {
    id: "wholesale",
    label: "Wholesale",
    defaultCategories: ["General Goods", "Bulk Items", "Imported", "Local"],
    extraFields: [
      { key: "cartonSize", label: "Carton Size", type: "text" },
      { key: "minOrderQty", label: "Minimum Order Qty", type: "number" },
    ],
  },
  {
    id: "custom",
    label: "Custom Business",
    defaultCategories: ["General"],
    extraFields: [],
  },
];

const DEFAULT_CONFIG: BusinessTypeConfig = BUSINESS_TYPES.find((t) => t.id === "custom")!;

export function getBusinessTypeConfig(id: string | undefined | null): BusinessTypeConfig {
  return BUSINESS_TYPES.find((t) => t.id === id) ?? DEFAULT_CONFIG;
}

export const CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (₦)" },
  { code: "GHS", symbol: "₵", label: "Ghanaian Cedi (₵)" },
  { code: "KES", symbol: "KSh ", label: "Kenyan Shilling (KSh)" },
  { code: "UGX", symbol: "USh ", label: "Ugandan Shilling (USh)" },
  { code: "TZS", symbol: "TSh ", label: "Tanzanian Shilling (TSh)" },
  { code: "ZAR", symbol: "R", label: "South African Rand (R)" },
  { code: "XOF", symbol: "CFA ", label: "West African CFA (CFA)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
];

export function currencySymbol(code?: string | null): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || "₦";
}
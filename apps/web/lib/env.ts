export const ENV = {
  APTOS_NETWORK: process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet",
  SHELBY_API_URL: process.env.NEXT_PUBLIC_SHELBY_API_URL || "",
  
  // Necessary for real Move contract calls. Example: "0x123...abc"
  MODULE_ADDRESS: process.env.NEXT_PUBLIC_MODULE_ADDRESS || "",
  
  USE_MOCK_SHELBY: process.env.NEXT_PUBLIC_USE_MOCK_SHELBY !== "false", // Default to true if not set
  USE_MOCK_APTOS: process.env.NEXT_PUBLIC_USE_MOCK_APTOS !== "false",   // Default to true if not set
};

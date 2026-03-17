import { createShelbyService } from "shelby-sdk";
import { createAptosService } from "aptos-adapter";
import { ENV } from "./env";

export const shelbyClient = createShelbyService(ENV.USE_MOCK_SHELBY);

// Pass network and module address to Aptos factory for real testnet integration
export const aptosContractClient = createAptosService(
  ENV.USE_MOCK_APTOS, 
  ENV.APTOS_NETWORK, 
  ENV.MODULE_ADDRESS
);

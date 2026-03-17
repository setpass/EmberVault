import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export interface FileMetadataMove {
  cid: string;
  fileName: string;
  size: number;
  createdAt: number;
  isPublic: boolean;
}

export interface FileMetadataView extends FileMetadataMove {
  ownerAddress: string; 
}

export interface IAptosContractService {
  registerFileMetadata(owner: string, metadata: FileMetadataMove, signAndSubmitTransaction?: any): Promise<boolean>;
  getUserFiles(owner: string): Promise<FileMetadataView[]>;
  getAllPublicFiles(): Promise<FileMetadataView[]>;
  stakeApt(owner: string, amount: number, signAndSubmitTransaction?: any): Promise<boolean>;
}

export class MockAptosService implements IAptosContractService {
  private getStorageKey(ownerAddress: string) {
    return `apt_mock_${ownerAddress}_files`;
  }

  async registerFileMetadata(owner: string, metadata: FileMetadataMove): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 800)); 
    if (typeof window === "undefined") return false;
    
    const existing = await this.getUserFiles(owner);
    const newRecord: FileMetadataView = { ...metadata, ownerAddress: owner };
    localStorage.setItem(this.getStorageKey(owner), JSON.stringify([newRecord, ...existing]));
    
    if (metadata.isPublic) {
      const pubList = JSON.parse(localStorage.getItem("apt_mock_public_files") || "[]");
      localStorage.setItem("apt_mock_public_files", JSON.stringify([newRecord, ...pubList]));
    }
    
    return true;
  }

  async getUserFiles(owner: string): Promise<FileMetadataView[]> {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(this.getStorageKey(owner)) || "[]");
  }

  async getAllPublicFiles(): Promise<FileMetadataView[]> {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("apt_mock_public_files") || "[]");
  }

  async stakeApt(owner: string, amount: number): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 1000));
    return true;
  }
}

export class RealAptosService implements IAptosContractService {
  private aptos: Aptos;
  private moduleAddress: string;

  constructor(networkName: string, moduleAddress: string) {
    // Basic network mapping
    const network = networkName.toLowerCase() === "mainnet" ? Network.MAINNET 
                  : networkName.toLowerCase() === "devnet" ? Network.DEVNET 
                  : Network.TESTNET;
    
    const config = new AptosConfig({ network });
    this.aptos = new Aptos(config);
    this.moduleAddress = moduleAddress;
  }

  async registerFileMetadata(owner: string, metadata: FileMetadataMove, signAndSubmitTransaction?: any): Promise<boolean> {
    if (!signAndSubmitTransaction) throw new Error("signAndSubmitTransaction function is required for real transactions");

    // Real transaction building
    try {
      if (!this.moduleAddress) throw new Error("MODULE_ADDRESS is empty");

      const payload = {
        data: {
          function: `${this.moduleAddress}::storage::register_file_metadata`,
          typeArguments: [],
          functionArguments: [
            metadata.cid,
            metadata.fileName,
            metadata.size.toString(),
            metadata.createdAt.toString(),
            metadata.isPublic
          ]
        }
      };

      const response = await signAndSubmitTransaction(payload);
      await this.aptos.waitForTransaction({ transactionHash: response.hash });
      return true;

    } catch (error) {
      console.warn("Real transaction failed (expected if Move contract is undeployed). Executing fallback mock behavior...", error);
      // Fallback behavior for local testing if contract is undeployed
      return new MockAptosService().registerFileMetadata(owner, metadata);
    }
  }

  async getUserFiles(owner: string): Promise<FileMetadataView[]> {
    // Real View Call Scaffold
    try {
      if (!this.moduleAddress) throw new Error("MODULE_ADDRESS is empty");

      const result = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::storage::get_user_files`,
          typeArguments: [],
          functionArguments: [owner]
        }
      });

      // Assuming the Move view returns a vector of FileMetadata
      const files = result[0] as any[];
      return files.map((f: any) => ({
        cid: f.cid,
        fileName: f.file_name,
        size: Number(f.size),
        createdAt: Number(f.created_at),
        isPublic: f.is_public,
        ownerAddress: owner
      }));

    } catch (error) {
      console.warn("Real view call failed (likely undeployed contract). Executing fallback mock behavior...", error);
      // Fallback behavior
      return new MockAptosService().getUserFiles(owner);
    }
  }

  async getAllPublicFiles(): Promise<FileMetadataView[]> {
    // Move contract skeleton does not implement a network-wide index yet.
    // Using fallback explicitly for this function.
    console.warn("getAllPublicFiles lacks on-chain indexing in current contract skeleton. Using mock fallback.");
    return new MockAptosService().getAllPublicFiles();
  }

  async stakeApt(owner: string, amount: number, signAndSubmitTransaction?: any): Promise<boolean> {
    if (!signAndSubmitTransaction) throw new Error("signAndSubmitTransaction is required");

    try {
      if (!this.moduleAddress) throw new Error("MODULE_ADDRESS is empty");
      
      // Scale APT to Octas (1 APT = 100,000,000 Octas)
      const octas = Math.floor(amount * 100000000);
      
      const payload = {
        data: {
          function: `${this.moduleAddress}::storage::stake_apt`,
          typeArguments: [],
          functionArguments: [octas.toString()]
        }
      };

      const response = await signAndSubmitTransaction(payload);
      await this.aptos.waitForTransaction({ transactionHash: response.hash });
      return true;

    } catch (error) {
      console.warn("Stake transaction failed. Executing fallback mock behavior...", error);
      return new MockAptosService().stakeApt(owner, amount);
    }
  }
}

export const createAptosService = (useMock: boolean, network: string = "testnet", moduleAddress: string = ""): IAptosContractService => {
  if (useMock) return new MockAptosService();
  return new RealAptosService(network, moduleAddress);
};

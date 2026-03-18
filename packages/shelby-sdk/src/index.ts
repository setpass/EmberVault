export interface ShelbyUploadResponse {
  cid: string;
  providerUrl: string;
}

export interface IShelbyProtocol {
  uploadFile(file: File): Promise<ShelbyUploadResponse>;
  downloadFile(cid: string): Promise<string>;
}

export class MockShelbyService implements IShelbyProtocol {
  async uploadFile(file: File): Promise<ShelbyUploadResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      cid: `bafybe${Math.random().toString(36).substring(2, 12)}`,
      providerUrl: "mock-local-node",
    };
  }

  async downloadFile(cid: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const fakeContent = `[Mock File Data]\nCID: ${cid}\nGenerated at: ${new Date().toISOString()}\n\nThis is a mock implementation of Shelby SDK download.`;
    const blob = new Blob([fakeContent], { type: "text/plain" });
    return URL.createObjectURL(blob);
  }
}

export const createShelbyService = (useMock: boolean): IShelbyProtocol => {
  if (!useMock) {
    console.warn("Real ShelbyService is not implemented yet. Falling back to MockShelbyService safely.");
  }
  return new MockShelbyService();
};

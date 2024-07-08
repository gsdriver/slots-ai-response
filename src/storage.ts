import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

// Save this as a global connection to blob storage
let blobServiceClient: BlobServiceClient;

const uploadBlobFromString = async (containerClient, blobName, fileContentsAsString) => {
    // Create blob client from container client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
    await blockBlobClient.upload(fileContentsAsString, fileContentsAsString.length);
};

export const storeResponse = async (result: 'win' | 'lose', input: any, prompt: string, response: string) => {
  try {
    if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY) {
      // Get the blob client if not already instantiated
      if (!blobServiceClient) {
        const sharedKeyCredential: StorageSharedKeyCredential = new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT_NAME, process.env.AZURE_STORAGE_ACCOUNT_KEY);

        blobServiceClient = new BlobServiceClient(
          `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
          sharedKeyCredential
        );
      }

      // Upload the response to the blob storage
      const userId = (input.userId || 'default').replace(/[^a-zA-Z0-9]/g, "");
      const containerClient = await blobServiceClient.getContainerClient('prompts');
      uploadBlobFromString(containerClient, `${result}/${userId}/${result}${Date.now().valueOf()}.json`, JSON.stringify(Object.assign(input, { prompt, response })));
    }
  } catch (e) {
    console.log(`Storage error: ${e}`);
  }
};

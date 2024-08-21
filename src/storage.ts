import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";

// Save this as a global connection to blob storage
let blobServiceClient: BlobServiceClient;

const uploadBlobFromString = async (containerClient, blobName, fileContentsAsString) => {
    // Create blob client from container client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
    await blockBlobClient.upload(fileContentsAsString, fileContentsAsString.length);
};

export const storeResponse = async (wonSpin: boolean, input: any, prompt: string, response: string) => {
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
      const userId: string = (input.userId || 'default').replace(/[^a-zA-Z0-9]/g, "");
      const containerClient: ContainerClient = await blobServiceClient.getContainerClient('prompts');
      const date: Date = new Date();
      const formattedDate: string = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      uploadBlobFromString(containerClient, `${formattedDate}/${userId}/${wonSpin ? "win" : "lose"}${Date.now().valueOf()}.json`, JSON.stringify(Object.assign(input, { prompt, response })));
    }
  } catch (e) {
    console.log(`Storage error: ${e}`);
  }
};

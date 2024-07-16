require("dotenv").config();
const { stringify } = require("csv-stringify/sync");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const fs = require("fs");

const formatDateTime = (timestamp) => {
  // Format the timestamp as a date and time
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const streamToBuffer = async (readableStream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });

    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    readableStream.on("error", reject);
  });
};

const considerBlob = (blob, params) => {
  if (params.old) {
    return blob.name.startsWith("win") || blob.name.startsWith("lose");
  } else {
    // Otherwise, we look at the date range
    const date = new Date(blob.name.split("/")[0]);
    if (isNaN(date.getTime())) {
      return false;
    }

    return date >= params.start && (!params.end || date <= params.end);
  }
};

const savePrompts = (prompts, file) => {
  const data = prompts.map((prompt) => {
    return {
      userId: prompt.userId,
      timestamp: formatDateTime(prompt.timestamp),
      prompt: prompt.prompt,
      response: prompt.response,
      status: prompt.status,
      games: prompt.games,
      wins: prompt.wins,
      losses: prompt.losses,
      speech: prompt.speech,
    };
  });

  const csv = stringify(data, {
    header: true,
  });

  fs.writeFileSync(file, csv);
};

const readPrompts = async (params) => {
  let blobServiceClient;
  let blobList;
  const prompts = [];

  if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY) {
    // Get the blob client if not already instantiated
    const sharedKeyCredential = new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT_NAME, process.env.AZURE_STORAGE_ACCOUNT_KEY);

    blobServiceClient = new BlobServiceClient(
      `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      sharedKeyCredential
    );

    // Now read everything in the container
    const containerClient = await blobServiceClient.getContainerClient('prompts');
    blobList = containerClient.listBlobsFlat();

    // Now read each blob in the list
    for await (const blob of blobList) {
      if (considerBlob(blob, params)) {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const downloaded = (await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)).toString();

        prompts.push(JSON.parse(downloaded));
      }
    }
  }

  return prompts;
};

// Paramters are [-old] [-start] date [-end] date [-file] output
const processParameters = () => {
  const params = {};
  let index;

  if (!process.argv) {
    return null;
  }

  index = process.argv.indexOf("-old");
  if (index > -1) {
    params.old = true;  
  } else {
    index = process.argv.indexOf("-start");
    if (index === -1) {
      // Invalid, one of old or start must be set
      params.error = "Invalid parameters - must include -old or -start";
    } else {
      // Extract the start date
      params.start = new Date(process.argv[index + 1]);
      if (isNaN(params.start.getTime())) {
        params.error = "Invalid start date";
        delete params.start;
      } else {
        // Check for an end date
        index = process.argv.indexOf("-end");
        if (index > -1) {
          params.end = new Date(process.argv[index + 1]);
          if (isNaN(params.end.getTime())) {
            params.error = "Invalid end date";
            delete params.end;
          }
        }
      }
    }
  }

  // Check for file parameter
  if (!params.error) {
    index = process.argv.indexOf("-file");
    if (index > -1) {
      params.file = process.argv[index + 1];
      if (params.file.indexOf(".") === -1) {
        params.file += ".csv";
      }
    } else {
      params.file = "output.csv";
    }
  }

  return params;
};

const main = async () => {
  const params = processParameters();
  if (params.error) {
    console.log(params.error);
    return;
  }

  // Read the prompts
  const prompts = await readPrompts(params);
  savePrompts(prompts, params.file);
};

main();

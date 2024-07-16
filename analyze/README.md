## slots-ai-analysis
Companion command-line tool to slots-ai-response that allows you to access the prompt used and response given from OpenAI

# Usage
To use this repo, copy the `.sample-env` file to `.env` and set environment variables for your own project:

* AZURE_STORAGE_ACCOUNT_NAME: A blob storage account which holds prompts and responses for later analysis
* AZURE_STORAGE_ACCOUNT_KEY: The key for the blob storage noted above

# Parameters
When calling this application, the format is:

```
node index.js [-old] [-start] date [-end] date [-file] output
```

* -old: If present, this will only pull results from the older, dateless version
* -start: This is the start date in YYYY-MM-DD format to begin extracting results
* -end: This is the end date of the range of extraction
* -file: The CSV file to output the results of the extraction

Note that one of `old` or `start` must be present. `end` is optional and can only be used in conjunction with start. `file` is optional - if not present, the default value "output.csv" will be used.

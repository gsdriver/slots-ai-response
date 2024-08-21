import { HttpRequest } from "@azure/functions";

export const getTimestamp = (request: HttpRequest): number => {
  let timestamp: number = parseInt(request.query.get('timestamp') as string);
  if (!timestamp || isNaN(timestamp)) {
      timestamp = Date.now();
  }

  return timestamp;
};

// For some reason calling request.query.get isn't working even though I see it in the string representation??
export const getRequestParameter = (request: HttpRequest, name: string, type: 'number' | 'string'): string | number => {
    const params: string[] = request.query.toString().split('&');
    let value: string | number;

    // This should just be value = request.query.get(name)
    params.forEach((param: string) => {
        const values: string[] = param.split('=');
        if (values[0] === name) {
            value = values.slice(1).join('=');
        }
    });

    if (type === 'number') {
        value = parseInt(value as string, 10);
    } else {
        if (!value) {
            return null;
        }
        value = (value as string).replace(/\+/g, '%20');
        value = decodeURIComponent(value as string);
    }

    return value;
};

export class ApiClient {
  static async get(endpoint: string) {
    const response = await fetch(endpoint);
    return response.json();
  }
}
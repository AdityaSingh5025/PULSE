import { videoInterface } from "@/model/Vdeo";
export type videoformData = Omit<videoInterface, "_id">

type fetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

class APIClient {
  private async fetch<T>(
    endpoint: string,
    options: fetchOptions = {}
  ): Promise<T> {
    const { method = "GET", body, headers } = options;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers
    };

    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }

  async getVideos<T = any>() {
    return this.fetch<T>("video");
  }

  async getVideo<T = any>(id: string) {
    return this.fetch<T>(`video/${id}`);
  }

  async createVideo(videoData: videoformData) {
    return this.fetch("video", {
      method: "POST",
      body: videoData
    });
  }
}

export default new APIClient();

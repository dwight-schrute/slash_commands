import {
  GitbookClientOptions,
  GitbookContent,
  GitbookPage,
  GitbookSearchNode,
  GitbookSpace,
  PathWeight,
} from "./types/index.d.ts";

let pathToFile = "config/page_weights.json";
let WEIGHTS: PathWeight[] = [];
try {
  const data = await fetch(new URL(pathToFile, import.meta.url));
  const jsonData = await data.json();
  WEIGHTS = jsonData as PathWeight[];
} catch (err) {
  console.warn(`Error fetching ${pathToFile}, weights will be default`, err);
}

const getWeightOfPath = (path: string): number => {
  const searchPath = path.startsWith("/") ? path.slice(1) : path;
  const pathValue = WEIGHTS.find((val, _) => {
    const valPath = val.path;
    return searchPath.match(
      new RegExp(`^${valPath.startsWith("/") ? valPath.slice(1) : valPath}$`)
    );
  });
  return pathValue?.weight ?? 1.0;
};

export class GitbookSpaceClient {
  public apiUrl: string;
  public spaceId: string;
  public headers: Headers;
  public version: string;
  public iiGitbookBaseUrl: string =
    "https://indiainvestments.gitbook.io/content";
  constructor(
    token: string,
    { spaceId, gitbookApiUrl, version }: GitbookClientOptions
  ) {
    this.spaceId = spaceId;
    // trim forward slash
    this.apiUrl = gitbookApiUrl.endsWith("/")
      ? gitbookApiUrl.slice(0, -1)
      : gitbookApiUrl;
    this.version = version ?? "v1";
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    this.headers = headers;
  }

  getSpaceUrl(path = "/", params?: URLSearchParams) {
    // trim beginning slash
    const rest = path.startsWith("/") ? path.slice(1, path.length) : path;
    const url = new URL(
      `${this.version}/spaces/${this.spaceId}/${rest}`,
      this.apiUrl
    );
    if (params) {
      url.search = params.toString();
    }
    return url;
  }

  async get(path = "/", params?: URLSearchParams) {
    const url = this.getSpaceUrl(path, params);
    const response = await fetch(url, { headers: this.headers });
    return response.json();
  }

  getSpace(): Promise<GitbookSpace> {
    return this.get();
  }

  getRoot(): Promise<GitbookContent> {
    return this.get("content");
  }

  async searchSpace(query: string) {
    const startTime = Date.now();
    let { results } = (await this.get(
      "search",
      new URLSearchParams({ query })
    )) as { results: GitbookSearchNode[] };
    const timeTaken = (Date.now() - startTime) / (1000);
    results = results
      .map((item) => {
        return {
          ...item,
          url: `${this.iiGitbookBaseUrl}/${item.url}`,
          path: item.url,
        };
      })
      .sort((a, b) => {
        const weightA = getWeightOfPath(a.path);
        const weightB = getWeightOfPath(b.path);
        return weightB - weightA;
      });
    return {
      results,
      timeTaken
    }
  }

  async fetchContentOfPage(path: string, variant = "main") {
    const content: GitbookPage = await this.get(
      `content/v/${variant}/url/${path.startsWith('/') ? path.slice(1) : path}`
    );
    return {
      ...content,
      contentCompletePath: `${path.startsWith('/') ? path.slice(1) : path}`
    }
  }

  async list(query: string, variant = "main") {
    const searchSpace = await this.searchSpace(query);
    const {results: [main], timeTaken} = searchSpace;
    if (!main) {
      throw new Error(`No results found for query: ${query}`);
    }
    const content: GitbookPage = await this.fetchContentOfPage(main.path);
    const page = {
      title: content.title,
      description: content.description,
      url: main.url,
      items: (content.pages ?? []).map((page) => {
        return {
          title: page.title,
          description: page.description,
          url: `${main.url}/${page.path}`,
        };
      }),
    };
    return {
      page,
      timeTaken
    }
  }
}

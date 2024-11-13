abstract class BaseDriver {
  abstract create(collection: string, data: any): Promise<any>;
  abstract read(collection: string, query: any): Promise<any>;
  abstract update(collection: string, query: any, data: any): Promise<any>;
  abstract delete(collection: string, query: any): Promise<any>;

  abstract hasItem(key: string): Promise<boolean>;
  abstract getItem(key: string): Promise<any>;
  abstract setItem(key: string, value: any): Promise<void>;
  abstract removeItem(key: string): Promise<void>;
  abstract getKeys(): Promise<string[]>;
  abstract clear(): Promise<void>;
  abstract watch(callback: (event: string, key: string) => void): () => void;
  abstract dispose(): Promise<void>;
}

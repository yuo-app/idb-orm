abstract class BaseDriver {
  abstract create(collection: string, data: any): Promise<any>;
  abstract read(collection: string, query: any): Promise<any>;
  abstract update(collection: string, query: any, data: any): Promise<any>;
  abstract delete(collection: string, query: any): Promise<any>;
}

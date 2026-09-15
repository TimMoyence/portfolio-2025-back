interface StreamCapacityPlace {
  readonly key: string;
  readonly limit: number;
}

export interface StreamCapacityRequest {
  readonly places: readonly StreamCapacityPlace[];
}

export interface StreamCapacityLease {
  readonly token: string;
  readonly keys: readonly string[];
}

export interface IStreamCapacity {
  acquire(request: StreamCapacityRequest): Promise<StreamCapacityLease | null>;
  refresh(lease: StreamCapacityLease): Promise<void>;
  release(lease: StreamCapacityLease): Promise<void>;
}

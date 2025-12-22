
import { DownloadGate } from '../entities/DownloadGate';
import { CreateGateInput } from '../types/download-gates';

export interface IDownloadGateRepository {
  create(userId: number, input: CreateGateInput): Promise<DownloadGate>;
  findById(userId: number, gateId: string): Promise<DownloadGate | null>;
  findAllByUser(userId: number): Promise<DownloadGate[]>;
  update(userId: number, gateId: string, input: Partial<CreateGateInput>): Promise<DownloadGate>;
  delete(userId: number, gateId: string): Promise<void>;
  findBySlug(slug: string): Promise<DownloadGate | null>;
  incrementDownloadCount(gateId: string): Promise<void>;
  getDownloadCount(gateId: string): Promise<number>;
  incrementViewCount(gateId: string): Promise<void>;
  isSlugAvailable(slug: string, excludeGateId?: string): Promise<boolean>;
}

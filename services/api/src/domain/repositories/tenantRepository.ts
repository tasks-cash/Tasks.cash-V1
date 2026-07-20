import mongoose, { ClientSession, FilterQuery, Model, SortOrder } from "mongoose";
import { DomainNotFoundError, TenantIsolationError, mapMongoError } from "../shared/domainErrors";

/**
 * Base tenant-isolated repository.
 *
 * Every query built here starts from a tenantId — callers cannot reach
 * another tenant's rows by omitting it. Route handlers must go through
 * repositories, never through models directly.
 */

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListOptions {
  page?: number;
  limit?: number;
  /** Whitelisted sort field (validated at the DTO layer). */
  sortBy?: string;
  sortDir?: "asc" | "desc";
  /** Inclusion projection: field names only. */
  fields?: string[];
  includeDeleted?: boolean;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function assertTenantId(tenantId: unknown): asserts tenantId is string {
  if (typeof tenantId !== "string" || tenantId.trim().length === 0) {
    throw new TenantIsolationError();
  }
}

/** Compose the mandatory tenant filter; excludes soft-deleted rows by default. */
export function buildTenantFilter<T>(
  tenantId: string,
  extra: FilterQuery<T> = {},
  includeDeleted = false
): FilterQuery<T> {
  assertTenantId(tenantId);
  const filter: FilterQuery<T> = { ...extra, tenantId };
  if (!includeDeleted) {
    (filter as Record<string, unknown>).deletedAt = { $exists: false };
  }
  return filter;
}

export function buildSort(sortBy: string | undefined, sortDir: "asc" | "desc" | undefined): Record<string, SortOrder> {
  const dir: SortOrder = sortDir === "asc" ? 1 : -1;
  const field = sortBy && /^[a-zA-Z][a-zA-Z0-9_.]{0,64}$/.test(sortBy) ? sortBy : "createdAt";
  // Stable sort: always tie-break on _id.
  return { [field]: dir, _id: dir };
}

export function buildProjection(fields?: string[]): Record<string, 1> | undefined {
  if (!fields?.length) return undefined;
  const projection: Record<string, 1> = {};
  for (const f of fields) {
    if (/^[a-zA-Z][a-zA-Z0-9_.]{0,64}$/.test(f)) projection[f] = 1;
  }
  return Object.keys(projection).length ? projection : undefined;
}

export class TenantRepository<TDoc extends mongoose.Document> {
  constructor(
    protected readonly model: Model<TDoc>,
    protected readonly entityName: string,
    /** Public ID field, e.g. "campaignId". */
    protected readonly publicIdField: string
  ) {}

  async create(tenantId: string, data: Record<string, unknown>, session?: ClientSession): Promise<TDoc> {
    assertTenantId(tenantId);
    try {
      const doc = new this.model({ ...data, tenantId });
      await doc.save({ session });
      return doc;
    } catch (err) {
      mapMongoError(err, this.entityName);
    }
  }

  async findByPublicId(
    tenantId: string,
    publicId: string,
    options: { fields?: string[]; includeDeleted?: boolean; session?: ClientSession } = {}
  ): Promise<TDoc | null> {
    const filter = buildTenantFilter<TDoc>(
      tenantId,
      { [this.publicIdField]: publicId } as FilterQuery<TDoc>,
      options.includeDeleted
    );
    return this.model
      .findOne(filter, buildProjection(options.fields))
      .session(options.session ?? null)
      .exec();
  }

  async requireByPublicId(tenantId: string, publicId: string, session?: ClientSession): Promise<TDoc> {
    const doc = await this.findByPublicId(tenantId, publicId, { session });
    if (!doc) throw new DomainNotFoundError(this.entityName, publicId);
    return doc;
  }

  async list(tenantId: string, extra: FilterQuery<TDoc> = {}, options: ListOptions = {}): Promise<Page<TDoc>> {
    const filter = buildTenantFilter(tenantId, extra, options.includeDeleted);
    const limit = Math.min(Math.max(options.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const page = Math.max(options.page ?? 1, 1);
    const [items, total] = await Promise.all([
      this.model
        .find(filter, buildProjection(options.fields))
        .sort(buildSort(options.sortBy, options.sortDir))
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, page, limit, total, hasMore: page * limit < total };
  }

  /**
   * Save through the loaded document so optimistic concurrency (`version`)
   * and schema/pre-save hooks always run.
   */
  async updateByPublicId(
    tenantId: string,
    publicId: string,
    patch: Record<string, unknown>,
    actor?: string,
    session?: ClientSession
  ): Promise<TDoc> {
    const doc = await this.requireByPublicId(tenantId, publicId, session);
    // tenantId, public ID, and audit fields cannot be patched.
    const {
      tenantId: _t,
      [this.publicIdField]: _p,
      createdAt: _c,
      createdBy: _cb,
      version: _v,
      _id: _i,
      ...safe
    } = patch;
    void _t; void _p; void _c; void _cb; void _v; void _i;
    doc.set(safe);
    if (actor) doc.set({ updatedBy: actor });
    try {
      await doc.save({ session });
      return doc;
    } catch (err) {
      mapMongoError(err, this.entityName);
    }
  }

  async archive(tenantId: string, publicId: string, actor?: string): Promise<TDoc> {
    const doc = await this.requireByPublicId(tenantId, publicId);
    doc.set({ archivedAt: new Date(), archivedBy: actor, updatedBy: actor });
    if ("status" in doc && typeof (doc as Record<string, unknown>).status === "string") {
      const statusPath = this.model.schema.path("status") as { enumValues?: string[] } | undefined;
      if (statusPath?.enumValues?.includes("archived")) doc.set({ status: "archived" });
    }
    try {
      await doc.save();
      return doc;
    } catch (err) {
      mapMongoError(err, this.entityName);
    }
  }

  /** Soft delete — document stays for audit; excluded from default queries. */
  async softDelete(tenantId: string, publicId: string, actor?: string): Promise<TDoc> {
    const doc = await this.requireByPublicId(tenantId, publicId);
    doc.set({ deletedAt: new Date(), deletedBy: actor, updatedBy: actor });
    try {
      await doc.save();
      return doc;
    } catch (err) {
      mapMongoError(err, this.entityName);
    }
  }

  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.model.countDocuments(buildTenantFilter(tenantId, { status } as FilterQuery<TDoc>)).exec();
  }
}

/** Run `fn` in a Mongo transaction when the topology supports it. */
export async function withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

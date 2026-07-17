import { BaseRepository } from './base.repository.js';

export class OrganizationRepository extends BaseRepository {
  /**
   * Return the first organization, creating a default one if none exists.
   * Used to backfill tenant context for existing users during registration.
   */
  async findDefaultOrCreate(): Promise<{ id: string; name: string; slug: string }> {
    // Use upsert to avoid race conditions when multiple requests arrive concurrently
    return this.prisma.organization.upsert({
      where: { slug: 'vestara' },
      update: {},
      create: { name: 'Vestara', slug: 'vestara' },
      select: { id: true, name: true, slug: true },
    });
  }

  /**
   * List all organizations with their member counts.
   */
  async findAll() {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true } },
      },
    });

    return organizations.map((org) => ({
      ...org,
      userCount: org._count.users,
    }));
  }

  /**
   * Find an organization by ID with its member count, or null.
   */
  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true } },
      },
    });
    if (!org) return null;

    return { ...org, userCount: org._count.users };
  }

  /**
   * Find an organization by ID or throw a NotFoundError.
   */
  async findByIdOrThrow(id: string) {
    const org = await this.findById(id);
    this.assertFound(org, 'Organization', id);
    return org;
  }

  /**
   * Find an organization by slug.
   */
  async findBySlug(slug: string) {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  /**
   * Create a new organization.
   */
  async create(data: { name: string; slug: string; logoUrl?: string }) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update an organization's mutable fields.
   */
  async update(id: string, data: { name?: string; logoUrl?: string }) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Count users belonging to an organization.
   */
  async countUsers(organizationId: string): Promise<number> {
    return this.prisma.user.count({ where: { organizationId } });
  }
}

import prisma from "../config/database";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
    });
  }

  async create(data: { name: string; role: "OFFICER" | "ADMIN"; organizationId?: number }) {
    return prisma.user.create({
      data,
    });
  }

  async update(id: string, data: { name?: string }) {
    return prisma.user.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id: Number(id) },
    });
  }
}

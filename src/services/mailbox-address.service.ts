// LAYER 2: SERVICE
// Business logic, format validation, address uniqueness, and role checks.

import { MailboxAddressRepository } from "@/repositories/mailbox-address.repository";

// Simple email regex validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MailboxAddressService = {
  async list() {
    return MailboxAddressRepository.findAll(true);
  },

  async create(
    userRole: string,
    data: { address: string; displayName?: string; isActive?: boolean },
  ) {
    // 1. RBAC check (Only OWNER and ADMIN can create)
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      throw new Error("You do not have permission to add mailbox addresses");
    }

    // 2. Validate email format
    if (!data.address || !EMAIL_REGEX.test(data.address)) {
      throw new Error("Invalid email address format");
    }

    // 3. Verify uniqueness
    const existing = await MailboxAddressRepository.findByAddress(data.address);
    if (existing) {
      throw new Error("Mailbox address already exists");
    }

    return MailboxAddressRepository.create(data);
  },

  async update(
    userRole: string,
    id: string,
    data: { address?: string; displayName?: string; isActive?: boolean },
  ) {
    // 1. RBAC check (Only OWNER and ADMIN can update)
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      throw new Error("You do not have permission to update mailbox addresses");
    }

    const current = await MailboxAddressRepository.findById(id);
    if (!current) {
      throw new Error("Mailbox address not found");
    }

    // 2. Validate format if address is being updated
    if (data.address && data.address !== current.address) {
      if (!EMAIL_REGEX.test(data.address)) {
        throw new Error("Invalid email address format");
      }

      // 3. Verify uniqueness
      const existing = await MailboxAddressRepository.findByAddress(
        data.address,
      );
      if (existing && existing.id !== id) {
        throw new Error("Mailbox address already exists");
      }
    }

    return MailboxAddressRepository.update(id, data);
  },

  async delete(userRole: string, id: string) {
    // 1. RBAC check (Only OWNER and ADMIN can delete)
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      throw new Error("You do not have permission to delete mailbox addresses");
    }

    const current = await MailboxAddressRepository.findById(id);
    if (!current) {
      throw new Error("Mailbox address not found");
    }

    // 2. Perform delete action depending on role
    if (userRole === "OWNER") {
      // Hard delete (cascades related emails inside transaction)
      return MailboxAddressRepository.delete(id);
    } else {
      // ADMIN soft deletes by deactivating
      return MailboxAddressRepository.softDelete(id);
    }
  },
};

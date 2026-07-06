import { apiSuccess } from "@/lib/api-response";
import { UserRepository } from "@/repositories/user.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerCount = await UserRepository.countOwners();
  return apiSuccess({ hasOwner: ownerCount > 0 });
}

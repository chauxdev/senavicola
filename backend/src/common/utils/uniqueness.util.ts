import { ConflictException } from '@nestjs/common';
import { ILike, Not, ObjectLiteral, Repository } from 'typeorm';

export async function ensureUniqueByField<T extends ObjectLiteral>(
  repository: Repository<T>,
  field: keyof T & string,
  value: string | undefined | null,
  options?: {
    excludeId?: string | number;
    idField?: keyof T & string;
    message?: string;
    caseInsensitive?: boolean;
  },
): Promise<void> {
  if (value === undefined || value === null || value === '') {
    return;
  }

  const where: Record<string, unknown> = {
    [field]: options?.caseInsensitive ? ILike(value) : value,
  };

  if (options?.excludeId !== undefined && options?.idField) {
    where[options.idField] = Not(options.excludeId);
  }

  const existing = await repository.findOne({
    where: where as never,
  });

  if (existing) {
    throw new ConflictException(
      options?.message ||
        `Ya existe un registro con el mismo valor en "${String(field)}"`,
    );
  }
}

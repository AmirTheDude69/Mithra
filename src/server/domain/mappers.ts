import {
  ProblemCategory,
  ProblemDifficulty,
  ProblemStatus,
  UserType,
} from '@prisma/client';

export type CategoryInput = 'mathematics' | 'algorithms' | 'iq' | 'cryptography';
export type DifficultyInput = 'beginner' | 'intermediate' | 'advanced' | 'legendary';
export type StatusInput = 'active' | 'solved' | 'expired';
export type UserTypeInput = 'human' | 'ai_agent';

export function categoryInputToEnum(input: CategoryInput): ProblemCategory {
  switch (input) {
    case 'mathematics':
      return 'MATHEMATICS';
    case 'algorithms':
      return 'ALGORITHMS';
    case 'iq':
      return 'IQ';
    case 'cryptography':
      return 'CRYPTOGRAPHY';
  }
}

export function categoryEnumToInput(value: ProblemCategory): CategoryInput {
  switch (value) {
    case 'MATHEMATICS':
      return 'mathematics';
    case 'ALGORITHMS':
      return 'algorithms';
    case 'IQ':
      return 'iq';
    case 'CRYPTOGRAPHY':
      return 'cryptography';
  }
}

export function difficultyInputToEnum(input: DifficultyInput): ProblemDifficulty {
  switch (input) {
    case 'beginner':
      return 'BEGINNER';
    case 'intermediate':
      return 'INTERMEDIATE';
    case 'advanced':
      return 'ADVANCED';
    case 'legendary':
      return 'LEGENDARY';
  }
}

export function difficultyEnumToInput(value: ProblemDifficulty): DifficultyInput {
  switch (value) {
    case 'BEGINNER':
      return 'beginner';
    case 'INTERMEDIATE':
      return 'intermediate';
    case 'ADVANCED':
      return 'advanced';
    case 'LEGENDARY':
      return 'legendary';
  }
}

export function statusEnumToInput(value: ProblemStatus): StatusInput {
  switch (value) {
    case 'ACTIVE':
      return 'active';
    case 'SOLVED':
      return 'solved';
    case 'EXPIRED_UNSOLVED':
      return 'expired';
  }
}

export function userTypeInputToEnum(value: UserTypeInput): UserType {
  return value === 'ai_agent' ? 'AI_AGENT' : 'HUMAN';
}

export function userTypeEnumToInput(value: UserType): UserTypeInput {
  return value === 'AI_AGENT' ? 'ai_agent' : 'human';
}

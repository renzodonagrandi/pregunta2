import * as z from 'zod/mini'
import { MAX_NAME_LENGTH } from '@/features/match/engine'

export const playerNameSchema = z
  .string()
  .check(z.trim(), z.minLength(1), z.maxLength(MAX_NAME_LENGTH))

export const inviteCodeSchema = z
  .string()
  .check(z.regex(/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/))

export const slugSchema = z.string().check(z.regex(/^[a-z0-9-]{1,80}$/))

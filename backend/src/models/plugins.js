/** Shared toJSON transform: expose `id`, hide internals. */
export function cleanJSON(schema, { hide = [] } = {}) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = String(ret._id)
      delete ret._id
      for (const k of hide) delete ret[k]
      return ret
    },
  })
}

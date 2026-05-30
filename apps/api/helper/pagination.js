// Cursor pagination by id, not offset — offset breaks under concurrent inserts
// (rows shift between pages). Fetch `limit + 1` rows to detect a next page
// without a second COUNT query.
//
//   const { take, cursorArgs } = paginate(cursor, limit);
//   const rows = await tx.thing.findMany({ ...cursorArgs, take });
//   return buildPage(rows, limit);
export function paginate(cursor, limit = 20) {
  return {
    take: limit + 1,
    cursorArgs: cursor ? { cursor: { id: cursor }, skip: 1 } : {},
  };
}

export function buildPage(rows, limit, { reverse = false } = {}) {
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;
  const items = reverse ? sliced.reverse() : sliced;
  return { items, nextCursor, hasMore };
}

function groupBy(list, keyGetter) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    let collection = map.get(key);
    if (!collection) {
      collection = [];
      map.set(key, collection);
    }
    collection.push(item);
  });
  return map;
}

function groupByProperties(items, keys) {
  const groups = items.reduce((result, item) => {
    const groupKey = keys
      .map((key) => item[key])
      .join("-")
      .replace(/\s/g, "-");
    if (!result[groupKey]) {
      result[groupKey] = keys.reduce(
        (group, key) => ({ ...group, [key]: item[key] }),
        {}
      );
      result[groupKey].data = [];
    }
    result[groupKey].data.push(item);
    return result;
  }, {});

  return Object.values(groups);
}

module.exports = { groupBy, groupByProperties };

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

module.exports = { groupBy };

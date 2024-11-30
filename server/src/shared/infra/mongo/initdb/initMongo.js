init();

function init() {
  const drawsDb = db.getSiblingDB('buzzy_paint');
  if (!collectionExists('draws')) {
    drawsDb.createCollection('draws');
  }
}

function collectionExists(collectionName, db = db) {
  return db.getCollectionNames().includes(collectionName);
}

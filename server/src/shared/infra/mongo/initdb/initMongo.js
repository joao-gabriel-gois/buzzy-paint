const mongo_user = Deno.env.get("MONGO_ROOT_USER");
const mongo_password = Deno.env.get("MONGO_ROOT_PASSWORD");

(() => {
  try {
    const adminDb = db.getSiblingDB('admin');

    if (!adminDb.getUser(mongo_user)) {
      adminDb.createUser({
        user: mongo_user,
        pwd: mongo_password,
        roles: [{ role: "root", db: "admin" }]
      });
    }

    if (!collectionExists(adminDb, 'draws')) {
      adminDb.createCollection('draws');
    }
  }
  catch(error) {
    console.error("Error in mongo init script! Details:", error);
  }
})();


function collectionExists(collectionName) {
  return db.getCollectionNames().includes(collectionName);
}

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853")

  // remove field
  collection.fields.removeById("json1145142227")

  // add field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1231947254",
    "hidden": false,
    "id": "relation1145142227",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "linkedAssets",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "json1145142227",
    "maxSize": 0,
    "name": "linkedAssets",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // remove field
  collection.fields.removeById("relation1145142227")

  return app.save(collection)
})

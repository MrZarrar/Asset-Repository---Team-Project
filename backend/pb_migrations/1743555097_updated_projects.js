/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853")

  // remove field
  collection.fields.removeById("text376250268")

  // remove field
  collection.fields.removeById("relation1145142227")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1231947254",
    "hidden": false,
    "id": "relation98179393",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "asset_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853")

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text376250268",
    "max": 0,
    "min": 0,
    "name": "project_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1231947254",
    "hidden": false,
    "id": "relation1145142227",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "asset_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("relation98179393")

  return app.save(collection)
})
